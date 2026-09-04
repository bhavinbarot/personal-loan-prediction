import { describe, expect, it } from "vitest";

import { isActivePath, navItems } from "./site";

describe("navigation", () => {
  it("exposes exactly the three primary sections", () => {
    expect(navItems.map((item) => item.label)).toEqual(["Overview", "Campaign Simulator", "Technical Validation"]);
  });

  it("marks only the matching section active", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/simulator", "/")).toBe(false);
    expect(isActivePath("/simulator", "/simulator")).toBe(true);
    expect(isActivePath("/validation/details", "/validation")).toBe(true);
    expect(isActivePath("/validation", "/simulator")).toBe(false);
  });
});
