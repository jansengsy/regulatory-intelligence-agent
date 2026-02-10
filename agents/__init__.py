"""Agent package - all LLM-powered agents live here.

Each agent gets its own sub-package with:
  - agent.py   - the Agent instance and service functions
  - prompt.py  - the system prompt
  - tools.py   - any agent tools (optional)

Shared utilities (e.g. observability) live at this level.
"""

from dotenv import load_dotenv
from agents.observability import setup_observability

load_dotenv()
setup_observability()
