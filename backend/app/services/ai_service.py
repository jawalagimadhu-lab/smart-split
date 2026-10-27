"""
Smart Split — AI Service
Connects to Ollama for local Mistral inference.
All AI calls go through this service — never directly from the frontend.
"""
import json
import asyncio
import time
import logging
from typing import AsyncIterator, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

# ── System prompt ────────────────────────────────────────────
SYSTEM_PROMPT = """You are Smart Split AI, a compassionate and knowledgeable assistant helping people navigate separation and divorce.

Your role:
- Provide clear, accessible general educational information about divorce and separation processes
- Help users organize their thoughts, create checklists, and understand their options
- Assist with drafting respectful communications and preparing for professional consultations
- Support financial planning questions with general guidance (not personalized advice)
- Provide emotional support and wellbeing guidance

Your boundaries:
- You provide GENERAL EDUCATIONAL INFORMATION only — never personalized legal advice
- You do NOT represent any specific jurisdiction unless the user has specified one
- You clearly distinguish between general information and what requires professional legal advice
- You NEVER fabricate laws, court procedures, specific citations, or deadlines
- You do NOT claim to know the current state of any law without uncertainty
- You ALWAYS recommend consulting a qualified family solicitor or attorney for consequential decisions
- You acknowledge uncertainty honestly rather than inventing confident-sounding answers
- You are NOT the user's lawyer and you make this clear when relevant

Your communication style:
- Compassionate, non-judgmental, and supportive
- Clear and accessible — avoid excessive legal jargon without explanation
- Structured when helpful (numbered lists, bullet points for complex topics)
- Honest about limitations and uncertainty
- Respectful of the emotional difficulty of the user's situation

If the user mentions being in immediate danger, always prioritize directing them to emergency services and crisis support resources before anything else.

Remember: Every divorce situation is unique. Always encourage professional legal consultation for decisions that affect legal rights."""


class OllamaService:
    """Service for communicating with the Ollama local AI runtime."""

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL
        self.timeout = settings.AI_REQUEST_TIMEOUT
        self.max_context_messages = settings.AI_MAX_CONTEXT_MESSAGES

    def _build_system(self, jurisdiction: Optional[str] = None) -> str:
        system = SYSTEM_PROMPT
        if jurisdiction:
            system += (
                f"\n\nThe user is located in: {jurisdiction}. Where possible, frame "
                "information with this jurisdiction in mind, but always clarify when "
                "information is general rather than jurisdiction-specific."
            )
        return system

    async def check_connection(self) -> dict:
        """Check whether Ollama is reachable and the configured model is available."""
        start = time.monotonic()
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                elapsed_ms = int((time.monotonic() - start) * 1000)

                if resp.status_code != 200:
                    return {
                        "connected": False,
                        "model": self.model,
                        "status": "unavailable",
                        "message": f"Ollama returned HTTP {resp.status_code}. Is it running?",
                        "latency_ms": elapsed_ms,
                    }

                data = resp.json()
                available_models = [m.get("name", "") for m in data.get("models", [])]

                model_available = any(
                    self.model in m or m.startswith(self.model)
                    for m in available_models
                )

                if not model_available:
                    return {
                        "connected": False,
                        "model": self.model,
                        "status": "model_not_installed",
                        "message": (
                            f"Ollama is running but '{self.model}' is not installed. "
                            f"Run: ollama pull {self.model}"
                        ),
                        "available_models": available_models,
                        "latency_ms": elapsed_ms,
                        "setup_instructions": {
                            "step1": "Install Ollama from https://ollama.com",
                            "step2": "Start the service: ollama serve",
                            "step3": f"Pull the model: ollama pull {self.model}",
                            "step4": "Restart the Smart Split backend",
                        },
                    }

                return {
                    "connected": True,
                    "model": self.model,
                    "status": "connected",
                    "message": f"Connected to Ollama. Model '{self.model}' is ready.",
                    "available_models": available_models,
                    "latency_ms": elapsed_ms,
                }

        except httpx.ConnectError:
            return {
                "connected": False,
                "model": self.model,
                "status": "unavailable",
                "message": (
                    "Cannot connect to Ollama. Make sure it is installed and running. "
                    "Start it with: ollama serve"
                ),
                "latency_ms": None,
                "setup_instructions": {
                    "step1": "Install Ollama from https://ollama.com",
                    "step2": "Start the service: ollama serve",
                    "step3": f"Pull the model: ollama pull {self.model}",
                },
            }
        except httpx.TimeoutException:
            return {
                "connected": False,
                "model": self.model,
                "status": "timeout",
                "message": "Connection to Ollama timed out. Is it running?",
                "latency_ms": None,
            }
        except Exception as e:
            logger.error(f"AI status check error: {e}")
            return {
                "connected": False,
                "model": self.model,
                "status": "error",
                "message": "Unexpected error checking AI status.",
                "latency_ms": None,
            }

    async def stream_chat(
        self,
        messages: list[dict],
        jurisdiction: Optional[str] = None,
        abort_event: Optional[asyncio.Event] = None,
        rag_context: Optional[str] = None,
    ) -> AsyncIterator[str]:
        """
        Stream a chat response from Ollama.
        Yields SSE chunks: 'data: {"content": "..."}\n\n'
        Signals end with: 'data: [DONE]\n\n'
        Signals errors with: 'data: {"error": "..."}\n\n'

        Args:
            messages: Chat history (user/assistant turns only).
            jurisdiction: Optional jurisdiction string injected into the system prompt.
            abort_event: asyncio.Event; when set, stream is cancelled gracefully.
            rag_context: Optional retrieved document context injected before the user's
                         last message to ground the response in real document content.
        """
        system = self._build_system(jurisdiction)

        # Inject RAG context before the last user message
        if rag_context:
            system += (
                "\n\nThe following excerpts were retrieved from the user's uploaded documents "
                "and are relevant to their question. Use them to inform your answer, but "
                "always make clear when you are drawing from user documents versus general knowledge:\n\n"
                f"--- DOCUMENT EXCERPTS ---\n{rag_context}\n--- END EXCERPTS ---\n\n"
                "When referencing document content, mention the document name if known."
            )

        # Trim context to configured maximum
        trimmed = (
            messages[-self.max_context_messages:]
            if len(messages) > self.max_context_messages
            else messages
        )

        payload = {
            "model": self.model,
            "messages": [{"role": "system", "content": system}] + trimmed,
            "stream": True,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9,
                "num_predict": 1024,
            },
        }

        start_time = time.monotonic()

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/api/chat",
                    json=payload,
                ) as response:
                    if response.status_code != 200:
                        yield f"data: {json.dumps({'error': f'Ollama error {response.status_code}'})}\n\n"
                        return

                    first_token = True
                    async for line in response.aiter_lines():
                        # Check for cancellation on each line
                        if abort_event and abort_event.is_set():
                            logger.info("AI stream cancelled by client")
                            yield f"data: {json.dumps({'cancelled': True})}\n\n"
                            return

                        if not line.strip():
                            continue
                        try:
                            chunk = json.loads(line)
                            content = chunk.get("message", {}).get("content", "")
                            if content:
                                if first_token:
                                    ttft_ms = int((time.monotonic() - start_time) * 1000)
                                    yield f"data: {json.dumps({'ttft_ms': ttft_ms})}\n\n"
                                    first_token = False
                                yield f"data: {json.dumps({'content': content})}\n\n"
                            if chunk.get("done", False):
                                total_ms = int((time.monotonic() - start_time) * 1000)
                                # Emit timing metadata before DONE
                                eval_count = chunk.get("eval_count", 0)
                                yield f"data: {json.dumps({'timing_ms': total_ms, 'token_count': eval_count})}\n\n"
                                yield "data: [DONE]\n\n"
                                return
                        except json.JSONDecodeError:
                            continue

        except httpx.ConnectError:
            yield f"data: {json.dumps({'error': 'Cannot connect to Ollama. Is it running?'})}\n\n"
        except httpx.TimeoutException:
            yield f"data: {json.dumps({'error': 'Request timed out. The model may be loading — try again in a moment.'})}\n\n"
        except asyncio.CancelledError:
            # Task was cancelled at the asyncio level (e.g. client disconnect)
            logger.info("AI stream task cancelled")
            return
        except Exception as e:
            logger.error(f"AI stream error: {e}")
            yield f"data: {json.dumps({'error': 'Unexpected AI error. Please try again.'})}\n\n"

    async def generate_embedding(self, text: str) -> Optional[list[float]]:
        """
        Generate an embedding vector for a text using Ollama's embedding endpoint.
        Uses OLLAMA_EMBED_MODEL (default: nomic-embed-text).
        Returns None on failure so callers can handle gracefully.
        """
        embed_model = settings.OLLAMA_EMBED_MODEL
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"{self.base_url}/api/embeddings",
                    json={"model": embed_model, "prompt": text},
                )
                if resp.status_code != 200:
                    logger.error(f"Embedding error: HTTP {resp.status_code}")
                    return None
                data = resp.json()
                return data.get("embedding")
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            return None

    async def generate_with_context(
        self,
        prompt: str,
        context: str,
        jurisdiction: Optional[str] = None,
        max_tokens: int = 1024,
    ) -> Optional[str]:
        """
        Non-streaming single-turn generation for document intelligence tasks
        (summarize, extract dates, etc.). Returns the full response text or None on failure.
        """
        system = self._build_system(jurisdiction)
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": f"{prompt}\n\n---\n{context}"},
            ],
            "stream": False,
            "options": {"temperature": 0.3, "num_predict": max_tokens},
        }
        try:
            async with httpx.AsyncClient(timeout=min(self.timeout, 90)) as client:
                resp = await client.post(f"{self.base_url}/api/chat", json=payload)
                if resp.status_code != 200:
                    return None
                data = resp.json()
                return data.get("message", {}).get("content")
        except Exception as e:
            logger.error(f"AI generation error: {e}")
            return None


# Singleton instance
ai_service = OllamaService()
