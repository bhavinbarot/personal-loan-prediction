# 005 — Use FastAPI as the inference boundary

## Context

The validated model is a scikit-learn pipeline packaged in the Python
`loan_modeling` module. The public product interface is a separate web frontend
that must not load Python objects or re-implement scoring, schema validation, or
exact top-K selection.

## Decision

Expose the domain functions over HTTP through a small FastAPI service
(`apps/api/campaign_api`). The service owns artifact loading, request contracts
(Pydantic), CORS, error shaping, logging, and readiness; every prediction and
ranking call delegates to `loan_modeling.predict`. Endpoints: `/health`, `/ready`,
`/metadata`, `/metrics`, `/predict`, `/predict/batch`, `/campaign/rank`,
`/demo/population`.

## Alternatives considered

- **Flask**: familiar, but no first-class request validation or OpenAPI output.
- **Next.js route handlers calling Python via subprocess**: keeps one deployable,
  but couples the presentation layer to a Python runtime and hides the contract.
- **Serving via a generic model server (MLflow, BentoML)**: more machinery than a
  single sklearn pipeline warrants.

## Why

FastAPI gives typed contracts, generated documentation, dependency-light
deployment, and a clean seam for tests: the API tests train a tiny artifact from
synthetic data and never touch the course dataset.

## Tradeoffs

Two deployable services instead of one, and the frontend needs an API origin
configured per environment. In exchange the ML layer stays untouched and
independently testable.

## Status

Accepted.
