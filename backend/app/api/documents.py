"""
Smart Split — Documents API
Endpoints: /documents (CRUD), /documents/{id}/download,
           /documents/{id}/index, /documents/{id}/index-status
"""
import os
import uuid
import logging
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.models.database import get_db
from app.models.models import Document
from app.core.security import get_current_user_id
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["documents"])

# Allowed MIME types → file extension mapping
ALLOWED_TYPES: dict[str, str] = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/msword": "doc",
    "text/plain": "txt",
    "image/jpeg": "jpg",
    "image/png": "png",
}

MAX_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

# Map extension → MIME type for download response
MIME_MAP = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "doc": "application/msword",
    "txt": "text/plain",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
}


class DocumentPatch(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[list[str]] = None
    is_favorite: Optional[bool] = None


def doc_to_dict(d: Document) -> dict:
    return {
        "id": d.id,
        "user_id": d.user_id,
        "name": d.name,
        "original_name": d.original_name,
        "category": d.category,
        "tags": d.tags or [],
        "description": d.description,
        "file_type": d.file_type,
        "file_size": d.file_size,
        "status": d.status,
        "is_favorite": d.is_favorite,
        "upload_date": d.upload_date.isoformat(),
        "index_status": getattr(d, "index_status", None),
        "index_chunk_count": getattr(d, "index_chunk_count", 0),
    }


# ── List ──────────────────────────────────────────────────────
@router.get("")
async def list_documents(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document)
        .where(Document.user_id == user_id)
        .order_by(Document.upload_date.desc())
    )
    return [doc_to_dict(d) for d in result.scalars().all()]


# ── Upload ────────────────────────────────────────────────────
@router.post("", status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form("other"),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    # Validate content type against allow-list
    content_type = (file.content_type or "").split(";")[0].strip()
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"File type '{content_type}' not supported. Allowed: PDF, DOCX, TXT, JPG, PNG.",
        )

    # Read into memory only for size check — streaming would be better for very large files
    contents = await file.read()
    if len(contents) > MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds {settings.MAX_UPLOAD_SIZE_MB} MB limit.",
        )

    # Save to disk
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = ALLOWED_TYPES[content_type]
    doc_id = str(uuid.uuid4())
    filename = f"{doc_id}.{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    async with aiofiles.open(filepath, "wb") as f:
        await f.write(contents)

    # Sanitize the original filename — strip directory traversal characters
    safe_original = os.path.basename(file.filename or filename)

    doc = Document(
        id=doc_id,
        user_id=user_id,
        name=safe_original,
        original_name=safe_original,
        category=category,
        file_type=ext,
        file_size=len(contents),
        file_path=filepath,
        status="ready",
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    logger.info(f"Document uploaded: {doc_id} ({ext}, {len(contents)} bytes) by user {user_id}")
    return doc_to_dict(doc)


# ── Download ──────────────────────────────────────────────────
@router.get("/{doc_id}/download")
async def download_document(
    doc_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(
            Document.id == doc_id,
            Document.user_id == user_id,  # strict ownership check
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not doc.file_path or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    media_type = MIME_MAP.get(doc.file_type, "application/octet-stream")
    return FileResponse(
        path=doc.file_path,
        media_type=media_type,
        filename=doc.original_name or f"document.{doc.file_type}",
        headers={"Content-Disposition": f'attachment; filename="{doc.original_name}"'},
    )


# ── Update metadata ───────────────────────────────────────────
@router.patch("/{doc_id}")
async def update_document(
    doc_id: str,
    req: DocumentPatch,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(Document.id == doc_id, Document.user_id == user_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    for field, value in req.model_dump(exclude_none=True).items():
        setattr(doc, field, value)

    await db.commit()
    await db.refresh(doc)
    return doc_to_dict(doc)


# ── Delete ────────────────────────────────────────────────────
@router.delete("/{doc_id}", status_code=204)
async def delete_document(
    doc_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(Document.id == doc_id, Document.user_id == user_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove physical file
    if doc.file_path and os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except OSError as e:
            logger.warning(f"Could not delete file {doc.file_path}: {e}")

    # Remove from vector index if indexed
    try:
        from app.services.rag_service import rag_service
        await rag_service.remove_document(user_id=user_id, document_id=doc_id)
    except Exception as e:
        logger.warning(f"Could not remove document {doc_id} from vector index: {e}")

    await db.delete(doc)
    await db.commit()


# ── RAG index trigger ─────────────────────────────────────────
@router.post("/{doc_id}/index")
async def index_document(
    doc_id: str,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger background indexing of a document for RAG retrieval.
    The document text is extracted, chunked, embedded, and stored in ChromaDB.
    The user explicitly initiates this — no automatic processing on upload.
    """
    result = await db.execute(
        select(Document).where(Document.id == doc_id, Document.user_id == user_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not doc.file_path or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=422, detail="File not found on disk — cannot index")

    if doc.file_type not in ("pdf", "txt", "docx"):
        raise HTTPException(
            status_code=422,
            detail=f"Indexing not supported for .{doc.file_type} files. Supported: PDF, TXT, DOCX.",
        )

    # Mark as indexing
    doc.status = "indexing"
    await db.commit()

    # Kick off background task so we return immediately
    background_tasks.add_task(
        _run_indexing,
        doc_id=doc_id,
        user_id=user_id,
        file_path=doc.file_path,
        file_type=doc.file_type,
        doc_name=doc.name,
    )

    return {"status": "indexing", "message": "Indexing started. Check /index-status for progress."}


async def _run_indexing(
    doc_id: str,
    user_id: str,
    file_path: str,
    file_type: str,
    doc_name: str,
):
    """Background task: extract text, chunk, embed, store in ChromaDB."""
    from app.models.database import AsyncSessionLocal
    from app.services.rag_service import rag_service

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Document).where(Document.id == doc_id))
        doc = result.scalar_one_or_none()
        if not doc:
            return

        try:
            chunk_count = await rag_service.index_document(
                user_id=user_id,
                document_id=doc_id,
                file_path=file_path,
                file_type=file_type,
                doc_name=doc_name,
            )
            doc.status = "indexed"
            doc.index_status = "indexed"
            doc.index_chunk_count = chunk_count
            logger.info(f"Document {doc_id} indexed: {chunk_count} chunks")
        except Exception as e:
            logger.error(f"Indexing failed for {doc_id}: {e}")
            doc.status = "ready"
            doc.index_status = "error"

        await db.commit()


# ── Index status ──────────────────────────────────────────────
@router.get("/{doc_id}/index-status")
async def get_index_status(
    doc_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(Document.id == doc_id, Document.user_id == user_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return {
        "document_id": doc_id,
        "status": getattr(doc, "index_status", "not_indexed"),
        "chunk_count": getattr(doc, "index_chunk_count", 0),
        "indexed_at": None,  # Could be added as a column later
    }
