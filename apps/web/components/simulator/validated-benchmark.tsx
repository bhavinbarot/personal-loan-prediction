import { ShieldCheckIcon } from "lucide-react";
import Link from "next/link";

import { formatCapacity, formatCount, formatLift, formatPercent } from "@/lib/format";
import { campaignHighlight } from "@/lib/metrics";
import { loadMetrics } from "@/lib/server/metrics";

/**
 * Server component: the validated holdout result at the selected campaign capacity.
 * Deliberately separated from the live synthetic simulator so predictions on synthetic
 * customers are never confused with measured responder outcomes.
 */
export async function ValidatedBenchmark() {
  const result = await loadMetrics();
  const highlight = result.ok ? campaignHighlight(result.metrics) : null;

  return (
    <aside
      aria-labelledby="benchmark-title"
      className="rounded-2xl border border-success/30 bg-success/5 p-4 sm:p-6 dark:bg-success/10"
    >
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md bg-success/15 text-success">
          <ShieldCheckIcon className="size-4" aria-hidden />
        </span>
        <h2 id="benchmark-title" className="text-xs font-semibold tracking-wide uppercase">
          Validated holdout benchmark
        </h2>
      </div>

      {highlight ? (
        <>
          <p className="mt-3 text-sm text-muted-foreground">
            At {formatCapacity(highlight.capacity)} campaign capacity on the untouched holdout set of{" "}
            {formatCount(result.ok ? result.metrics.dataset.holdout_rows : 0)} real customers:
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            <BenchmarkStat label="Contacted" value={formatCount(highlight.contacted)} />
            <BenchmarkStat label="Responders captured" value={`${formatCount(highlight.captured)} / ${formatCount(highlight.totalResponders)}`} />
            <BenchmarkStat label="Responder capture" value={formatPercent(highlight.captureRate)} />
            <BenchmarkStat label="Lift" value={formatLift(highlight.lift)} />
          </dl>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          The validated benchmark could not be loaded from the metrics service right now.
        </p>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        These are measured outcomes on held-out data. The simulator above shows model predictions for synthetic
        customers, which have no observed responses.{" "}
        <Link href="/validation" className="font-medium text-foreground underline-offset-4 hover:underline">
          See the full validation
        </Link>
        .
      </p>
    </aside>
  );
}

function BenchmarkStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums sm:text-xl">{value}</dd>
    </div>
  );
}
