import { describe, expect, it } from "vitest";

import { metricsFixture } from "./fixtures/metrics";
import { campaignHighlight, findCampaignRow, selectedModelRow } from "./metrics";

describe("campaign metric selectors", () => {
  it("derives the headline validated outcome from the selected top-K fraction", () => {
    const highlight = campaignHighlight(metricsFixture);

    expect(highlight).not.toBeNull();
    expect(highlight?.capacity).toBe(0.1);
    expect(highlight?.contacted).toBe(100);
    expect(highlight?.captured).toBe(93);
    expect(highlight?.totalResponders).toBe(96);
    expect(highlight?.captureRate).toBeCloseTo(0.96875, 6);
    expect(highlight?.lift).toBeCloseTo(9.6875, 6);
  });

  it("finds campaign rows by capacity despite floating point noise", () => {
    expect(findCampaignRow(metricsFixture, 0.1 + 1e-12)?.customers_contacted).toBe(100);
    expect(findCampaignRow(metricsFixture, 0.3)).toBeUndefined();
    expect(campaignHighlight(metricsFixture, 0.3)).toBeNull();
  });

  it("returns the selected model row", () => {
    const row = selectedModelRow(metricsFixture);

    expect(row.model).toBe("random_forest");
    expect(row.label).toBe("Random Forest");
    expect(row.selected).toBe(true);
  });
});
