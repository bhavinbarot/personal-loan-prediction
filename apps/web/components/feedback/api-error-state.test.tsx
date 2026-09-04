import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";

import { ApiErrorState } from "./api-error-state";

describe("ApiErrorState", () => {
  it("shows a service-unavailable message with retry for network failures", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ApiErrorState error={new ApiError("network", 0, "network_error", "fetch failed")} onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent(/temporarily unavailable/i);
    expect(screen.queryByText(/fetch failed/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders field-level validation feedback without a retry action", () => {
    const error = new ApiError("validation", 422, "VALIDATION_ERROR", "Request did not match the expected schema.", [
      { field: "features.Income", message: "Field required" },
    ]);
    render(<ApiErrorState error={error} onRetry={vi.fn()} />);

    expect(screen.getByText("features.Income:")).toBeInTheDocument();
    expect(screen.getByText("Field required")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("reveals the request ID and error code under technical details", async () => {
    const user = userEvent.setup();
    const error = new ApiError("model_unavailable", 503, "MODEL_UNAVAILABLE", "not loaded", [], "req-abc-123");
    render(<ApiErrorState error={error} />);

    expect(screen.getByText(/model is not loaded/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /technical details/i }));
    expect(screen.getByText("req-abc-123")).toBeInTheDocument();
    expect(screen.getByText("MODEL_UNAVAILABLE")).toBeInTheDocument();
  });

  it("hides technical details for errors without API context", () => {
    render(<ApiErrorState error={new Error("boom")} />);

    expect(screen.queryByRole("button", { name: /technical details/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/boom/)).not.toBeInTheDocument();
  });
});
