/** Campaign capacities offered by the simulator, as fractions of the population. */
export const CAPACITY_OPTIONS = [0.05, 0.1, 0.15, 0.2, 0.25] as const;

export type CapacityOption = (typeof CAPACITY_OPTIONS)[number];

export const DEFAULT_CAPACITY: CapacityOption = 0.1;

/** Size of the deterministic synthetic population requested from the API. */
export const POPULATION_SIZE = 200;

export function isCapacityOption(value: number): value is CapacityOption {
  return CAPACITY_OPTIONS.some((option) => Math.abs(option - value) < 1e-9);
}

/** Parse a capacity from a string such as "0.1" or "10", returning null when unsupported. */
export function parseCapacity(raw: string | null | undefined): CapacityOption | null {
  if (!raw) return null;
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) return null;
  const fraction = numeric > 1 ? numeric / 100 : numeric;
  return isCapacityOption(fraction) ? (CAPACITY_OPTIONS.find((o) => Math.abs(o - fraction) < 1e-9) as CapacityOption) : null;
}
