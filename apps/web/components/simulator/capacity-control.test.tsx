import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CapacityControl } from "./capacity-control";

describe("CapacityControl", () => {
  it("offers every supported capacity and reports the chosen fraction", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CapacityControl value={0.1} onChange={onChange} />);

    expect(screen.getByRole("button", { name: "Contact 10% of customers" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("button")).toHaveLength(5);

    await user.click(screen.getByRole("button", { name: "Contact 25% of customers" }));

    expect(onChange).toHaveBeenCalledWith(0.25);
  });

  it("does not clear the selection when the active option is clicked again", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CapacityControl value={0.1} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Contact 10% of customers" }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
