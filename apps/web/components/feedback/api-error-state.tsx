"use client";

import { AlertTriangleIcon, ChevronDownIcon, PlugZapIcon, RefreshCwIcon, ServerOffIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { describeError } from "@/lib/api/errors";
import { cn } from "cn";

export function ApiErrorState({
  error,
  onRetry,
  className,
  compact = false,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}) {
  const presentation = describeError(error);
  const Icon =
    presentation.kind === "network" || presentation.kind === "timeout"
      ? PlugZapIcon
      : presentation.kind === "model_unavailable"
        ? ServerOffIcon
        : AlertTriangleIcon;
  const { technical } = presentation;
  const hasTechnical = Boolean(technical.code || technical.requestId || technical.status);

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-muted/30 text-left",
        compact ? "p-4" : "p-6 sm:p-8",
        className,
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-border">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="font-medium text-foreground">{presentation.title}</p>
        <p className="max-w-prose text-sm text-muted-foreground">{presentation.description}</p>
        {presentation.details.length > 0 ? (
          <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
            {presentation.details.map((detail, index) => (
              <li key={`${detail.field ?? "field"}-${index}`}>
                {detail.field ? <span className="font-medium text-foreground">{detail.field}: </span> : null}
                {detail.message}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onRetry && presentation.retryable ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCwIcon data-icon="inline-start" aria-hidden />
            Try again
          </Button>
        ) : null}
      </div>
      {hasTechnical ? (
        <Collapsible className="w-full">
          <CollapsibleTrigger
            render={<Button variant="ghost" size="xs" className="group -ml-2 text-muted-foreground" />}
          >
            Technical details
            <ChevronDownIcon data-icon="inline-end" className="transition-transform group-aria-expanded:rotate-180" aria-hidden />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {technical.code ? (
                <>
                  <dt>Error code</dt>
                  <dd className="font-mono text-foreground">{technical.code}</dd>
                </>
              ) : null}
              {technical.status ? (
                <>
                  <dt>HTTP status</dt>
                  <dd className="font-mono text-foreground">{technical.status}</dd>
                </>
              ) : null}
              {technical.requestId ? (
                <>
                  <dt>Request ID</dt>
                  <dd className="font-mono break-all text-foreground">{technical.requestId}</dd>
                </>
              ) : null}
            </dl>
            {technical.requestId ? (
              <p className="mt-1.5 text-xs text-muted-foreground">Quote the request ID when reporting this problem.</p>
            ) : null}
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}
