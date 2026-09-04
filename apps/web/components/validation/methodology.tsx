import { ChevronDownIcon } from "lucide-react";
import { Fragment } from "react";

import type { MetricsResponse } from "@/lib/api/types";
import { formatCapacity, formatCount, formatDecimal } from "@/lib/format";

export function Methodology({ metrics }: { metrics: MetricsResponse }) {
  const holdoutPct = formatCapacity(metrics.dataset.holdout_fraction);
  const devPct = formatCapacity(1 - metrics.dataset.holdout_fraction);
  const steps = [
    { title: `${formatCount(metrics.dataset.rows)} records`, detail: `${formatCount(metrics.dataset.positive_count)} responders (${formatCapacity(metrics.dataset.positive_rate)} base rate)` },
    { title: `${devPct} development / ${holdoutPct} untouched holdout`, detail: "Single stratified split; holdout set aside before any modelling" },
    { title: `${metrics.cross_validation.n_splits}-fold stratified cross-validation`, detail: "Preprocessing fit inside each training fold via sklearn pipelines" },
    { title: "Model selection by Average Precision", detail: "Grid search per candidate; the predefined metric decides" },
    { title: "Out-of-fold operating threshold", detail: `${formatDecimal(metrics.selection.selected_threshold, 2)} from development-set OOF probabilities at the ${formatCapacity(metrics.selection.selected_top_k_fraction)} mark` },
    { title: "Final untouched holdout evaluation", detail: `${formatCount(metrics.dataset.holdout_rows)} customers scored once, after every decision was fixed` },
  ];

  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-col gap-1.5">
        {steps.map((step, index) => (
          <Fragment key={step.title}>
            <li className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary" aria-hidden>
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground sm:text-sm">{step.detail}</p>
              </div>
            </li>
            {index < steps.length - 1 ? (
              <li aria-hidden className="flex justify-center text-muted-foreground">
                <ChevronDownIcon className="size-4" />
              </li>
            ) : null}
          </Fragment>
        ))}
      </ol>
      <p className="rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm dark:bg-success/10">
        <span className="font-medium">The holdout set was never used for model selection or threshold choice.</span> Every number on this page under
        &ldquo;holdout&rdquo; was produced by a single scoring pass after the model and threshold were fixed.
      </p>
    </div>
  );
}
