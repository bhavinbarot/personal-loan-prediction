"use client";

import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { MetricsResponse } from "@/lib/api/types";
import { formatCount, formatDecimal } from "@/lib/format";
import { cn } from "cn";

export function ConfusionMatrix({ metrics }: { metrics: MetricsResponse }) {
  const cm = metrics.confusion_matrix;
  const tiles = [
    { label: "Correctly excluded", value: cm.correctly_excluded, detail: "Non-responders left out of outreach", tone: "neutral" },
    { label: "False outreach", value: cm.false_outreach, detail: "Non-responders that would have been contacted", tone: "warn" },
    { label: "Missed responders", value: cm.missed_responders, detail: "Responders the threshold would have skipped", tone: "warn" },
    { label: "Captured responders", value: cm.captured_responders, detail: "Responders correctly flagged for outreach", tone: "good" },
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className={cn(
              "rounded-xl border p-4",
              tile.tone === "good" && "border-success/30 bg-success/5 dark:bg-success/10",
              tile.tone === "warn" && "border-warning/40 bg-warning/5 dark:bg-warning/10",
              tile.tone === "neutral" && "border-border bg-card",
            )}
          >
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{tile.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums sm:text-3xl">{formatCount(tile.value)}</dd>
            <dd className="mt-0.5 text-xs text-muted-foreground">{tile.detail}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-muted-foreground">
        Outcomes at the operating threshold of {formatDecimal(cm.threshold, 2)} on the holdout set. This is the threshold policy; fixed-capacity
        selection is reported separately below.
      </p>
      <Collapsible>
        <CollapsibleTrigger render={<Button variant="ghost" size="sm" className="group -ml-2 text-muted-foreground" />}>
          Conventional confusion matrix
          <ChevronDownIcon data-icon="inline-end" className="transition-transform group-aria-expanded:rotate-180" aria-hidden />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 max-w-md overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Confusion matrix with actual classes as rows and predicted classes as columns</caption>
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th scope="col" className="py-1 pr-3 text-left font-medium"></th>
                  <th scope="col" className="py-1 px-3 text-right font-medium">Predicted 0</th>
                  <th scope="col" className="py-1 px-3 text-right font-medium">Predicted 1</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                <tr className="border-t border-border">
                  <th scope="row" className="py-1.5 pr-3 text-left text-xs font-medium text-muted-foreground">Actual 0</th>
                  <td className="py-1.5 px-3 text-right">{cm.raw.actual_0.predicted_0}</td>
                  <td className="py-1.5 px-3 text-right">{cm.raw.actual_0.predicted_1}</td>
                </tr>
                <tr className="border-t border-border">
                  <th scope="row" className="py-1.5 pr-3 text-left text-xs font-medium text-muted-foreground">Actual 1</th>
                  <td className="py-1.5 px-3 text-right">{cm.raw.actual_1.predicted_0}</td>
                  <td className="py-1.5 px-3 text-right">{cm.raw.actual_1.predicted_1}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
