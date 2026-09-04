"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatCapacity } from "@/lib/format";
import { CAPACITY_OPTIONS, isCapacityOption, type CapacityOption } from "@/lib/simulator/capacity";

export function CapacityControl({
  value,
  onChange,
  disabled = false,
}: {
  value: CapacityOption;
  onChange: (capacity: CapacityOption) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-medium">Campaign capacity</legend>
      <ToggleGroup
        value={[String(value)]}
        onValueChange={(next) => {
          const raw = next[0];
          if (raw === undefined) return; // keep the current selection when re-clicking the active option
          const parsed = Number(raw);
          if (isCapacityOption(parsed)) onChange(parsed);
        }}
        aria-label="Share of customers the campaign can contact"
        variant="outline"
        spacing={0}
        disabled={disabled}
        className="w-full"
      >
        {CAPACITY_OPTIONS.map((option) => (
          <ToggleGroupItem
            key={option}
            value={String(option)}
            aria-label={`Contact ${formatCapacity(option)} of customers`}
            className="h-11 min-w-0 flex-1 px-1 text-sm tabular-nums sm:h-10 sm:px-3"
          >
            {formatCapacity(option)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p className="mt-2 text-xs text-muted-foreground">Share of the population the outreach team can reach.</p>
    </fieldset>
  );
}
