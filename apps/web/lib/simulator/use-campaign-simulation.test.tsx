import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";
import type { CampaignRankResponse, CustomerRecord, DemoPopulationResponse } from "@/lib/api/types";

import { useCampaignSimulation } from "./use-campaign-simulation";

const endpoints = vi.hoisted(() => ({
  getDemoPopulation: vi.fn(),
  rankCampaign: vi.fn(),
}));

vi.mock("@/lib/api/endpoints", () => endpoints);

const features = {
  Age: 40, Experience: 15, Income: 100, CCAvg: 2, Mortgage: 0, Education: 1, Family: 2,
  Securities_Account: 0, CD_Account: 0, Online: 1, CreditCard: 0,
} as const;

function population(size: number): DemoPopulationResponse {
  const customers: CustomerRecord[] = Array.from({ length: size }, (_, i) => ({
    customer_id: `Customer ${String(i + 1).padStart(3, "0")}`,
    features,
  }));
  return { population_size: size, seed: 42, note: "synthetic", customers };
}

function ranking(capacity: number, size: number): CampaignRankResponse {
  const selected = Math.ceil(size * capacity);
  return {
    capacity,
    population_size: size,
    selected_count: selected,
    rankings: Array.from({ length: size }, (_, i) => ({
      rank: i + 1,
      index: i,
      customer_id: `Customer ${String(i + 1).padStart(3, "0")}`,
      response_probability: 1 - i / size,
      selected: i < selected,
    })),
  };
}

afterEach(() => {
  endpoints.getDemoPopulation.mockReset();
  endpoints.rankCampaign.mockReset();
});

describe("useCampaignSimulation", () => {
  it("loads the population once and re-ranks through the API when capacity changes", async () => {
    endpoints.getDemoPopulation.mockResolvedValue(population(40));
    endpoints.rankCampaign.mockImplementation((_customers: CustomerRecord[], capacity: number) =>
      Promise.resolve(ranking(capacity, 40)),
    );

    const { result } = renderHook(() => useCampaignSimulation());

    expect(result.current.population.status).toBe("loading");
    await waitFor(() => expect(result.current.ranking.status).toBe("ready"));
    expect(result.current.displayedResult?.selected_count).toBe(4);
    expect(endpoints.getDemoPopulation).toHaveBeenCalledTimes(1);

    act(() => result.current.setCapacity(0.25));
    await waitFor(() => expect(result.current.displayedResult?.selected_count).toBe(10));

    expect(endpoints.getDemoPopulation).toHaveBeenCalledTimes(1);
    expect(endpoints.rankCampaign).toHaveBeenLastCalledWith(expect.any(Array), 0.25, expect.anything());
  });

  it("keeps the previous ranking visible while a new capacity is being scored", async () => {
    endpoints.getDemoPopulation.mockResolvedValue(population(20));
    let resolveSecond: ((value: CampaignRankResponse) => void) | undefined;
    endpoints.rankCampaign
      .mockResolvedValueOnce(ranking(0.1, 20))
      .mockImplementationOnce(() => new Promise<CampaignRankResponse>((resolve) => (resolveSecond = resolve)));

    const { result } = renderHook(() => useCampaignSimulation());
    await waitFor(() => expect(result.current.ranking.status).toBe("ready"));

    act(() => result.current.setCapacity(0.2));

    expect(result.current.ranking.status).toBe("loading");
    expect(result.current.displayedResult?.selected_count).toBe(2);

    act(() => resolveSecond?.(ranking(0.2, 20)));
    await waitFor(() => expect(result.current.displayedResult?.selected_count).toBe(4));
  });

  it("surfaces population failures and recovers on reload", async () => {
    endpoints.getDemoPopulation
      .mockRejectedValueOnce(new ApiError("network", 0, "network_error", "down"))
      .mockResolvedValueOnce(population(10));
    endpoints.rankCampaign.mockResolvedValue(ranking(0.1, 10));

    const { result } = renderHook(() => useCampaignSimulation());
    await waitFor(() => expect(result.current.population.status).toBe("error"));
    expect(result.current.ranking.status).toBe("idle");

    act(() => result.current.reloadPopulation());
    await waitFor(() => expect(result.current.ranking.status).toBe("ready"));
  });

  it("reports ranking failures for the current capacity", async () => {
    endpoints.getDemoPopulation.mockResolvedValue(population(10));
    endpoints.rankCampaign.mockRejectedValue(new ApiError("model_unavailable", 503, "model_unavailable", "no model"));

    const { result } = renderHook(() => useCampaignSimulation());
    await waitFor(() => expect(result.current.ranking.status).toBe("error"));
    expect(result.current.displayedResult).toBeNull();
  });
});
