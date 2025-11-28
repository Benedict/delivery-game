import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/svelte";
import DiceDisplay from "./DiceDisplay.svelte";

describe("DiceDisplay", () => {
  it("should render dice values", () => {
    render(DiceDisplay, { props: { dice: [1, 2, 3, 4, 5, 6] } });

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  it("should show total", () => {
    render(DiceDisplay, { props: { dice: [6, 6, 6], showTotal: true } });

    expect(screen.getByText(/Total: 18/i)).toBeInTheDocument();
  });

  it("should apply custom colors", () => {
    const { container } = render(DiceDisplay, {
      props: { dice: [4], color: "blue" },
    });

    const die = container.querySelector(".bg-blue-500");
    expect(die).toBeInTheDocument();
  });

  it("should render empty when no dice", () => {
    const { container } = render(DiceDisplay, { props: { dice: [] } });
    const dice = container.querySelectorAll(".die");
    expect(dice).toHaveLength(0);
  });
});
