from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from backend.config import get_settings

settings = get_settings()

# SQLite needs connect_args for thread safety with FastAPI's async workers
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
    echo=settings.log_level == "DEBUG",
)


def create_db_and_tables():
    """Create all tables defined by SQLModel subclasses with table=True."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Yield a database session for a single request"""
    with Session(engine) as session:
        yield session
