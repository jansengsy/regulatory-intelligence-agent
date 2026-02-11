import logging

from langfuse import get_client
from pydantic_ai import Agent

logger = logging.getLogger(__name__)


def setup_observability() -> bool:
    langfuse = get_client()

    if langfuse.auth_check():
        logger.info("Langfuse connected - agent tracing enabled")
        Agent.instrument_all()
        return True

    logger.warning("Langfuse auth failed - continuing without observability")
    return False
