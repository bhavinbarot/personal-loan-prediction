"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { ModelSelectionRow } from "@/lib/api/types";
import { formatDecimal } from "@/lib/format";

const SELECTED = "var(--color-chart-1)";
const OTHER = "var(--color-chart-2)";

interface TooltipPayload {
  payload?: ModelSelectionRow;
}

function ComparisonTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
      <p className="text-base font-semibold tabular-nums">{formatDecimal(row.mean_cv_average_precision)}</p>
      <p className="text-muted-foreground">
        {row.label} · ± {formatDecimal(row.std_cv_average_precision)} across folds
      </p>
    </div>
  );
}

export function ModelComparisonChart({ rows }: { rows: ModelSelectionRow[] }) {
  const height = 40 * rows.length + 24;
  const selected = rows.find((row) => row.selected);
  return (
    <figure>
      <figcaption className="mb-3 text-sm font-medium">Mean cross-validated Average Precision by model</figcaption>
      <div
        style={{ height }}
        className="w-full min-w-0"
        role="img"
        aria-label={`Horizontal bar chart comparing ${rows.length} models by mean cross-validated Average Precision. ${selected?.label ?? "The selected model"} is highlighted with ${formatDecimal(selected?.mean_cv_average_precision ?? 0)}.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 56, left: 0, bottom: 0 }} barCategoryGap={10}>
            <XAxis type="number" domain={[0, 1]} hide />
            <YAxis
              type="category"
              dataKey="label"
              width={128}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--color-foreground)", fontSize: 12 }}
            />
            <Tooltip content={<ComparisonTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.5 }} isAnimationActive={false} wrapperStyle={{ outline: "none" }} />
            <Bar dataKey="mean_cv_average_precision" isAnimationActive={false} radius={[0, 4, 4, 0]} maxBarSize={22}>
              {rows.map((row) => (
                <Cell key={row.model} fill={row.selected ? SELECTED : OTHER} />
              ))}
              <LabelList
                dataKey="mean_cv_average_precision"
                position="right"
                formatter={(value) => formatDecimal(Number(value))}
                style={{ fill: "var(--color-foreground)", fontSize: 12, fontVariantNumeric: "tabular-nums" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
