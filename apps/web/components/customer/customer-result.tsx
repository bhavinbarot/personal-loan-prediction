"use client";

import { ArrowDownRightIcon, ArrowUpRightIcon, ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { PredictResponse } from "@/lib/api/types";
import { outreachPriorityLabel } from "@/lib/customer/form";
import { formatDecimal, formatPercent } from "@/lib/format";
import { cn } from "cn";

export function CustomerResult({ result, pending, customerName }: { result: PredictResponse; pending: boolean; customerName: string | null }) {
  const higher = result.outreach_priority === "higher";
  const Icon = higher ? ArrowUpRightIcon : ArrowDownRightIcon;

  return (
    <div
      className={cn("rounded-2xl border border-border bg-card p-5 transition-opacity sm:p-6", pending && "opacity-60")}
      aria-busy={pending}
      aria-live="polite"
    >
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Campaign response probability{customerName ? ` · ${customerName}` : ""}
      </p>
      <p className="mt-2 text-5xl font-semibold tracking-tight sm:text-6xl">{formatPercent(result.response_probability)}</p>
      <div
        className={cn(
          "mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium",
          higher ? "border-primary/30 bg-primary/10 text-foreground" : "border-border bg-muted text-foreground",
        )}
      >
        <Icon className={cn("size-4", higher ? "text-primary" : "text-muted-foreground")} aria-hidden />
        {outreachPriorityLabel(result.outreach_priority)}
      </div>
      <p className="mt-3 max-w-prose text-sm text-muted-foreground">
        {higher
          ? "This profile scores at or above the operating threshold, so it would be flagged for outreach under the threshold policy."
          : "This profile scores below the operating threshold, so it would not be flagged under the threshold policy."}{" "}
        The estimate is a model prediction for a synthetic profile, not an observed response.
      </p>

      <Collapsible className="mt-4 border-t border-border pt-3">
        <CollapsibleTrigger render={<Button variant="ghost" size="sm" className="group -ml-2 text-muted-foreground" />}>
          Technical details
          <ChevronDownIcon data-icon="inline-end" className="transition-transform group-aria-expanded:rotate-180" aria-hidden />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Predicted probability</dt>
            <dd className="font-mono tabular-nums">{formatDecimal(result.response_probability, 4)}</dd>
            <dt className="text-muted-foreground">Operating threshold</dt>
            <dd className="font-mono tabular-nums">{formatDecimal(result.threshold, 2)}</dd>
            <dt className="text-muted-foreground">Threshold source</dt>
            <dd>Out-of-fold development probabilities at the 10% mark</dd>
          </dl>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Threshold classification is not campaign selection.</span>{" "}
              The priority label compares one probability with a fixed cutoff. Fixed-capacity campaign selection ranks a
              whole population and keeps exactly the top K, so a customer&apos;s probability alone does not determine
              whether they fall inside the top 10% of a future campaign population.
            </p>
            <p>Both policies come from the same validated model package; the API applies them, the interface only displays them.</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
