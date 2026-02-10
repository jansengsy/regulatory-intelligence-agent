from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import get_settings
from backend.database import create_db_and_tables
from backend.models import Alert, Document, PortfolioHolding  # noqa: F401 — linting suppression as models not being used yet

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Runs on startup and shutdown"""
    create_db_and_tables()
    yield


app = FastAPI(
    title=settings.app_title,
    description="Regulatory Intelligence & Impact Platform",
    version="0.0.1",
    lifespan=lifespan,
)

# Dev CORS policy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {
        "status": "alive",
        "app": settings.app_title,
        "version": "0.0.1",
    }
