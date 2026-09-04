# Local development helpers. Each target is a thin wrapper around the documented commands.

PYTHONPATH_API := src:apps/api
API_PORT ?= 8000

.PHONY: api web test test-api test-ml web-check train compose-up compose-down

## Run the FastAPI inference service with auto-reload (Terminal 1).
api:
	PYTHONPATH=$(PYTHONPATH_API) python3 -m uvicorn campaign_api.main:app --reload --port $(API_PORT)

## Run the Next.js development server (Terminal 2).
web:
	cd apps/web && npm run dev

## Run every Python test: ML package + API.
test:
	python3 -m pytest -q

## Run only the API tests.
test-api:
	python3 -m pytest -q tests/api

## Run only the ML package tests.
test-ml:
	python3 -m pytest -q tests --ignore=tests/api

## Lint, typecheck, test, and build the web app.
web-check:
	cd apps/web && npm run lint && npm run typecheck && npm run test:run && npm run build

## Regenerate the local model artifact (requires the local training dataset).
train:
	PYTHONPATH=src python3 -m loan_modeling.train

## Build and run both services in containers (requires the local model artifact).
compose-up:
	APP_GIT_COMMIT=$$(git rev-parse --short=12 HEAD) APP_BUILD_TIMESTAMP=$$(date -u +%Y-%m-%dT%H:%M:%SZ) docker compose up --build

## Stop the compose environment.
compose-down:
	docker compose down --remove-orphans
