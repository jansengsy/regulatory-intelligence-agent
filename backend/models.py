from datetime import datetime, timezone

from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# Base Regulatory Alert schema
class Alert(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    # Source data (from RSS feed)
    title: str
    link: str = Field(index=True, unique=True)
    source: str = Field(index=True)
    feed_category: str = Field(default="", index=True)  # Allows support for multiple feeds
    published_date: str = ""
    raw_content: str = ""

    # AI classification
    summary: str = ""
    category: str = Field(default="", index=True)
    subcategories: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    severity: str = Field(default="", index=True) 
    affected_sectors: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    action_items: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    effective_date: str = ""
    key_entities: list[str] = Field(default_factory=list, sa_column=Column(JSON))

    # Metadata
    analysed: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=_utcnow)
