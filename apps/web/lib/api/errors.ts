import type { ApiErrorDetail } from "./types";

export type ApiErrorKind = "network" | "timeout" | "validation" | "model_unavailable" | "reports_unavailable" | "server";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorDetail[];
  /** Correlation ID from the API (header or error body) for matching a failure to backend logs. */
  readonly requestId: string | null;

  constructor(
    kind: ApiErrorKind,
    status: number,
    code: string,
    message: string,
    details: ApiErrorDetail[] = [],
    requestId: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export interface ErrorPresentation {
  kind: ApiErrorKind | "unknown";
  title: string;
  description: string;
  details: ApiErrorDetail[];
  retryable: boolean;
  /** Technical context safe to show under a disclosure: error code, HTTP status, request ID. */
  technical: { code: string | null; status: number | null; requestId: string | null };
}

/** Translate any thrown value into copy that is safe and useful to show in the UI. */
export function describeError(error: unknown): ErrorPresentation {
  if (isApiError(error)) {
    const technical = { code: error.code, status: error.status || null, requestId: error.requestId };
    switch (error.kind) {
      case "network":
        return {
          kind: "network",
          title: "Prediction service is temporarily unavailable",
          description:
            "The application could not reach the model API. If you are running locally, start the API and try again.",
          details: [],
          retryable: true,
          technical,
        };
      case "timeout":
        return {
          kind: "timeout",
          title: "The request timed out",
          description: "The model API took too long to respond. Please try again.",
          details: [],
          retryable: true,
          technical,
        };
      case "model_unavailable":
        return {
          kind: "model_unavailable",
          title: "The model is not loaded",
          description:
            "The prediction service is running but its model artifact is not ready, so predictions cannot be made right now.",
          details: [],
          retryable: true,
          technical,
        };
      case "reports_unavailable":
        return {
          kind: "reports_unavailable",
          title: "Validated results are unavailable",
          description: "The service could not read its validation reports. This does not affect live predictions.",
          details: [],
          retryable: true,
          technical,
        };
      case "validation":
        return {
          kind: "validation",
          title: error.code === "INVALID_CAMPAIGN_CAPACITY" ? "Campaign capacity is not valid" : "Some inputs need attention",
          description: error.message,
          details: error.details,
          retryable: false,
          technical,
        };
      default:
        return {
          kind: "server",
          title: "Something went wrong",
          description: "The model API returned an unexpected error. Please try again.",
          details: [],
          retryable: true,
          technical,
        };
    }
  }
  return {
    kind: "unknown",
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again.",
    details: [],
    retryable: true,
    technical: { code: null, status: null, requestId: null },
  };
}
