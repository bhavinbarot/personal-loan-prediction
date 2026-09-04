import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { CampaignRankResponse } from "@/lib/api/types";

import { CampaignShortlist } from "./campaign-shortlist";

function result(size: number, selected: number): CampaignRankResponse {
  return {
    capacity: selected / size,
    population_size: size,
    selected_count: selected,
    rankings: Array.from({ length: size }, (_, i) => ({
      rank: i + 1,
      index: i,
      customer_id: `Customer ${String(i + 1).padStart(3, "0")}`,
      response_probability: 0.95 - i * 0.01,
      selected: i < selected,
    })),
  };
}

describe("CampaignShortlist", () => {
  it("labels decisions as Selected or Not selected using business-safe wording", () => {
    render(<CampaignShortlist result={result(5, 2)} pending={false} />);

    const list = screen.getByRole("list", { name: "Ranked customers" });
    const items = within(list).getAllByRole("listitem");

    expect(items).toHaveLength(5);
    expect(items[0]).toHaveTextContent("Customer 001");
    expect(items[0]).toHaveTextContent("95.0%");
    expect(items[1]).toHaveTextContent("Selected");
    expect(items[2]).toHaveTextContent("Not selected");
    expect(screen.queryByText(/approved|eligible|rejected/i)).not.toBeInTheDocument();
  });

  it("paginates large populations and reveals more rows on demand", async () => {
    const user = userEvent.setup();
    render(<CampaignShortlist result={result(60, 6)} pending={false} />);

    expect(screen.getByText("Showing 25 of 60 ranked customers")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show 35 more" }));
    expect(screen.getByText("Showing 60 of 60 ranked customers")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Show/ })).not.toBeInTheDocument();
  });
});
