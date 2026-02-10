"""Regulatory classification agent - analyses raw alerts using an LLM"""

from __future__ import annotations

import logging

from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openrouter import OpenRouterProvider
from sqlmodel import Session, select

from backend.config import get_settings
from backend.models import Alert

from agents.regulatory.prompt import SYSTEM_PROMPT

logger = logging.getLogger(__name__)
settings = get_settings()


# Structured output schema (what the LLM must return for every alert)
class AlertClassification(BaseModel):
    """Structured classification of a regulatory announcement"""

    summary: str = Field(
        description="Plain-English summary of the regulatory change in 2-3 sentences. "
        "Written for a compliance professional, not a lawyer."
    )
    category: str = Field(
        description="Primary regulatory category. Must be one of: "
        "AML/CFT, Consumer Protection, Prudential, Sanctions, Disclosure, "
        "Licensing, ESG/Sustainability, Enforcement, Conduct, Operational Resilience, Other"
    )
    subcategories: list[str] = Field(
        default_factory=list,
        description="More specific tags within the primary category, e.g. ['KYC', 'Sanctions Screening']. "
        "Return an empty list if no subcategories apply.",
    )
    severity: str = Field(
        description="Impact severity. Must be one of: Critical, High, Medium, Low. "
        "Critical = immediate action needed, High = action within weeks, "
        "Medium = review at next cycle, Low = informational only."
    )
    affected_sectors: list[str] = Field(
        default_factory=list,
        description="Which financial sectors are impacted. Choose from: "
        "Banking, Insurance, Investment, Fiduciary, Lending, Pensions, All Sectors. "
        "Return ['All Sectors'] if the regulation applies broadly.",
    )
    action_items: list[str] = Field(
        default_factory=list,
        description="Concrete steps a compliance team should take in response. "
        "Each item should be specific and actionable, e.g. "
        "'Review AML procedures against updated thresholds by Q2 2026'.",
    )
    effective_date: str = Field(
        default="",
        description="When the regulation takes effect, if stated. "
        "Use ISO format (YYYY-MM-DD) if a specific date is given, "
        "or a descriptive string like 'Immediately' or 'Q2 2026'. "
        "Return empty string if not mentioned.",
    )
    key_entities: list[str] = Field(
        default_factory=list,
        description="Organisations, regulatory bodies, or frameworks mentioned. "
        "e.g. ['GFSC', 'FATF', 'Basel III'].",
    )


# Agent instance
model = OpenAIChatModel(
    model_name=settings.model,
    provider=OpenRouterProvider(api_key=settings.openrouter_api_key),
)

regulatory_agent = Agent(
    model,
    system_prompt=SYSTEM_PROMPT,
    output_type=AlertClassification,
    instrument=True,
)


# Analysis service - processes unanalysed alerts
async def analyse_alert(alert: Alert) -> AlertClassification:
    """Run the LLM agent on a single alert and return the classification"""

    user_prompt = (
        f"Title: {alert.title}\n"
        f"Source: {alert.source}\n"
        f"Feed Category: {alert.feed_category}\n"
        f"Published: {alert.published_date}\n\n"
        f"Content:\n{alert.raw_content}"
    )
    result = await regulatory_agent.run(user_prompt)
    return result.output


async def analyse_pending_alerts(
    session: Session,
    limit: int = 10,
) -> list[int]:
    """Find unanalysed alerts, classify them via the LLM, and update the DB"""

    pending = session.exec(
        select(Alert)
        .where(Alert.analysed == False)  # noqa: E712
        .order_by(Alert.id)
        .limit(limit)
    ).all()

    if not pending:
        logger.info("No pending alerts to analyse.")
        return []

    logger.info("Analysing %d pending alerts...", len(pending))
    analysed_ids: list[int] = []

    for alert in pending:
        try:
            classification = await analyse_alert(alert)

            # Map the structured output back onto the Alert row
            alert.summary = classification.summary
            alert.category = classification.category
            alert.subcategories = classification.subcategories
            alert.severity = classification.severity
            alert.affected_sectors = classification.affected_sectors
            alert.action_items = classification.action_items
            alert.effective_date = classification.effective_date
            alert.key_entities = classification.key_entities
            alert.analysed = True

            session.add(alert)
            session.commit()
            session.refresh(alert)

            analysed_ids.append(alert.id)
            logger.info(
                "Alert %d classified: %s / %s",
                alert.id,
                classification.category,
                classification.severity,
            )

        except Exception as exc:
            logger.error("Failed to analyse alert %d: %s", alert.id, exc)
            session.rollback()

    logger.info("Batch complete - %d/%d alerts analysed", len(analysed_ids), len(pending))
    return analysed_ids
