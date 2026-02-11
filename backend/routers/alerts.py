"""API routes for regulatory alerts: ingestion, listing, stats, and detail"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, col, func, select

from agents.regulatory import analyse_pending_alerts
from backend.database import get_session
from backend.models import Alert
from backend.services.feed_service import fetch_and_store

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


# POST /api/alerts/fetch - trigger RSS feed ingestion
@router.post("/fetch")
def trigger_fetch(session: Session = Depends(get_session)):
    """Fetch all configured GFSC RSS feeds, store new alerts, skip duplicates"""
    result = fetch_and_store(session)
    return {
        "feeds_fetched": result.feeds_fetched,
        "entries_found": result.entries_found,
        "new_alerts": result.new_alerts,
        "duplicates_skipped": result.duplicates_skipped,
        "errors": result.errors,
    }


# POST /api/alerts/analyse - run LLM classification on pending alerts
@router.post("/analyse")
async def trigger_analyse(
    limit: int = Query(10, ge=1, le=200, description="Max alerts to analyse in this batch"),
    session: Session = Depends(get_session),
):
    """Classify unanalysed alerts via the LLM agent (up to the limit)"""
    analysed_ids = await analyse_pending_alerts(session, limit=limit)
    return {
        "analysed_count": len(analysed_ids),
        "analysed_ids": analysed_ids,
    }


# GET /api/alerts - list alerts with optional filters
@router.get("/")
def list_alerts(
    feed_category: str | None = Query(None, description="Filter by feed category"),
    category: str | None = Query(None, description="Filter by LLM-assigned category"),
    severity: str | None = Query(None, description="Filter by severity level"),
    analysed: bool | None = Query(None, description="Filter by analysis status"),
    limit: int = Query(50, ge=1, le=200, description="Max results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    session: Session = Depends(get_session),
):
    """List alerts, newest first.  All filters are optional and combinable"""
    query = select(Alert)

    if feed_category is not None:
        query = query.where(Alert.feed_category == feed_category)
    if category is not None:
        query = query.where(Alert.category == category)
    if severity is not None:
        query = query.where(Alert.severity == severity)
    if analysed is not None:
        query = query.where(Alert.analysed == analysed)

    query = query.order_by(col(Alert.id).asc()).offset(offset).limit(limit)
    alerts = session.exec(query).all()

    return {"count": len(alerts), "alerts": alerts}


# GET /api/alerts/stats - dashboard summary statistics
@router.get("/stats")
def alert_stats(session: Session = Depends(get_session)):
    """Aggregate counts for the dashboard: totals, by category, severity, etc"""
    total = session.exec(select(func.count(Alert.id))).one()
    analysed_count = session.exec(
        select(func.count(Alert.id)).where(Alert.analysed == True)  # noqa: E712
    ).one()
    pending_count = total - analysed_count

    # Counts grouped by feed_category
    by_feed_category = session.exec(
        select(Alert.feed_category, func.count(Alert.id))
        .group_by(Alert.feed_category)
        .order_by(func.count(Alert.id).desc())
    ).all()

    # Counts grouped by severity (only meaningful once alerts are analysed)
    by_severity = session.exec(
        select(Alert.severity, func.count(Alert.id))
        .where(Alert.severity != "")
        .group_by(Alert.severity)
        .order_by(func.count(Alert.id).desc())
    ).all()

    # Counts grouped by LLM-assigned category
    by_category = session.exec(
        select(Alert.category, func.count(Alert.id))
        .where(Alert.category != "")
        .group_by(Alert.category)
        .order_by(func.count(Alert.id).desc())
    ).all()

    return {
        "total": total,
        "analysed": analysed_count,
        "pending": pending_count,
        "by_feed_category": [
            {"feed_category": cat, "count": cnt} for cat, cnt in by_feed_category
        ],
        "by_severity": [
            {"severity": sev, "count": cnt} for sev, cnt in by_severity
        ],
        "by_category": [
            {"category": cat, "count": cnt} for cat, cnt in by_category
        ],
    }


# GET /api/alerts/{alert_id} - single alert detail
@router.get("/{alert_id}")
def get_alert(alert_id: int, session: Session = Depends(get_session)):
    """Return a single alert by ID, or 404."""
    alert = session.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert
