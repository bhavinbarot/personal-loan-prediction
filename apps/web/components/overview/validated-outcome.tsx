import { ArrowDownIcon, ArrowRightIcon, ShieldCheckIcon } from "lucide-react";

import { KpiCard } from "@/components/metrics/kpi-card";
import { formatCapacity, formatCount, formatLift, formatPercent } from "@/lib/format";
import type { CampaignHighlight } from "@/lib/metrics";

export function ValidatedOutcome({ highlight, holdoutRows }: { highlight: CampaignHighlight; holdoutRows: number }) {
  const capacity = formatCapacity(highlight.capacity);
  const captureRate = formatPercent(highlight.captureRate);

  return (
    <section aria-labelledby="validated-outcome-title" className="py-8 sm:py-10">
      <div className="rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-foreground">
            <ShieldCheckIcon className="size-3.5 text-success" aria-hidden />
            Validated on the untouched holdout set
          </span>
          <span className="text-xs text-muted-foreground">
            {formatCount(holdoutRows)} customers never used for model selection or threshold choice
          </span>
        </div>

        <h2 id="validated-outcome-title" className="sr-only">
          Validated campaign outcome
        </h2>

        <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6 lg:gap-10">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Campaign capacity</p>
            <p className="text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl lg:text-7xl">{capacity}</p>
            <p className="mt-1 text-sm text-muted-foreground">of customers contacted</p>
          </div>
          <div className="flex items-center text-muted-foreground" aria-hidden>
            <ArrowDownIcon className="size-6 sm:hidden" />
            <ArrowRightIcon className="hidden size-7 sm:block" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Responders captured</p>
            <p className="text-5xl font-semibold tracking-tight text-primary tabular-nums sm:text-6xl lg:text-7xl">
              {captureRate}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">of all responders in the holdout set</p>
          </div>
        </div>

        <p className="sr-only">
          Contacting the top {capacity} of customers ranked by the model captured {captureRate} of responders.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
          <KpiCard label="Customers contacted" value={formatCount(highlight.contacted)} detail={`Top ${capacity} of ${formatCount(holdoutRows)}`} />
          <KpiCard
            label="Responders captured"
            value={
              <>
                {formatCount(highlight.captured)}
                <span className="text-base font-normal text-muted-foreground"> / {formatCount(highlight.totalResponders)}</span>
              </>
            }
            detail="Actual responders reached within capacity"
          />
          <KpiCard
            label={`Lift @ ${capacity}`}
            value={formatLift(highlight.lift)}
            detail="Versus contacting customers at random"
            emphasis
          />
        </div>
      </div>
    </section>
  );
}
