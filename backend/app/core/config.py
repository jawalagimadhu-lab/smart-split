from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./smart_split.db"

    # AI / Ollama — Chat
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "mistral"
    AI_PROVIDER: str = "ollama"
    AI_REQUEST_TIMEOUT: int = 120
    AI_MAX_CONTEXT_MESSAGES: int = 12

    # AI / Ollama — Embeddings (for RAG)
    OLLAMA_EMBED_MODEL: str = "nomic-embed-text"
    RAG_CHUNK_SIZE: int = 800       # characters per chunk
    RAG_CHUNK_OVERLAP: int = 100    # overlap between chunks
    RAG_TOP_K: int = 4              # number of chunks to retrieve
    RAG_MIN_RELEVANCE: float = 0.0  # minimum cosine similarity threshold (0 = no filter)

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    # File uploads
    MAX_UPLOAD_SIZE_MB: int = 25
    UPLOAD_DIR: str = "./uploads"

    # ChromaDB (vector store for RAG)
    CHROMA_DIR: str = "./chroma_db"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
