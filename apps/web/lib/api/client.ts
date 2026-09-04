import { getApiBaseUrl } from "./config";
import { ApiError, type ApiErrorKind } from "./errors";
import type { ApiErrorBody } from "./types";

export interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Next.js fetch cache behavior for server-side calls. Defaults to no caching. */
  cache?: RequestCache;
  next?: { revalidate?: number };
}

const DEFAULT_TIMEOUT_MS = 15_000;

const REQUEST_ID_HEADER = "X-Request-ID";

function kindForStatus(status: number, code: string): ApiErrorKind {
  if (code === "MODEL_UNAVAILABLE") return "model_unavailable";
  if (code === "REPORTS_UNAVAILABLE") return "reports_unavailable";
  if (status === 422 || status === 400) return "validation";
  return "server";
}

async function parseErrorBody(response: Response): Promise<ApiErrorBody["error"] | null> {
  try {
    const body = (await response.json()) as Partial<ApiErrorBody>;
    if (body && body.error && typeof body.error.message === "string") {
      return {
        code: body.error.code ?? "UNKNOWN",
        message: body.error.message,
        details: body.error.details ?? [],
        request_id: body.error.request_id,
      };
    }
  } catch {
    // Non-JSON error body; fall through to a generic error.
  }
  return null;
}

/**
 * Single entry point for every call to the FastAPI service.
 * Throws `ApiError` for transport failures, timeouts, and non-2xx responses.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal, timeoutMs = DEFAULT_TIMEOUT_MS, cache = "no-store", next } = options;
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new DOMException("Request timed out", "TimeoutError")), timeoutMs);
  const onExternalAbort = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", onExternalAbort, { once: true });

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: body === undefined ? { Accept: "application/json" } : { Accept: "application/json", "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
      cache: next ? undefined : cache,
      next,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    throw new ApiError(
      timedOut ? "timeout" : "network",
      0,
      timedOut ? "timeout" : "network_error",
      timedOut ? "The request timed out." : "The model API could not be reached.",
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", onExternalAbort);
  }

  if (!response.ok) {
    const parsed = await parseErrorBody(response);
    const code = parsed?.code ?? `HTTP_${response.status}`;
    const message = parsed?.message ?? `The model API responded with status ${response.status}.`;
    const requestId = parsed?.request_id ?? response.headers.get(REQUEST_ID_HEADER);
    throw new ApiError(kindForStatus(response.status, code), response.status, code, message, parsed?.details ?? [], requestId);
  }

  return (await response.json()) as T;
}
