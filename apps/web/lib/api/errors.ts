import type { ApiErrorDetail } from "./types";

export type ApiErrorKind = "network" | "timeout" | "validation" | "model_unavailable" | "server";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorDetail[];

  constructor(kind: ApiErrorKind, status: number, code: string, message: string, details: ApiErrorDetail[] = []) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
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
}

/** Translate any thrown value into copy that is safe and useful to show in the UI. */
export function describeError(error: unknown): ErrorPresentation {
  if (isApiError(error)) {
    switch (error.kind) {
      case "network":
        return {
          kind: "network",
          title: "The scoring service is unavailable",
          description:
            "The application could not reach the model API. If you are running locally, start the API and try again.",
          details: [],
          retryable: true,
        };
      case "timeout":
        return {
          kind: "timeout",
          title: "The request timed out",
          description: "The model API took too long to respond. Please try again.",
          details: [],
          retryable: true,
        };
      case "model_unavailable":
        return {
          kind: "model_unavailable",
          title: "The model is not loaded",
          description:
            "The API is running but no trained model artifact is available, so predictions cannot be made right now.",
          details: [],
          retryable: true,
        };
      case "validation":
        return {
          kind: "validation",
          title: "Some inputs need attention",
          description: error.message,
          details: error.details,
          retryable: false,
        };
      default:
        return {
          kind: "server",
          title: "Something went wrong",
          description: "The model API returned an unexpected error. Please try again.",
          details: [],
          retryable: true,
        };
    }
  }
  return {
    kind: "unknown",
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again.",
    details: [],
    retryable: true,
  };
}
