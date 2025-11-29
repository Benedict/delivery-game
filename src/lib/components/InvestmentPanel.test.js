import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import InvestmentPanel from "./InvestmentPanel.svelte";
import { getAllMeasures } from "../game/TDMeasures.js";

describe("InvestmentPanel", () => {
  const measures = getAllMeasures();

  it("should render all measures", () => {
    render(InvestmentPanel, {
      props: {
        availableMeasures: measures,
        activeMeasures: [],
        currentInvestment: null,
      },
    });

    expect(screen.getByText("Reduced Complexity")).toBeInTheDocument();
    expect(screen.getByText("Code Review")).toBeInTheDocument();
    expect(screen.getByText("Continuous Integration")).toBeInTheDocument();
    expect(screen.getByText("Increased Test Coverage")).toBeInTheDocument();
  });

  it("should show cost and duration", () => {
    render(InvestmentPanel, {
      props: {
        availableMeasures: [measures[0]],
        activeMeasures: [],
        currentInvestment: null,
      },
    });

    expect(screen.getByText(/2 NV dice for 3 turns/i)).toBeInTheDocument();
  });

  it("should disable completed measures", () => {
    const { container } = render(InvestmentPanel, {
      props: {
        availableMeasures: measures,
        activeMeasures: [],
        currentInvestment: null,
        completedMeasures: ["reducedComplexity"],
      },
    });

    // Find the Reduced Complexity card and its button
    const cards = container.querySelectorAll('.measure-card');
    const reducedComplexityCard = Array.from(cards).find(card =>
      card.textContent.includes("Reduced Complexity")
    );
    const button = reducedComplexityCard.querySelector('button');

    expect(button).toBeDisabled();
  });

  it("should call oninvest callback when clicked", async () => {
    let investedId = null;

    render(InvestmentPanel, {
      props: {
        availableMeasures: [measures[0]],
        activeMeasures: [],
        currentInvestment: null,
        oninvest: (event) => {
          investedId = event.detail;
        },
      },
    });

    const button = screen.getByText("Invest");
    await fireEvent.click(button);

    expect(investedId).toBe("reducedComplexity");
  });
});
