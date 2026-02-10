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
    source: str = Field(index=True)  # "GFSC" or a different source
    feed_category: str = Field(default="", index=True)  # Allows support for multiple feeds
    published_date: str = ""
    raw_content: str = ""

    # AI classification
    summary: str = ""
    category: str = Field(default="", index=True)
    subcategories: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    severity: str = Field(default="", index=True)  # Critical / High / Medium / Low
    affected_sectors: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    action_items: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    effective_date: str = ""
    key_entities: list[str] = Field(default_factory=list, sa_column=Column(JSON))

    # Metadata
    analysed: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=_utcnow)


# Stock Portfolio Holding schema
class PortfolioHolding(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    ticker: str = Field(index=True, unique=True)
    name: str
    sector: str = Field(index=True)
    weight: float
    jurisdiction: str = Field(index=True)

    # Market data (to be populated from yahoo finance)
    current_price: float | None = None
    currency: str = ""
    last_updated: datetime | None = None


# Document schema
class Document(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    filename: str
    content_text: str = ""
    file_size: int = 0

    # AI analysis
    analysis: dict | None = Field(default=None, sa_column=Column(JSON))
    compliance_flags: list[str] = Field(default_factory=list, sa_column=Column(JSON))

    # Metadata
    analysed: bool = Field(default=False)
    uploaded_at: datetime = Field(default_factory=_utcnow)
