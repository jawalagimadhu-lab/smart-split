"""
Smart Split — FastAPI Backend
Entry point: uvicorn main:app --reload
"""
import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.models.database import create_tables
from app.core.config import settings
from app.api import auth, ai, tasks, finance, documents, calendar
from app.api.search import router as search_router
from app.api.export_api import router as export_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("smart_split")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("Smart Split backend starting...")
    await create_tables()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info(f"Database ready. Upload dir: {settings.UPLOAD_DIR}")
    logger.info(f"AI configured: {settings.AI_PROVIDER} / {settings.OLLAMA_MODEL} @ {settings.OLLAMA_BASE_URL}")
    yield
    logger.info("Smart Split backend shutting down.")


app = FastAPI(
    title="Smart Split API",
    description="AI-powered divorce and separation support platform",
    version="1.0.0",
    lifespan=lifespan,
    # Disable docs in production by checking an env var
    docs_url="/docs" if os.getenv("ENVIRONMENT", "development") != "production" else None,
)

# ── CORS ─────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(ai.router)
app.include_router(tasks.router)
app.include_router(finance.router)
app.include_router(documents.router)
app.include_router(calendar.router)
app.include_router(search_router)
app.include_router(export_router)


@app.get("/")
async def root():
    return {
        "name": "Smart Split API",
        "version": "1.0.0",
        "status": "running",
        "ai_model": settings.OLLAMA_MODEL,
        "ai_url": settings.OLLAMA_BASE_URL,
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
