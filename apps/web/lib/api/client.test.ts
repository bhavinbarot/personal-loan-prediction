import { afterEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "./client";
import { ApiError, describeError } from "./errors";
import { predictCustomer, rankCampaign } from "./endpoints";
import type { CustomerFeatures } from "./types";

const features: CustomerFeatures = {
  Age: 42,
  Experience: 17,
  Income: 120,
  CCAvg: 3.2,
  Mortgage: 0,
  Education: 2,
  Family: 3,
  Securities_Account: 0,
  CD_Account: 1,
  Online: 1,
  CreditCard: 0,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

async function captureError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw new Error(`Expected ApiError, received ${String(error)}`);
  }
  throw new Error("Expected the request to fail");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiRequest", () => {
  it("posts JSON and returns the parsed body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ response_probability: 0.42, outreach_priority: "higher", above_threshold: true, threshold: 0.29 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await predictCustomer(features);

    expect(result.response_probability).toBe(0.42);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/predict$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ features });
  });

  it("serialises campaign ranking requests with capacity", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ capacity: 0.1, population_size: 1, selected_count: 1, rankings: [] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await rankCampaign([{ customer_id: "Customer 001", features }], 0.1);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ customers: [{ customer_id: "Customer 001", features }], capacity: 0.1 });
  });

  it("maps structured 422 errors to validation ApiErrors with field details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: "validation_error",
              message: "Request did not match the expected schema.",
              details: [{ field: "features.Education", message: "Education must be 1, 2, or 3." }],
            },
          },
          422,
        ),
      ),
    );

    const error = await captureError(apiRequest("/predict", { method: "POST", body: {} }));

    expect(error.kind).toBe("validation");
    expect(error.status).toBe(422);
    expect(error.details[0].field).toBe("features.Education");
    expect(describeError(error).details).toHaveLength(1);
  });

  it("maps model_unavailable responses to a dedicated error kind", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ error: { code: "model_unavailable", message: "artifact missing", details: [] } }, 503),
      ),
    );

    const error = await captureError(apiRequest("/predict"));

    expect(error.kind).toBe("model_unavailable");
    expect(describeError(error).title).toMatch(/model is not loaded/i);
  });

  it("treats network failures as a retryable unavailable state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const error = await captureError(apiRequest("/health"));

    expect(error.kind).toBe("network");
    expect(error.status).toBe(0);
    const presentation = describeError(error);
    expect(presentation.retryable).toBe(true);
    expect(presentation.title).toMatch(/unavailable/i);
  });

  it("does not leak raw bodies for non-JSON server errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>Traceback...</html>", { status: 500 })));

    const error = await captureError(apiRequest("/metrics"));

    expect(error.kind).toBe("server");
    expect(error.code).toBe("http_500");
    expect(describeError(error).description).not.toMatch(/Traceback/);
  });

  it("describes unknown errors without exposing internals", () => {
    const presentation = describeError(new Error("ECONNRESET at socket"));

    expect(presentation.kind).toBe("unknown");
    expect(presentation.description).not.toMatch(/ECONNRESET/);
  });
});
