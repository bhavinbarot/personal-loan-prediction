# 008 — Use lightweight application observability

## Context

The application will be deployed and must be diagnosable when it fails, but it is
a two-service demo. An enterprise monitoring stack would add operational load
without adding insight.

## Decision

Implement observability inside the API itself:

- **Structured JSON logs** on stdout with timestamp, level, service, version,
  event name, and request ID (`campaign_api.logging_config`).
- **Request correlation**: an `X-Request-ID` header is honored or generated per
  request, echoed on every response, embedded in every error body, and attached to
  every log line.
- **Latency**: each `request_completed` event carries `duration_ms`.
- **Lifecycle events**: `application_started`, `model_load_started`,
  `model_loaded`, `model_load_failed`, `prediction_failed`,
  `campaign_ranking_failed`, `application_shutdown`.
- **Health versus readiness**: `/health` for liveness, `/ready` for "can infer".
- **Safe metadata**: `/metadata` reports version, commit, build timestamp, schema
  version, and model facts.

Prometheus-style metrics are deferred: request counts and latencies are already
derivable from the structured logs, and a metrics endpoint would add a dependency
and a scrape target with no consumer yet.

## Alternatives considered

- **OpenTelemetry tracing with a collector**: valuable for multi-service call
  graphs; this system has one hop.
- **Hosted APM (Datadog, New Relic)**: cost and vendor coupling for a portfolio.
- **Unstructured text logs**: cheap, but not searchable by request ID or event.

## Why

Logs plus correlation IDs plus readiness answer the operational question that
matters here: "when a user sees a failure, can I find what happened?"

## Tradeoffs

No dashboards or alerting out of the box; those depend on the deployment host and
are evaluated with the deployment work. No payloads are ever logged, so
reproducing a specific bad input requires the user to share it.

## Status

Accepted.
