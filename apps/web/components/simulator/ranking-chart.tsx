"use client";

import { useId, useMemo } from "react";
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatCapacity, formatPercent } from "@/lib/format";
import type { CampaignRankResponse, CampaignRanking } from "@/lib/api/types";
import { cn } from "cn";

const SELECTED = "var(--color-chart-1)";
const NOT_SELECTED = "var(--color-chart-2)";

interface TooltipPayload {
  payload?: CampaignRanking;
}

function RankingTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
      <p className="text-base font-semibold tabular-nums">{formatPercent(row.response_probability)}</p>
      <p className="text-muted-foreground">
        Rank {row.rank} · {row.customer_id ?? "Customer"}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-xs">
        <span
          className="inline-block size-2.5 rounded-sm"
          style={{ background: row.selected ? SELECTED : NOT_SELECTED }}
          aria-hidden
        />
        {row.selected ? "Selected for outreach" : "Not selected"}
      </p>
    </div>
  );
}

export function RankingChart({ result, pending, className }: { result: CampaignRankResponse; pending: boolean; className?: string }) {
  const descriptionId = useId();
  const data = useMemo(() => result.rankings, [result]);
  const cutoff = result.selected_count;
  const cutoffProbability = data[cutoff - 1]?.response_probability ?? null;
  const ticks = useMemo(() => {
    const n = data.length;
    const step = n <= 60 ? 10 : n <= 120 ? 20 : 50;
    const values: number[] = [1];
    for (let v = step; v < n; v += step) values.push(v);
    values.push(n);
    return values;
  }, [data]);

  return (
    <figure className={cn("min-w-0", className)} aria-describedby={descriptionId}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <figcaption className="text-sm font-medium">Predicted response probability by customer rank</figcaption>
        <ul className="flex items-center gap-4 text-xs text-muted-foreground" aria-label="Legend">
          <li className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-3 rounded-sm" style={{ background: SELECTED }} aria-hidden />
            Selected ({cutoff})
          </li>
          <li className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-3 rounded-sm" style={{ background: NOT_SELECTED }} aria-hidden />
            Not selected ({data.length - cutoff})
          </li>
          <li className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-px bg-foreground" aria-hidden />
            Capacity cutoff
          </li>
        </ul>
      </div>

      <div
        className={cn("h-64 w-full min-w-0 transition-opacity sm:h-72", pending && "opacity-60")}
        aria-busy={pending}
        role="img"
        aria-label={`Bar chart of ${data.length} synthetic customers ranked by predicted response probability with the top ${cutoff} highlighted as selected`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }} barCategoryGap={1}>
            <XAxis
              dataKey="rank"
              type="number"
              domain={[0.5, data.length + 0.5]}
              allowDecimals={false}
              ticks={ticks}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              interval={0}
              label={{ value: "Customer rank", position: "insideBottom", offset: -4, fill: "var(--color-muted-foreground)", fontSize: 11 }}
              height={44}
            />
            <YAxis
              domain={[0, 1]}
              ticks={[0, 0.25, 0.5, 0.75, 1]}
              tickFormatter={(value: number) => `${Math.round(value * 100)}%`}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              width={40}
            />
            <Tooltip
              content={<RankingTooltip />}
              cursor={{ fill: "var(--color-muted)", opacity: 0.6 }}
              isAnimationActive={false}
              wrapperStyle={{ outline: "none" }}
            />
            <ReferenceLine
              x={cutoff + 0.5}
              stroke="var(--color-foreground)"
              strokeWidth={1}
              ifOverflow="extendDomain"
            />
            <Bar dataKey="response_probability" isAnimationActive={false} radius={[2, 2, 0, 0]} maxBarSize={24}>
              {data.map((row) => (
                <Cell key={row.rank} fill={row.selected ? SELECTED : NOT_SELECTED} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p id={descriptionId} className="mt-2 text-xs text-muted-foreground">
        The {cutoff} highest-scoring customers fall within the {formatCapacity(result.capacity)} capacity
        {cutoffProbability !== null ? ` (cutoff probability ${formatPercent(cutoffProbability)})` : ""}. Bars are model
        predictions for synthetic customers, not observed responses.
      </p>
    </figure>
  );
}
