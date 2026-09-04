import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";
import type { CustomerFeatures, PredictResponse, PresetsResponse } from "@/lib/api/types";

import { CustomerExplorer } from "./customer-explorer";

const endpoints = vi.hoisted(() => ({
  getPresets: vi.fn(),
  predictCustomer: vi.fn(),
}));

vi.mock("@/lib/api/endpoints", () => endpoints);

const base: CustomerFeatures = {
  Age: 34, Experience: 7, Income: 98, CCAvg: 0.3, Mortgage: 71, Education: 3, Family: 3,
  Securities_Account: 0, CD_Account: 0, Online: 0, CreditCard: 0,
};

const presets: PresetsResponse = {
  note: "synthetic",
  presets: [
    { id: "sample-customer-a", name: "Sample Customer A", features: base },
    { id: "sample-customer-d", name: "Sample Customer D", features: { ...base, Income: 128, Online: 1, CreditCard: 1 } },
  ],
};

function prediction(probability: number): PredictResponse {
  return {
    response_probability: probability,
    outreach_priority: probability >= 0.29 ? "higher" : "lower",
    above_threshold: probability >= 0.29,
    threshold: 0.29,
  };
}

afterEach(() => {
  endpoints.getPresets.mockReset();
  endpoints.predictCustomer.mockReset();
});

describe("CustomerExplorer", () => {
  it("scores the first sample customer on load and re-scores when another sample is chosen", async () => {
    const user = userEvent.setup();
    endpoints.getPresets.mockResolvedValue(presets);
    endpoints.predictCustomer.mockImplementation((features: CustomerFeatures) =>
      Promise.resolve(prediction(features.Income > 100 ? 0.95 : 0.05)),
    );

    render(<CustomerExplorer />);

    expect(await screen.findByText("5.0%")).toBeInTheDocument();
    expect(screen.getByText("Lower outreach priority")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Start from a sample customer"), "sample-customer-d");

    expect(await screen.findByText("95.0%")).toBeInTheDocument();
    expect(screen.getByText("Higher outreach priority")).toBeInTheDocument();
    expect(endpoints.predictCustomer).toHaveBeenCalledTimes(2);
  });

  it("blocks scoring and shows field feedback when inputs are invalid", async () => {
    const user = userEvent.setup();
    endpoints.getPresets.mockResolvedValue(presets);
    endpoints.predictCustomer.mockResolvedValue(prediction(0.05));

    render(<CustomerExplorer />);
    await screen.findByText("5.0%");

    const income = screen.getByLabelText(/Annual income/);
    await user.clear(income);
    await user.click(screen.getByRole("button", { name: "Score customer" }));

    expect(await screen.findByText("Annual income is required.")).toBeInTheDocument();
    expect(income).toHaveAttribute("aria-invalid", "true");
    expect(endpoints.predictCustomer).toHaveBeenCalledTimes(1);
  });

  it("shows a readable service error with retry when prediction fails", async () => {
    const user = userEvent.setup();
    endpoints.getPresets.mockResolvedValue(presets);
    endpoints.predictCustomer
      .mockRejectedValueOnce(new ApiError("model_unavailable", 503, "MODEL_UNAVAILABLE", "artifact missing", [], "req-9"))
      .mockResolvedValueOnce(prediction(0.05));

    render(<CustomerExplorer />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/model is not loaded/i);
    expect(alert).not.toHaveTextContent(/artifact missing/);

    await user.click(within(alert).getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("5.0%")).toBeInTheDocument();
  });

  it("explains the threshold policy under technical details", async () => {
    const user = userEvent.setup();
    endpoints.getPresets.mockResolvedValue(presets);
    endpoints.predictCustomer.mockResolvedValue(prediction(0.05));

    render(<CustomerExplorer />);
    await screen.findByText("5.0%");

    await user.click(screen.getByRole("button", { name: /technical details/i }));

    expect(screen.getByText("0.29")).toBeInTheDocument();
    expect(screen.getByText(/does not determine whether they fall inside the top 10%/)).toBeInTheDocument();
  });

  it("shows the presets failure state when samples cannot be loaded", async () => {
    endpoints.getPresets.mockRejectedValue(new ApiError("network", 0, "network_error", "down"));

    render(<CustomerExplorer />);

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/temporarily unavailable/i));
  });
});
