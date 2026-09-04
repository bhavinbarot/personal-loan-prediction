import { getMetrics } from "@/lib/api/endpoints";
import type { MetricsResponse } from "@/lib/api/types";

export type MetricsLoadResult = { ok: true; metrics: MetricsResponse } | { ok: false; error: unknown };

/**
 * Server-side loader for validated report metrics.
 * Never throws: pages render an explicit unavailable state instead of crashing.
 */
export async function loadMetrics(timeoutMs = 8_000): Promise<MetricsLoadResult> {
  try {
    const metrics = await getMetrics({ timeoutMs });
    return { ok: true, metrics };
  } catch (error) {
    return { ok: false, error };
  }
}
