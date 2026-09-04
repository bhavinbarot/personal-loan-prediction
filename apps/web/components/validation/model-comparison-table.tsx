"use client";

import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ModelSelectionRow } from "@/lib/api/types";
import { formatDecimal } from "@/lib/format";
import { cn } from "cn";

const columns: { key: keyof ModelSelectionRow; label: string }[] = [
  { key: "mean_cv_average_precision", label: "Avg. precision" },
  { key: "mean_cv_roc_auc", label: "ROC-AUC" },
  { key: "mean_cv_f1", label: "F1" },
  { key: "mean_cv_precision", label: "Precision" },
  { key: "mean_cv_recall", label: "Recall" },
  { key: "mean_cv_accuracy", label: "Accuracy" },
];

export function ModelComparisonTable({ rows }: { rows: ModelSelectionRow[] }) {
  return (
    <Collapsible>
      <CollapsibleTrigger render={<Button variant="outline" size="sm" className="group h-9" />}>
        Inspect all cross-validated metrics
        <ChevronDownIcon data-icon="inline-end" className="transition-transform group-aria-expanded:rotate-180" aria-hidden />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-3 overflow-x-auto rounded-xl border border-border">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Model</TableHead>
                {columns.map((column) => (
                  <TableHead key={column.key} className="text-right">
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.model} className={cn(row.selected && "bg-primary/5 hover:bg-primary/10 dark:bg-primary/10")}>
                  <TableCell className="font-medium">
                    {row.label}
                    {row.selected ? <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground uppercase">Selected</span> : null}
                  </TableCell>
                  {columns.map((column) => (
                    <TableCell key={column.key} className="text-right tabular-nums">
                      {formatDecimal(Number(row[column.key]))}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Mean of 5 stratified folds on the development split, at each model&apos;s best grid-search parameters. Selection used
          Average Precision only; the other columns are reported for completeness.
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}
