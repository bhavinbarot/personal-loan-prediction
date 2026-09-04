# 009 — Package each service as its own container with the artifact baked in

## Context

Deployment needs reproducible images for two services with different runtimes
(Python and Node). The model artifact is Git-ignored (ADR 004 keeps the training
data private, and the artifact is regenerable), so the image build must obtain it
from somewhere without tracking it.

## Decision

- One image per service: `apps/api/Dockerfile` (python:3.13-slim, two stages) and
  `apps/web/Dockerfile` (node:24-alpine, three stages using Next.js standalone
  output). Both run as non-root users and define liveness health checks.
- The API image copies `artifacts/model.joblib` from the build context at build
  time. The artifact is produced locally by `make train` and is never committed.
- Runtime Python dependencies for the image are pinned in `apps/api/requirements.txt`
  to the versions recorded in the artifact metadata (scikit-learn 1.9.0).
- Release provenance (`APP_GIT_COMMIT`, `APP_BUILD_TIMESTAMP`) is passed as build
  arguments and surfaced by `/metadata`.
- `docker-compose.yml` gates the web service on the API's `/ready` check.

## Alternatives considered

- **Mount the artifact as a volume at runtime**: keeps images model-free, but makes
  "which model is running" depend on host state instead of the image tag.
- **Download the artifact from object storage at startup**: appropriate for larger
  models or frequent retraining; adds a dependency and credentials for a 6 MB file.
- **One image with both services**: simpler to ship, but couples release cycles and
  mixes runtimes.
- **Unpinned dependencies in the image**: risks loading a joblib bundle with a
  different scikit-learn version than it was trained with.

## Why

An image that contains exactly one model version, one code commit, and pinned
libraries is the simplest unit to test, roll back, and identify in production.

## Tradeoffs

Retraining requires rebuilding the API image, and the build context must contain the
artifact, so CI will need to either train from data it does not have or use a
published artifact; that is deferred to the CI decision.

## Status

Accepted.
