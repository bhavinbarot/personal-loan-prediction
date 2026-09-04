import { PlugZapIcon } from "lucide-react";

import { RefreshButton } from "@/components/feedback/refresh-button";
import { ValidatedOutcome } from "@/components/overview/validated-outcome";
import { Skeleton } from "@/components/ui/skeleton";
import { campaignHighlight } from "@/lib/metrics";
import { loadMetrics } from "@/lib/server/metrics";

/**
 * Server component: reads validated metrics from the API at request time.
 * The numbers come from the tracked report files, never from the live model.
 */
export async function ValidatedOutcomeSection() {
  const result = await loadMetrics();
  const highlight = result.ok ? campaignHighlight(result.metrics) : null;
  if (!result.ok || !highlight) return <ValidatedOutcomeUnavailable />;
  return <ValidatedOutcome highlight={highlight} holdoutRows={result.metrics.dataset.holdout_rows} />;
}

export function ValidatedOutcomeSkeleton() {
  return (
    <section aria-label="Loading validated campaign outcome" className="py-8 sm:py-10">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-8">
        <Skeleton className="h-6 w-64 max-w-full rounded-full" />
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:gap-10">
          <Skeleton className="h-20 w-40" />
          <Skeleton className="h-20 w-48" />
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    </section>
  );
}

function ValidatedOutcomeUnavailable() {
  return (
    <section aria-labelledby="validated-outcome-unavailable" className="py-8 sm:py-10">
      <div role="status" className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-6 sm:p-8">
        <span className="flex size-9 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-border">
          <PlugZapIcon className="size-4" aria-hidden />
        </span>
        <div>
          <p id="validated-outcome-unavailable" className="font-medium">
            Validated results are temporarily unavailable
          </p>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">
            The metrics service could not be reached, so the holdout campaign outcome cannot be shown right now. The
            values are read from tracked evaluation reports and will appear once the API is back.
          </p>
        </div>
        <RefreshButton />
      </div>
    </section>
  );
}
