import os
from pydantic import BaseModel

def get_database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        if os.getenv("VERCEL"):
            return "sqlite:////tmp/mediflow.db"
        return "sqlite:///./mediflow.db"
    # SQLAlchemy 2.0 compatibility for postgres:// URLs from Neon/Supabase/Render/Heroku
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url

class Settings(BaseModel):
    PROJECT_NAME: str = "MediFlow — Smart Hospital Bed & Patient Allocation System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY") or "mediflow_super_secure_jwt_secret_key_2026_dev"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Defaults to SQLite for immediate zero-config demo / fallback, compatible with PostgreSQL
    DATABASE_URL: str = get_database_url()
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "*"
    ]

settings = Settings()
