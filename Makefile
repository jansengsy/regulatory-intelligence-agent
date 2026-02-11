.PHONY: dev backend frontend install

dev: backend frontend

backend:
	uv run uvicorn backend.main:app --reload --port 8000 &

frontend:
	cd frontend && npm run dev &

install:
	uv sync
	cd frontend && npm install
