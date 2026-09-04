import { describe, expect, it } from "vitest";

import { formatCapacity, formatCount, formatDecimal, formatLift, formatPercent, formatThousands } from "./format";

describe("format helpers", () => {
  it("formats report values consistently with the Python reports", () => {
    expect(formatPercent(0.96875)).toBe("96.9%");
    expect(formatDecimal(0.9930534987514714)).toBe("0.993");
    expect(formatLift(9.6875)).toBe("9.69x");
    expect(formatCapacity(0.1)).toBe("10%");
    expect(formatCapacity(0.05)).toBe("5%");
    expect(formatCount(5000)).toBe("5,000");
    expect(formatThousands(145)).toBe("$145.0k");
  });

  it("renders a dash for non-finite values instead of NaN", () => {
    expect(formatPercent(Number.NaN)).toBe("—");
    expect(formatLift(Number.POSITIVE_INFINITY)).toBe("—");
    expect(formatCount(Number.NaN)).toBe("—");
  });
});
