# Operations guide

How to tell what the deployed application is doing, and what to do when it fails.
No secrets or private infrastructure addresses belong in this file.

## Service probes

| Endpoint | Question it answers | Healthy response | Failure response |
| --- | --- | --- | --- |
| `GET /health` | Is the API process alive? | `200 {"status": "healthy"}` | No response (process down) |
| `GET /ready` | Can the API perform inference? | `200 {"status": "ready", "model_loaded": true}` | `503 {"status": "not_ready", "model_loaded": false, "reason": "artifact_missing" \| "artifact_invalid"}` |
| `GET /metadata` | Which code and model are running? | Version, git commit, build timestamp, schema version, model facts | Same shape with `model_loaded: false` and `model: null` |

Use `/health` for restart decisions and `/ready` for routing traffic.

## Containers

| Image | Built from | Listens | Health check | Runs as |
| --- | --- | --- | --- | --- |
| `campaign-api` (`apps/api/Dockerfile`) | repository root | 8000 | `GET /health` every 30s (liveness) | `app` (non-root) |
| `campaign-web` (`apps/web/Dockerfile`) | `apps/web` | 3000 | `GET /` every 30s | `app` (non-root) |

`docker-compose.yml` additionally gates the web service on the API's `/ready`
endpoint (readiness), so a missing or broken artifact keeps the web container from
starting and shows up as `api` stuck in `starting`/`unhealthy` in `docker compose ps`.
Pass `APP_GIT_COMMIT` and `APP_BUILD_TIMESTAMP` at build time; both appear in
`/metadata`. Container logs are the structured JSON lines described below; read them
with `docker compose logs api`.

## Identifying the deployed version

`GET /metadata` returns:

```json
{
  "application": {
    "name": "campaign-api",
    "version": "0.3.0",
    "git_commit": "d964923b1c2a",
    "build_timestamp": "2026-09-04T17:00:00Z",
    "schema_version": "1"
  },
  "model_loaded": true,
  "model": { "model_type": "random_forest", "artifact_version": "1.0", "trained_from_commit": "..." }
}
```

Set `APP_GIT_COMMIT` and `APP_BUILD_TIMESTAMP` when building a release; locally the
commit falls back to `git rev-parse`.

## Request correlation

Every response carries an `X-Request-ID` header. A well-formed incoming
`X-Request-ID` (letters, digits, `.`, `_`, `:`, `-`, up to 128 characters) is
honored; anything else is replaced with a generated ID. Every error body includes
the same ID:

```json
{
  "error": {
    "code": "MODEL_UNAVAILABLE",
    "message": "The trained model artifact is not available. ...",
    "details": [],
    "request_id": "3f0c5b1e9a7d4c2e8b6f1a0d9c8e7f65"
  }
}
```

The frontend shows the request ID in an error's technical details. To investigate a
report, search the API logs for that ID.

## Structured logs

The API writes one JSON object per line to stdout:

```json
{"timestamp": "2026-09-04T17:44:08.004+00:00", "level": "INFO", "service": "campaign-api",
 "version": "0.3.0", "logger": "campaign_api.request", "event": "request_completed",
 "request_id": "3f0c5b1e...", "method": "POST", "route": "/predict", "status": 200, "duration_ms": 6.41}
```

Events to know:

| Event | Meaning |
| --- | --- |
| `application_started` / `application_shutdown` | Process lifecycle |
| `model_load_started` / `model_loaded` | Artifact loaded; includes model type, artifact version, load time |
| `model_load_failed` | `reason` is `artifact_missing` or `artifact_invalid`; the path is never logged |
| `request_completed` | Every request: method, route, status, `duration_ms` (WARNING level for 5xx) |
| `prediction_failed` / `campaign_ranking_failed` | Unhandled failure on an inference route with `error_type` |
| `reports_unavailable` | `/metrics` could not read the tracked report files |

Logs never contain request bodies, customer features, query values, secrets, or
paths. `LOG_LEVEL` controls verbosity (default `INFO`).

## Error codes

| Code | HTTP | When | What the user sees |
| --- | --- | --- | --- |
| `VALIDATION_ERROR` | 422 | Missing or invalid fields, excluded fields (`ID`, `ZIPCode`, `Personal_Loan`), malformed JSON, oversized batch, empty population | Field-level feedback |
| `INVALID_CAMPAIGN_CAPACITY` | 422 | Capacity not strictly between 0 and 1 | Explanatory message |
| `MODEL_UNAVAILABLE` | 503 | Artifact missing or failed to load | "The model is not loaded" state with retry |
| `REPORTS_UNAVAILABLE` | 503 | Tracked report files unreadable | Validated results unavailable state |
| `INTERNAL_ERROR` | 500 | Unexpected exception (logged with request ID, no traceback returned) | Generic retryable error |

## Common failure scenarios

**Model artifact missing.** `/ready` returns 503 with `artifact_missing`; prediction
endpoints return `MODEL_UNAVAILABLE`; the log shows `model_load_failed`. Generate
the artifact with `PYTHONPATH=src python3 -m loan_modeling.train` (needs the local
dataset) or point `LOAN_MODEL_PATH` at a valid bundle, then restart.

**Model artifact corrupt or incompatible.** Same client behaviour with reason
`artifact_invalid` and `error_type` in the log (for example a pickle or sklearn
version error). Rebuild the artifact with the pinned dependencies.

**Frontend shows "The scoring service is unavailable".** The browser could not reach
the API origin: check `NEXT_PUBLIC_API_BASE_URL`, the API process, and
`CORS_ALLOWED_ORIGINS` (preflight failures look like network errors in the browser).

**Validated results unavailable on Overview or Validation.** `/metrics` failed:
either the API is down or `LOAN_REPORTS_DIR` does not contain the tracked
`reports/` files.

## Safe debugging workflow

1. Ask for the request ID shown in the error's technical details.
2. Search the API logs for `"request_id": "<id>"` to find the `request_completed`
   line and any failure event with the same ID.
3. Check `/ready` and `/metadata` to confirm model and version state.
4. Reproduce with the synthetic presets or population; never request the user's
   real inputs.
