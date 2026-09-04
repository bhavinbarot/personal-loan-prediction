from __future__ import annotations

import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from typing import Any

from campaign_api import __version__
from campaign_api.observability import get_request_id


SERVICE_NAME = "campaign-api"

# Fields that must never appear in a log record, even if a caller passes them by mistake.
_BLOCKED_EXTRA_FIELDS = {"features", "customers", "record", "records", "payload", "body", "request_body"}

_STANDARD_ATTRS = set(logging.LogRecord("x", 0, "x", 0, "", (), None).__dict__) | {"message", "asctime"}


class JsonFormatter(logging.Formatter):
    """Emit one JSON object per line with stable operational fields."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(timespec="milliseconds"),
            "level": record.levelname,
            "service": SERVICE_NAME,
            "version": __version__,
            "logger": record.name,
            "event": getattr(record, "event", None) or record.getMessage(),
            "request_id": getattr(record, "request_id", None) or get_request_id(),
        }
        if record.getMessage() and payload["event"] != record.getMessage():
            payload["message"] = record.getMessage()
        for key, value in record.__dict__.items():
            if key in _STANDARD_ATTRS or key in ("event", "request_id") or key.startswith("_"):
                continue
            if key in _BLOCKED_EXTRA_FIELDS:
                continue
            payload[key] = value
        if record.exc_info and record.exc_info[0] is not None:
            payload["error_type"] = record.exc_info[0].__name__
        return json.dumps(payload, default=str)


def configure_logging(level: str | None = None) -> None:
    """Route application and uvicorn logs through the JSON formatter on stdout.

    Idempotent: only handlers installed by this function are replaced, so test
    harness handlers (for example pytest's caplog) keep working.
    """
    root = logging.getLogger()
    for handler in list(root.handlers):
        if getattr(handler, "_campaign_api_handler", False):
            root.removeHandler(handler)
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    handler._campaign_api_handler = True  # type: ignore[attr-defined]
    root.addHandler(handler)
    root.setLevel((level or os.environ.get("LOG_LEVEL", "INFO")).upper())

    # uvicorn's default access log duplicates request_completed; keep its error log.
    logging.getLogger("uvicorn.access").disabled = True
    for name in ("uvicorn", "uvicorn.error"):
        logger = logging.getLogger(name)
        logger.handlers = []
        logger.propagate = True


def log_event(logger: logging.Logger, event: str, level: int = logging.INFO, **fields: Any) -> None:
    """Log a structured event. Payload-like fields are dropped defensively."""
    safe_fields = {key: value for key, value in fields.items() if key not in _BLOCKED_EXTRA_FIELDS}
    logger.log(level, event, extra={"event": event, **safe_fields})


class Timer:
    def __init__(self) -> None:
        self.start = time.perf_counter()

    def elapsed_ms(self) -> float:
        return round((time.perf_counter() - self.start) * 1000, 2)
