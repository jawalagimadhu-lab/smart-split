"""
Smart Split — AI API
Endpoints: /ai/status, /ai/conversations, /ai/chat (streaming SSE),
           /ai/rag-query, /ai/document-intel
"""
import asyncio
import json
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.models.database import get_db
from app.models.models import Conversation, Message, User
from app.core.security import get_current_user_id
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["ai"])

# Track active abort events per conversation to support cancellation
# Maps conversation_id -> asyncio.Event
_active_streams: dict[str, asyncio.Event] = {}


def utcnow():
    return datetime.now(timezone.utc)


# ── Schemas ──────────────────────────────────────────────────
class ConversationCreate(BaseModel):
    title: str = "New conversation"


class ConversationPatch(BaseModel):
    title: str


class ChatRequest(BaseModel):
    conversation_id: str
    message: str
    use_rag: bool = False          # whether to retrieve from user's document index


class ChatCancelRequest(BaseModel):
    conversation_id: str


class DocumentIntelRequest(BaseModel):
    document_id: str
    operation: str   # summarize | extract_dates | extract_parties | terminology | lawyer_questions
    text_excerpt: str   # frontend sends extracted text (max 8000 chars)


# ── AI Status ────────────────────────────────────────────────
@router.get("/status")
async def get_ai_status(_: str = Depends(get_current_user_id)):
    return await ai_service.check_connection()


# ── Cancel an active stream ───────────────────────────────────
@router.post("/cancel")
async def cancel_stream(
    req: ChatCancelRequest,
    user_id: str = Depends(get_current_user_id),
):
    event = _active_streams.get(req.conversation_id)
    if event:
        event.set()
        return {"cancelled": True}
    return {"cancelled": False, "reason": "No active stream for this conversation"}


# ── Conversations CRUD ────────────────────────────────────────
@router.get("/conversations")
async def list_conversations(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
    )
    convs = result.scalars().all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "created_at": c.created_at.isoformat(),
            "updated_at": c.updated_at.isoformat(),
            "message_count": len(c.messages),
        }
        for c in convs
    ]


@router.post("/conversations", status_code=201)
async def create_conversation(
    req: ConversationCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    conv = Conversation(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title=req.title[:256],
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return {
        "id": conv.id,
        "title": conv.title,
        "created_at": conv.created_at.isoformat(),
        "updated_at": conv.updated_at.isoformat(),
        "message_count": 0,
    }


@router.patch("/conversations/{conv_id}")
async def rename_conversation(
    conv_id: str,
    req: ConversationPatch,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conv_id,
            Conversation.user_id == user_id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conv.title = req.title[:256]
    await db.commit()
    return {"id": conv.id, "title": conv.title}


@router.delete("/conversations/{conv_id}", status_code=204)
async def delete_conversation(
    conv_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conv_id,
            Conversation.user_id == user_id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    await db.delete(conv)
    await db.commit()


@router.get("/conversations/{conv_id}/messages")
async def get_messages(
    conv_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conv_id,
            Conversation.user_id == user_id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return [
        {
            "id": m.id,
            "conversation_id": m.conversation_id,
            "role": m.role,
            "content": m.content,
            "created_at": m.created_at.isoformat(),
        }
        for m in conv.messages
    ]


# ── Chat (streaming SSE) ──────────────────────────────────────
@router.post("/chat")
async def chat(
    req: ChatRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    # Verify conversation ownership — never expose other users' conversations
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == req.conversation_id,
            Conversation.user_id == user_id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    message_text = req.message.strip()
    if not message_text:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Save user message immediately
    user_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conv.id,
        role="user",
        content=message_text,
    )
    db.add(user_msg)
    await db.commit()

    # Build context from existing messages
    context = [
        {"role": m.role, "content": m.content}
        for m in conv.messages
        if m.role in ("user", "assistant")
    ]

    # Get user's jurisdiction and stage for prompt injection
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    jurisdiction = (user.preferences or {}).get("jurisdiction") if user else None

    # Optional RAG context retrieval
    rag_context: Optional[str] = None
    if req.use_rag:
        try:
            from app.services.rag_service import rag_service
            rag_context = await rag_service.retrieve_context(
                user_id=user_id,
                query=message_text,
            )
        except Exception as e:
            logger.warning(f"RAG retrieval failed (non-fatal): {e}")

    # Set up per-conversation abort event
    abort_event = asyncio.Event()
    _active_streams[req.conversation_id] = abort_event

    async def generate():
        full_response: list[str] = []
        try:
            async for chunk in ai_service.stream_chat(
                context,
                jurisdiction=jurisdiction,
                abort_event=abort_event,
                rag_context=rag_context,
            ):
                yield chunk
                # Collect content chunks for DB persistence
                if chunk.startswith("data: ") and "[DONE]" not in chunk:
                    try:
                        data = json.loads(chunk[6:].strip())
                        if "content" in data:
                            full_response.append(data["content"])
                    except (json.JSONDecodeError, KeyError):
                        pass
        finally:
            # Always clean up abort event
            _active_streams.pop(req.conversation_id, None)

            # Persist assistant message if we got content
            full_text = "".join(full_response).strip()
            if full_text:
                try:
                    ai_msg = Message(
                        id=str(uuid.uuid4()),
                        conversation_id=conv.id,
                        role="assistant",
                        content=full_text,
                    )
                    db.add(ai_msg)
                    conv.updated_at = utcnow()
                    await db.commit()
                except Exception as e:
                    logger.error(f"Failed to save assistant message: {e}")

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


# ── Document Intelligence (non-streaming) ────────────────────
@router.post("/document-intel")
async def document_intelligence(
    req: DocumentIntelRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Perform AI analysis on document text provided by the frontend.
    The frontend extracts and sends text; this endpoint runs the configured operation.
    User must explicitly trigger this — no automatic processing.
    """
    from app.models.models import Document
    # Verify the document belongs to this user
    doc_result = await db.execute(
        select(Document).where(
            Document.id == req.document_id,
            Document.user_id == user_id,
        )
    )
    doc = doc_result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Sanitize: treat document text as untrusted data, not system instructions
    # Truncate to prevent prompt injection via very large documents
    safe_text = req.text_excerpt[:8000].replace("</s>", "").replace("[INST]", "").replace("[/INST]", "")

    operation_prompts = {
        "summarize": (
            "Please provide a clear, structured summary of the following document excerpt. "
            "Include the main topics, key points, and any important details. "
            "Do not speculate beyond what is in the text. "
            "If the text is unclear or incomplete, say so."
        ),
        "extract_dates": (
            "Extract all dates, deadlines, and time references from the following document excerpt. "
            "Format each as: [Date/Period] — [Context]. "
            "Only report dates explicitly mentioned in the text. "
            "Do not infer or calculate dates that are not stated."
        ),
        "extract_parties": (
            "Identify all named individuals, organizations, courts, and roles mentioned in the "
            "following document excerpt. Format as: [Name/Role] — [Context]. "
            "Only include parties explicitly named in the text."
        ),
        "terminology": (
            "Identify legal, financial, or technical terms in the following document excerpt "
            "that may be unfamiliar to a non-specialist. "
            "For each term, provide a plain-language explanation. "
            "Format as: **Term** — Plain-language explanation."
        ),
        "lawyer_questions": (
            "Based on the following document excerpt, suggest 5–8 questions that a person "
            "should consider asking their lawyer. "
            "Focus on clarifying important terms, understanding obligations, and identifying "
            "areas that may need professional review. "
            "Do not assume legal outcomes or make legal conclusions."
        ),
    }

    prompt = operation_prompts.get(req.operation)
    if not prompt:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown operation '{req.operation}'. Valid: {list(operation_prompts.keys())}",
        )

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    jurisdiction = (user.preferences or {}).get("jurisdiction") if user else None

    result_text = await ai_service.generate_with_context(
        prompt=prompt,
        context=safe_text,
        jurisdiction=jurisdiction,
        max_tokens=1024,
    )

    if result_text is None:
        raise HTTPException(
            status_code=503,
            detail="AI service unavailable. Is Ollama running?",
        )

    return {
        "operation": req.operation,
        "document_id": req.document_id,
        "document_name": doc.name,
        "result": result_text,
        "disclaimer": (
            "This analysis was generated by AI and may contain errors or omissions. "
            "Review all extracted information carefully before relying on it. "
            "This is not legal advice."
        ),
    }
