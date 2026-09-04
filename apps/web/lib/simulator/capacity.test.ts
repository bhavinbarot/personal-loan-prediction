import { describe, expect, it } from "vitest";

import { CAPACITY_OPTIONS, DEFAULT_CAPACITY, isCapacityOption, parseCapacity } from "./capacity";

describe("campaign capacity options", () => {
  it("offers the supported capacities in ascending order with 10% as the default", () => {
    expect([...CAPACITY_OPTIONS]).toEqual([0.05, 0.1, 0.15, 0.2, 0.25]);
    expect(DEFAULT_CAPACITY).toBe(0.1);
  });

  it("accepts only supported fractions, tolerating float noise", () => {
    expect(isCapacityOption(0.1)).toBe(true);
    expect(isCapacityOption(0.1 + 1e-12)).toBe(true);
    expect(isCapacityOption(0.3)).toBe(false);
    expect(isCapacityOption(0)).toBe(false);
  });

  it("parses fractions and percentages from strings and rejects the rest", () => {
    expect(parseCapacity("0.2")).toBe(0.2);
    expect(parseCapacity("20")).toBe(0.2);
    expect(parseCapacity("5")).toBe(0.05);
    expect(parseCapacity("0.3")).toBeNull();
    expect(parseCapacity("abc")).toBeNull();
    expect(parseCapacity(null)).toBeNull();
  });
});
