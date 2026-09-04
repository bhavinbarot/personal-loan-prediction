from __future__ import annotations

import logging
import re
import time
import uuid
from contextvars import ContextVar

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


REQUEST_ID_HEADER = "X-Request-ID"
_REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9._:-]{1,128}$")

request_id_var: ContextVar[str] = ContextVar("request_id", default="-")
logger = logging.getLogger("campaign_api.request")


def new_request_id() -> str:
    return uuid.uuid4().hex


def sanitize_request_id(candidate: str | None) -> str | None:
    """Accept an upstream request ID only if it is a short, printable token."""
    if candidate and _REQUEST_ID_PATTERN.match(candidate):
        return candidate
    return None


def get_request_id() -> str:
    return request_id_var.get()


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Attach a correlation ID to every request and echo it in the response.

    An incoming X-Request-ID is honored when it is well-formed (so a reverse proxy
    or the frontend can supply one); otherwise a new ID is generated. The ID is
    stored in a context variable so log records and error bodies can reference it.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = sanitize_request_id(request.headers.get(REQUEST_ID_HEADER)) or new_request_id()
        request.state.request_id = request_id
        token = request_id_var.set(request_id)
        started = time.perf_counter()
        status_code = 500
        try:
            response = await call_next(request)
            status_code = response.status_code
        finally:
            duration_ms = round((time.perf_counter() - started) * 1000, 2)
            # Only routing metadata is logged. Bodies, query values, and headers are never recorded.
            logger.log(
                logging.WARNING if status_code >= 500 else logging.INFO,
                "request_completed",
                extra={
                    "event": "request_completed",
                    "request_id": request_id,
                    "method": request.method,
                    "route": request.url.path,
                    "status": status_code,
                    "duration_ms": duration_ms,
                },
            )
            request_id_var.reset(token)
        response.headers[REQUEST_ID_HEADER] = request_id
        return response
