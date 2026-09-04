import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";

import type { PredictResponse } from "@/lib/api/types";
import { outreachPriorityLabel } from "@/lib/customer/form";
import { formatPercent } from "@/lib/format";
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
    </div>
  );
}
