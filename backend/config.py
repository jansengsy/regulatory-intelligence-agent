from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings, loaded from environment variables."""

    openrouter_api_key: str = ""
    model: str = "arcee-ai/trinity-large-preview:free"
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""
    langfuse_base_url: str = "https://cloud.langfuse.com"
    database_url: str = "sqlite:///./regsense.db"
    app_title: str = "RegSense"
    log_level: str = "INFO"
    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

@lru_cache
def get_settings() -> Settings:
    """Cached settings instance: reads .env once, reuses everywhere"""
    return Settings()
