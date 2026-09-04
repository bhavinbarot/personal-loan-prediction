import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CampaignMetricRow } from "@/lib/api/types";
import { formatCapacity, formatCount, formatDecimal, formatLift, formatPercent } from "@/lib/format";

export function CampaignPerformanceTable({ rows, totalResponders }: { rows: CampaignMetricRow[]; totalResponders: number }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
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
  );
}
