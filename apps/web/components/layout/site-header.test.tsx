import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SiteHeader } from "./site-header";

const pathnameMock = vi.fn(() => "/simulator");

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

describe("SiteHeader", () => {
  it("renders the three primary sections and marks the current one", () => {
    render(<SiteHeader />);

    const primary = screen.getByRole("navigation", { name: "Primary" });
    const links = within(primary).getAllByRole("link");

    expect(links.map((link) => link.textContent)).toEqual(["Overview", "Campaign Simulator", "Technical Validation"]);
    expect(within(primary).getByRole("link", { name: "Campaign Simulator" })).toHaveAttribute("aria-current", "page");
    expect(within(primary).getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current");
  });

  it("offers a mobile menu trigger and a theme control", () => {
    render(<SiteHeader />);

    expect(screen.getByRole("button", { name: "Open navigation menu" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change color theme" })).toBeInTheDocument();
  });
});
