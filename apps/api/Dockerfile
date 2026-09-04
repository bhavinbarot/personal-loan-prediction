# syntax=docker/dockerfile:1.7
# Production image for the FastAPI inference service.
# Build from the repository root so src/, reports/, and artifacts/ are in context:
#   docker build -f apps/api/Dockerfile -t campaign-api \
#     --build-arg APP_GIT_COMMIT=$(git rev-parse --short=12 HEAD) \
#     --build-arg APP_BUILD_TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ) .

FROM python:3.13-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# ---- dependencies -----------------------------------------------------------
FROM base AS deps
WORKDIR /app
COPY apps/api/requirements.txt ./requirements.txt
RUN pip install --prefix=/install -r requirements.txt

# ---- runtime ----------------------------------------------------------------
FROM base AS runtime
ARG APP_GIT_COMMIT=""
ARG APP_BUILD_TIMESTAMP=""
ENV APP_GIT_COMMIT=${APP_GIT_COMMIT} \
    APP_BUILD_TIMESTAMP=${APP_BUILD_TIMESTAMP} \
    LOAN_MODEL_PATH=/app/artifacts/model.joblib \
    LOAN_REPORTS_DIR=/app/reports \
    PYTHONPATH=/app/src:/app/apps/api \
    PORT=8000

RUN groupadd --system app && useradd --system --gid app --create-home app
WORKDIR /app

COPY --from=deps /install /usr/local
COPY src/ ./src/
COPY apps/api/campaign_api/ ./apps/api/campaign_api/
COPY reports/ ./reports/
# The model artifact is Git-ignored; it must exist locally (make train) before building.
COPY artifacts/model.joblib artifacts/model_metadata.json ./artifacts/

USER app
EXPOSE 8000

# Liveness only: the process answers HTTP. Readiness (/ready) is checked by the orchestrator.
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2).status == 200 else 1)"

CMD ["python", "-m", "uvicorn", "campaign_api.main:app", "--host", "0.0.0.0", "--port", "8000", "--no-access-log"]
