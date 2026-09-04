import { KpiCard } from "@/components/metrics/kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCapacity, formatCount } from "@/lib/format";
import type { CapacityOption } from "@/lib/simulator/capacity";

export function SimulationSummary({
  populationSize,
  capacity,
  selectedCount,
  pending,
}: {
  populationSize: number | null;
  capacity: CapacityOption;
  selectedCount: number | null;
  pending: boolean;
}) {
  return (
    <dl className="grid grid-cols-3 gap-2 sm:gap-4">
      <KpiCard
        label="Population"
        value={populationSize === null ? <Skeleton className="h-8 w-16" /> : formatCount(populationSize)}
        detail="synthetic customers"
        className="p-3 sm:p-5"
      />
      <KpiCard label="Capacity" value={formatCapacity(capacity)} detail="of customers contacted" className="p-3 sm:p-5" />
      <KpiCard
        label="Selected"
        value={
          selectedCount === null ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <span className={pending ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={pending}>
              {formatCount(selectedCount)}
            </span>
          )
        }
        detail="exact top-K from the API"
        emphasis
        className="p-3 sm:p-5"
      />
    </dl>
  );
}
