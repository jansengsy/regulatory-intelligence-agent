.PHONY: dev install

# Start backend, wait for it to be ready, then start frontend
dev:
	@echo "Starting backend..."
	@uv run uvicorn backend.main:app --reload --port 8000 &
	@echo "Waiting for backend to be ready..."
	@until curl -s http://localhost:8000/health > /dev/null 2>&1; do sleep 0.5; done
	@echo "Backend ready. Starting frontend..."
	@cd frontend && npm run dev

install:
	uv sync
	cd frontend && npm install
