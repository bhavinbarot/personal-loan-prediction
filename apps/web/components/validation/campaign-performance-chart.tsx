"use client";

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { CampaignMetricRow } from "@/lib/api/types";
import { formatCapacity, formatLift, formatPercent } from "@/lib/format";

const SERIES = "var(--color-chart-1)";

type Measure = "recall_at_k" | "lift_at_k";

function MeasureTooltip({ active, payload, measure }: { active?: boolean; payload?: { payload?: CampaignMetricRow }[]; measure: Measure }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
      <p className="text-base font-semibold tabular-nums">
        {measure === "recall_at_k" ? formatPercent(row.recall_at_k) : formatLift(row.lift_at_k)}
      </p>
      <p className="text-muted-foreground">
        Top {formatCapacity(row.capacity)} · {row.responders_captured} of responders in {row.customers_contacted} contacts
      </p>
    </div>
  );
}

function MeasureChart({ rows, measure, title, description }: { rows: CampaignMetricRow[]; measure: Measure; title: string; description: string }) {
  const format = measure === "recall_at_k" ? (v: number) => formatPercent(v, 0) : (v: number) => formatLift(v, 1);
  const data = rows.map((row) => ({ ...row, label: `Top ${formatCapacity(row.capacity)}` }));
  return (
    <figure className="min-w-0 rounded-xl border border-border bg-card p-4">
      <figcaption>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </figcaption>
      <div
        className="mt-3 h-44 w-full"
        role="img"
        aria-label={`${title}: ${data.map((row) => `${row.label} ${format(row[measure])}`).join(", ")}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 8, left: 8, bottom: 0 }} barCategoryGap="30%">
            <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "var(--color-border)" }} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
            <YAxis hide domain={[0, measure === "recall_at_k" ? 1 : "dataMax"]} />
            <Tooltip content={<MeasureTooltip measure={measure} />} cursor={{ fill: "var(--color-muted)", opacity: 0.5 }} isAnimationActive={false} wrapperStyle={{ outline: "none" }} />
            <Bar dataKey={measure} fill={SERIES} isAnimationActive={false} radius={[4, 4, 0, 0]} maxBarSize={48}>
              <LabelList
                dataKey={measure}
                position="top"
                formatter={(value) => format(Number(value))}
                style={{ fill: "var(--color-foreground)", fontSize: 12, fontVariantNumeric: "tabular-nums" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

export function CampaignPerformanceCharts({ rows }: { rows: CampaignMetricRow[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <MeasureChart rows={rows} measure="recall_at_k" title="Responder capture" description="Share of all holdout responders reached within capacity" />
      <MeasureChart rows={rows} measure="lift_at_k" title="Lift" description="Precision within capacity versus contacting at random" />
    </div>
  );
}
