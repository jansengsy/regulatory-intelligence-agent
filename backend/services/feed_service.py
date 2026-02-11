from __future__ import annotations

import logging
import ssl
from dataclasses import dataclass, field

from urllib.request import HTTPSHandler

import certifi
import feedparser
from sqlmodel import Session, select

from backend.models import Alert

logger = logging.getLogger(__name__)

@dataclass(frozen=True)
class FeedSource:
    name: str 
    url: str
    category: str
    jurisdiction: str = "Guernsey"


# GFSC feeds (source: https://www.gfsc.gg/rss-feeds)
GFSC_FEEDS: list[FeedSource] = [
    # Commission feeds
    FeedSource(
        name="GFSC - All News",
        url="https://www.gfsc.gg/article.xml",
        category="General",
    ),
    FeedSource(
        name="GFSC - Financial Crime",
        url="https://www.gfsc.gg/article.xml?tid=55",
        category="Financial Crime",
    ),
    FeedSource(
        name="GFSC - Sanctions",
        url="https://www.gfsc.gg/article.xml?tid=56",
        category="Sanctions",
    ),
    FeedSource(
        name="GFSC - Prohibitions",
        url="https://www.gfsc.gg/article.xml?tid=63",
        category="Prohibitions",
    ),
    # Industry sector feeds
    FeedSource(
        name="GFSC - Banking",
        url="https://www.gfsc.gg/article.xml?tid=50",
        category="Banking",
    ),
    FeedSource(
        name="GFSC - Banking Consultations",
        url="https://www.gfsc.gg/article.xml?tid=50%2C51",
        category="Banking Consultations",
    ),
    FeedSource(
        name="GFSC - Fiduciary",
        url="https://www.gfsc.gg/article.xml?tid=53",
        category="Fiduciary",
    ),
    FeedSource(
        name="GFSC - Fiduciary Consultations",
        url="https://www.gfsc.gg/article.xml?tid=53%2C60",
        category="Fiduciary Consultations",
    ),
    FeedSource(
        name="GFSC - Insurance",
        url="https://www.gfsc.gg/article.xml?tid=49",
        category="Insurance",
    ),
    FeedSource(
        name="GFSC - Insurance Consultations",
        url="https://www.gfsc.gg/article.xml?tid=49%2C60",
        category="Insurance Consultations",
    ),
    FeedSource(
        name="GFSC - Investment",
        url="https://www.gfsc.gg/article.xml?tid=52",
        category="Investment",
    ),
    FeedSource(
        name="GFSC - Investment Consultations",
        url="https://www.gfsc.gg/article.xml?tid=52%2C60",
        category="Investment Consultations",
    ),
    # Consumer feed
    FeedSource(
        name="GFSC - Consumer",
        url="https://www.gfsc.gg/article.xml?tid=57",
        category="Consumer",
    ),
]

DEFAULT_FEEDS: list[FeedSource] = GFSC_FEEDS

# SSL context using certifi
_SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())

@dataclass
class IngestResult:
    feeds_fetched: int = 0
    entries_found: int = 0
    new_alerts: int = 0
    duplicates_skipped: int = 0
    errors: list[str] = field(default_factory=list)


def _parse_entry(entry: feedparser.FeedParserDict, source: FeedSource) -> Alert:
    published = entry.get("published", "")

    raw_content = ""
    if entry.get("content"):
        raw_content = entry.content[0].get("value", "")
    elif entry.get("summary"):
        raw_content = entry.summary

    return Alert(
        title=entry.get("title", "Untitled"),
        link=entry.get("link", ""),
        source=source.jurisdiction,
        feed_category=source.category,
        published_date=published,
        raw_content=raw_content,
    )


def fetch_and_store(
    session: Session,
    feeds: list[FeedSource] | None = None,
) -> IngestResult:
    feeds = feeds or DEFAULT_FEEDS
    result = IngestResult()

    # TODO: Make this scalable
    existing_links: set[str] = set(
        session.exec(select(Alert.link)).all()
    )

    for feed_source in feeds:
        logger.info("Fetching feed: %s (%s)", feed_source.name, feed_source.url)
        try:
            parsed = feedparser.parse(
                feed_source.url,
                handlers=[HTTPSHandler(context=_SSL_CONTEXT)],
            )
        except Exception as exc:
            msg = f"Failed to fetch {feed_source.name}: {exc}"
            logger.error(msg)
            result.errors.append(msg)
            continue

        # feedparser doesn't raise on HTTP errors: check bozo flag 
        if parsed.bozo and not parsed.entries:
            msg = f"Feed error for {feed_source.name}: {parsed.bozo_exception}"
            logger.warning(msg)
            result.errors.append(msg)
            continue

        result.feeds_fetched += 1

        for entry in parsed.entries:
            result.entries_found += 1
            link = entry.get("link", "")

            if not link or link in existing_links:
                result.duplicates_skipped += 1
                continue

            alert = _parse_entry(entry, feed_source)
            session.add(alert)
            existing_links.add(link)
            result.new_alerts += 1

    session.commit()
    logger.info(
        "Ingestion complete: %d new alerts, %d duplicates skipped, %d errors",
        result.new_alerts,
        result.duplicates_skipped,
        len(result.errors),
    )
    return result
