import type { ReactNode } from "react";

import { cn } from "cn";

export function KpiCard({
  label,
  value,
  detail,
  emphasis = false,
  className,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-xl border bg-card p-4 text-card-foreground sm:p-5",
        emphasis ? "border-primary/30 bg-primary/5 dark:bg-primary/10" : "border-border",
        className,
      )}
    >
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</p>
      {detail ? <p className="text-xs text-muted-foreground sm:text-sm">{detail}</p> : null}
    </div>
  );
}
