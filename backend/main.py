from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.app_title,
    description="Regulatory Intelligence & Impact Platform",
    version="0.0.1",
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
