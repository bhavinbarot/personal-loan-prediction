import { cache } from "react";

import { getMetrics } from "@/lib/api/endpoints";
import type { MetricsResponse } from "@/lib/api/types";

export type MetricsLoadResult = { ok: true; metrics: MetricsResponse } | { ok: false; error: unknown };

/**
 * Server-side loader for validated report metrics.
 * Never throws: pages render an explicit unavailable state instead of crashing.
 * Memoized per request so several sections on one page share a single API call.
 */
export const loadMetrics = cache(async (timeoutMs = 8_000): Promise<MetricsLoadResult> => {
  try {
    const metrics = await getMetrics({ timeoutMs });
    return { ok: true, metrics };
  } catch (error) {
    return { ok: false, error };
  }
});
