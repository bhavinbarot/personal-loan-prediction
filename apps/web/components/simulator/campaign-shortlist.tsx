"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CampaignRankResponse, CampaignRanking } from "@/lib/api/types";
import { formatPercent } from "@/lib/format";
import { cn } from "cn";

const INITIAL_ROWS = 25;
const PAGE = 50;

function DecisionBadge({ selected }: { selected: boolean }) {
  return (
    <Badge
      variant={selected ? "default" : "outline"}
      className={cn("gap-1.5", selected ? "" : "text-muted-foreground")}
    >
      <span className={cn("size-1.5 rounded-full", selected ? "bg-primary-foreground" : "bg-muted-foreground")} aria-hidden />
      {selected ? "Selected" : "Not selected"}
    </Badge>
  );
}

function ProbabilityBar({ value, selected }: { value: number; selected: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 text-right tabular-nums">{formatPercent(value)}</span>
      <span className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-muted md:block" aria-hidden>
        <span
          className={cn("block h-full rounded-full", selected ? "bg-chart-1" : "bg-chart-2")}
          style={{ width: `${Math.max(2, value * 100)}%` }}
        />
      </span>
    </div>
  );
}

export function CampaignShortlist({ result, pending }: { result: CampaignRankResponse; pending: boolean }) {
  const [visible, setVisible] = useState(INITIAL_ROWS);
  const rows = result.rankings.slice(0, visible);
  const remaining = result.rankings.length - rows.length;

  return (
    <section aria-labelledby="shortlist-title" className={cn("transition-opacity", pending && "opacity-60")} aria-busy={pending}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="shortlist-title" className="text-base font-semibold sm:text-lg">
          Campaign shortlist
        </h2>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Showing {rows.length} of {result.rankings.length} ranked customers
        </p>
      </div>

      {/* Desktop and tablet: ranking table */}
      <div className="hidden overflow-hidden rounded-xl border border-border md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Response probability</TableHead>
              <TableHead className="text-right">Campaign decision</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <ShortlistRow key={row.index} row={row} />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Phones: compact cards */}
      <ol className="flex flex-col gap-2 md:hidden" aria-label="Ranked customers">
        {rows.map((row) => (
          <li
            key={row.index}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-3",
              row.selected ? "border-primary/30 bg-primary/5 dark:bg-primary/10" : "border-border bg-card",
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold tabular-nums">
              {row.rank}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{row.customer_id ?? `Customer ${row.index + 1}`}</p>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground tabular-nums">{formatPercent(row.response_probability)}</span>{" "}
                response probability
              </p>
            </div>
            <DecisionBadge selected={row.selected} />
          </li>
        ))}
      </ol>

      {remaining > 0 ? (
        <div className="mt-3 flex justify-center">
          <Button variant="outline" size="sm" className="h-10 sm:h-8" onClick={() => setVisible((v) => v + PAGE)}>
            Show {Math.min(PAGE, remaining)} more
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function ShortlistRow({ row }: { row: CampaignRanking }) {
  return (
    <TableRow className={cn(row.selected && "bg-primary/5 hover:bg-primary/10 dark:bg-primary/10")}>
      <TableCell className="font-medium tabular-nums">{row.rank}</TableCell>
      <TableCell>{row.customer_id ?? `Customer ${row.index + 1}`}</TableCell>
      <TableCell>
        <ProbabilityBar value={row.response_probability} selected={row.selected} />
      </TableCell>
      <TableCell className="text-right">
        <DecisionBadge selected={row.selected} />
      </TableCell>
    </TableRow>
  );
}
