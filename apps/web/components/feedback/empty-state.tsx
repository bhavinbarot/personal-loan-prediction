import type { ReactNode } from "react";

import { cn } from "cn";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center sm:p-8", className)}>
      <p className="font-medium">{title}</p>
      {description ? <p className="mx-auto mt-1 max-w-prose text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
