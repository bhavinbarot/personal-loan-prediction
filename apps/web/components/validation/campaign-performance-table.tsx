import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CampaignMetricRow } from "@/lib/api/types";
import { formatCapacity, formatCount, formatDecimal, formatLift, formatPercent } from "@/lib/format";

export function CampaignPerformanceTable({ rows, totalResponders }: { rows: CampaignMetricRow[]; totalResponders: number }) {
  return (
    <>
      {/* Phones: one card per capacity instead of a seven-column table */}
      <ul className="flex flex-col gap-2 md:hidden" aria-label="Campaign metrics by capacity">
        {rows.map((row) => (
          <li key={row.capacity} className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">Top {formatCapacity(row.capacity)}</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">Contacted</dt>
              <dd className="text-right tabular-nums">{formatCount(row.customers_contacted)}</dd>
              <dt className="text-muted-foreground">Responders captured</dt>
              <dd className="text-right tabular-nums">
                {formatCount(row.responders_captured)} / {formatCount(totalResponders)}
              </dd>
              <dt className="text-muted-foreground">Capture (Recall@K)</dt>
              <dd className="text-right tabular-nums">{formatPercent(row.recall_at_k)}</dd>
              <dt className="text-muted-foreground">Precision@K</dt>
              <dd className="text-right tabular-nums">{formatPercent(row.precision_at_k)}</dd>
              <dt className="text-muted-foreground">Lift@K</dt>
              <dd className="text-right tabular-nums">{formatLift(row.lift_at_k)}</dd>
              <dt className="text-muted-foreground">Contacts per responder</dt>
              <dd className="text-right tabular-nums">{formatDecimal(row.number_needed_to_contact, 2)}</dd>
            </dl>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
      <Table className="min-w-[560px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Capacity</TableHead>
            <TableHead className="text-right">Contacted</TableHead>
            <TableHead className="text-right">Responders captured</TableHead>
            <TableHead className="text-right">Precision@K</TableHead>
            <TableHead className="text-right">Capture (Recall@K)</TableHead>
            <TableHead className="text-right">Lift@K</TableHead>
            <TableHead className="text-right">Contacts per responder</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.capacity}>
              <TableCell className="font-medium">Top {formatCapacity(row.capacity)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCount(row.customers_contacted)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCount(row.responders_captured)} / {formatCount(totalResponders)}
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatPercent(row.precision_at_k)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatPercent(row.recall_at_k)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatLift(row.lift_at_k)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatDecimal(row.number_needed_to_contact, 2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </>
  );
}
