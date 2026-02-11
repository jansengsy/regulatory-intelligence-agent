import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import get_settings
from backend.database import create_db_and_tables
from backend.models import Alert, Document, PortfolioHolding 
from backend.routers import alerts

settings = get_settings()

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)


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


app.include_router(alerts.router)


@app.get("/health")
async def health_check():
    return {
        "status": "alive",
        "app": settings.app_title,
        "version": "0.0.1",
    }
