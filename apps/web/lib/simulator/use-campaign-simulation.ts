"use client";

import { useCallback, useEffect, useState } from "react";

import { getDemoPopulation, rankCampaign } from "@/lib/api/endpoints";
import type { CampaignRankResponse, CustomerRecord } from "@/lib/api/types";

import { DEFAULT_CAPACITY, POPULATION_SIZE, type CapacityOption } from "./capacity";

export type PopulationState =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; customers: CustomerRecord[]; note: string };

export type RankingState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; result: CampaignRankResponse };

export interface CampaignSimulation {
  capacity: CapacityOption;
  setCapacity: (capacity: CapacityOption) => void;
  population: PopulationState;
  ranking: RankingState;
  /**
   * Ranking to show: the current result, or the previous one while a new capacity is being
   * scored. Cleared when the latest request fails so stale rankings are never shown as current.
   */
  displayedResult: CampaignRankResponse | null;
  reloadPopulation: () => void;
  retryRanking: () => void;
}

type PopulationOutcome = Exclude<PopulationState, { status: "loading" }>;
type RankingOutcome = Exclude<RankingState, { status: "loading" | "idle" }>;

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/**
 * Owns the simulator's data flow: load the synthetic population once, then ask the API
 * for an exact top-K ranking whenever the capacity changes. Ranking logic never runs
 * in the browser; the hook only sequences requests and drops stale responses.
 *
 * Loading states are derived by comparing each stored outcome with the request it
 * belongs to, so effects never set state synchronously.
 */
export function useCampaignSimulation(initialCapacity: CapacityOption = DEFAULT_CAPACITY): CampaignSimulation {
  const [capacity, setCapacity] = useState<CapacityOption>(initialCapacity);
  const [populationAttempt, setPopulationAttempt] = useState(0);
  const [rankingAttempt, setRankingAttempt] = useState(0);
  const [populationOutcome, setPopulationOutcome] = useState<{ attempt: number; outcome: PopulationOutcome } | null>(null);
  const [rankingOutcome, setRankingOutcome] = useState<{ key: string; outcome: RankingOutcome } | null>(null);
  const [lastSuccess, setLastSuccess] = useState<CampaignRankResponse | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getDemoPopulation(POPULATION_SIZE, { signal: controller.signal })
      .then((response) =>
        setPopulationOutcome({
          attempt: populationAttempt,
          outcome: { status: "ready", customers: response.customers, note: response.note },
        }),
      )
      .catch((error: unknown) => {
        if (!isAbort(error)) setPopulationOutcome({ attempt: populationAttempt, outcome: { status: "error", error } });
      });
    return () => controller.abort();
  }, [populationAttempt]);

  const population: PopulationState =
    populationOutcome && populationOutcome.attempt === populationAttempt ? populationOutcome.outcome : { status: "loading" };
  const customers = population.status === "ready" ? population.customers : null;
  const rankingKey = `${populationAttempt}:${capacity}:${rankingAttempt}`;

  useEffect(() => {
    if (!customers) return;
    const controller = new AbortController();
    rankCampaign(customers, capacity, { signal: controller.signal })
      .then((result) => {
        setLastSuccess(result);
        setRankingOutcome({ key: rankingKey, outcome: { status: "ready", result } });
      })
      .catch((error: unknown) => {
        if (!isAbort(error)) setRankingOutcome({ key: rankingKey, outcome: { status: "error", error } });
      });
    return () => controller.abort();
  }, [customers, capacity, rankingKey]);

  const ranking: RankingState = !customers
    ? { status: "idle" }
    : rankingOutcome && rankingOutcome.key === rankingKey
      ? rankingOutcome.outcome
      : { status: "loading" };

  const displayedResult =
    ranking.status === "ready" ? ranking.result : ranking.status === "loading" ? lastSuccess : null;

  const reloadPopulation = useCallback(() => setPopulationAttempt((n) => n + 1), []);
  const retryRanking = useCallback(() => setRankingAttempt((n) => n + 1), []);

  return { capacity, setCapacity, population, ranking, displayedResult, reloadPopulation, retryRanking };
}
