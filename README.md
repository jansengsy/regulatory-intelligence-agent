# Regulatory Intelligence & Impact Platform

## What it does:

This prototype tool is able to ingest regulatory announcements from the Guernsey Financial Services Commission via RSS feeds and display them in a simple dashboard UI.

Users are able to trigger ingestion from the feed. Once injested, they can trigger an AI agent to classify each new item giving it:

- Summary
- Severity
- Type
- Category(s)
- Affected sectors
- Subcategory(s)
- A list of actions needed to be taken
- Key entities the LLM may identify
- Effective date

## Why I chose to build this tool

Compliance and regulation within financial services is something teams need to stay on top of. Regulatory changes and updating sanction lists require teams to manually check multiple sources and read through updates to work out what's relevant. I wanted to explore whether an LLM agent could automate some of this work.

**The core goal was to help speed up this process, filter out the noise, and surface insight easily.**

I chose to start with the GFSC because it's the local regulator and already had an RSS feed available.

## The three main steps:

1. **Ingest** regulatory updates from 13 GFSC RSS feeds, skipping duplicates or already fetched updates, and storing those in the db
2. **Classify** each alert using an LLM agent assigning the fields listed above and providing insight
3. **Displays** alerts in a filterable, sortable dashboard with full detail views

Currently, the ingestion and analysis steps are manual. This could be easily improved through automation. We could setup a cron job on the server to schedule automating fetching. This job could, if new updates are found, trigger the agent to run on any new items.

## Check out the app (git codespace):

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/jansengsy/regulatory-intelligence-agent)

I setup the codespace myself as this project uses my Open Router API key and Langfuse for observability and I wanted to avoid you having to set these up and add credits. The `devcontainer.json` also sets up the dependencies and port forwarding to make your life easier.

Feel free to use this as much as you like as you test, the costs are low and I've provisioned a unique API key for the project with restricted spending.

The Codespace comes pre-loaded with regulatory data. Most alerts are already classified. I've left some recent updates out to allow you to see the fetching and analysis happen in real time.

Once the Codespace is ready, open a terminal in the virtual vs code editor and run:

```bash
make dev
```

This starts both the backend API (port 8000) and frontend dev server (port 5173)

When ready, you will see this output:

![make dev output](./images/make-dev-output.png)

Click the `Local:` link to view the application.

### What to try

1. The dashboard loads with pre-classified GFSC alerts
2. Click **Fetch Feeds** button to pull the latest RSS data (there should be some new alerts)
3. Click **Analyse Pending (count)** button to run the LLM classification agent
4. Use the filters and sort controls to explore the data
5. Click any alert to view its full classification detail

## Architecture

Tree view was generate using the `tree` unix command. I've annotated key areas to highlight

```
├── Makefile
├── README.md
├── agents                               # LLM agent layer
│   ├── __init__.py                      # Loads env and setup observability for all agents in package
│   ├── observability.py                 # Langfuse tracing
│   └── regulatory                       # The regulation classification agent
│       ├── agent.py                     # Agent definition + analyse function
│       ├── prompt.py                    # System prompt for this agent
│       └── tools.py                     # Agent tools (placeholder but could be expanded)
├── backend                              # FastAPI backend
│   ├── config.py                        # Pydantic settings (env vars + defaults)
│   ├── database.py                      # SQLite/SQLModel setup
│   ├── main.py                          # Backend entry point
│   ├── models.py                        # DB Schemas (only alert used, others are for future improvements)
│   ├── routers
│   │   └── alerts.py                    # /api/alerts endpoints (used by frontend)
│   └── services
│       └── feed_service.py              # RSS feed ingestion and feeds dataclass
├── frontend                             # React frontend (using shadcn, tailwind, vite, ts)
│   ├── components.json                  # Shadcn config
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── src
│   │   ├── App.tsx
│   │   ├── api.ts                       # Fetch wrapper for API client
│   │   ├── components                   # UI components
│   │   │   ├── AlertDetail.tsx
│   │   │   ├── AlertsList.tsx
│   │   │   ├── ...
│   │   ├── index.css
│   │   ├── lib
│   │   │   └── utils.ts                 # Shared/reusable utilities
│   │   ├── main.tsx
│   │   └── types
│   │       └── index.ts
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── regsense.db                          # Pre-populated SQLite database
├── requirements.txt
```

## Key Design Decisions

**Multi-agent architecture**

The regulatory classification agent is isolated in its own package (`agents/regulatory/`) with separate files for the agent definition, system prompt, and tools. This makes it straightforward to add additional agents (e.g., portfolio impact, document analysis) without touching the existing code

**Structured LLM output**

The agent uses Pydantic AI's `output_type` parameter with an `AlertClassification` model. This forces the LLM to respond in a validated JSON schema rather than free text, giving us typed, reliable classification results

**GFSC-first, jurisdiction-extensible**

The feed service defines each RSS source as a `FeedSource` dataclass with a URL, category, and jurisdiction. Adding another regulator (e.g., UK FCA) would mean appending to a list, so no structural changes needed

**SQLite for the POC**

Zero-config, file-based, perfect for Codespace deployment. The migration path to PostgreSQL would be changing one connection string in `config.py`

**Feed-based ingestion**

RSS is lightweight and doesn't require API keys from regulators. A production version could add web scraping, email parsing, or direct API integration. This could also be converted to a agent tool/skill to be used by multiple agents (could be added to top level agent package or accessed via an MCP server)

**Observability**

Langfuse tracing is configured in `agents/__init__.py` and fails gracefully if credentials aren't set. This means the app works identically with or without observability. This is applied to all agents.

## Tech Stack

| Layer         | Technology                                       |
| ------------- | ------------------------------------------------ |
| Backend       | Python, FastAPI, SQLModel (SQLite)               |
| LLM           | Pydantic AI + OpenRouter                         |
| Frontend      | React, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Observability | Langfuse                                         |
| RSS Ingestion | feedparser                                       |

I chose this stack and all tools are open source and lightweight.

- I chose to use Pydantic AI because its a type-safe agent framework that fits well with FastAPI/Pydantic. The structured outputs it allows me to define map to my sql models, so agent results flow straight into the db without manual parsing.
- Open Router is nice because it let's me swap between models easily and can be used to automatically select the most practical model for the task.
- Frontend was built using tools I am familiar with using Shadcn to save me building out components myself for this demo

## How I would expand/improve this tool

If progressing this build, the initial improvements I would make would be:

- Add scheduling to the ingestion and analysis pipeline so users don't need to manually update data
- Adding retry logic to fetching and queues for analysis (which is currently slow when doing lots of alerts)
- Add alerting for any critical alerts to avoid things being missed/manual checking
- Flesh out the agent with tools to query company knowledge or external sources if needed for classification
- Host properly and implement real DB like postgres (possibly using pgvector to allow users to search for alerts but probably a bit overkill for what this currently is)
- The ability to mark alerts as 'actioned/complete' to keep the feed clean
- Alert pagination
- Additional prompts/information about HFL so the agent can better determine how to categorise and choose severity

For feature expansion, we could

- Digest/summary emails, weekly, summarising changes in regulation/sanctions
- Audit trails (LLM trace for how classifications were made, which model was used, cost)
- Pluggable ingestion architecture. Allowing more sources beyond RSS feeds (email lists, PDFs, gazette notes)
- Cross-reference regulatory alerts against a portfolio of holdings (also referencing live market data) to show which holdings are affected by new regulations and estimate portfolio impact
- Timeline/calendar view to track upcoming deadlines/implementation dates
- Allow users to upload compliance documentation/build a new agent to check company compliance data and flag sections that may need updating based on changes
- Referencing company data, email anyone relevant if a client appears on sanctions list
- Add support for more jurisdictions for broader checking/application
- Authentication and RBAC by hooking into your Entra tenant
- Add more compliance/due diligence agents to allow for a more comprehensive platform (Know your client might be a good place to start)
