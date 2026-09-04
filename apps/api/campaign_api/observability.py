from __future__ import annotations

import re
import uuid
from contextvars import ContextVar

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


REQUEST_ID_HEADER = "X-Request-ID"
_REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9._:-]{1,128}$")

request_id_var: ContextVar[str] = ContextVar("request_id", default="-")


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
        try:
            response = await call_next(request)
        finally:
            request_id_var.reset(token)
        response.headers[REQUEST_ID_HEADER] = request_id
        return response
