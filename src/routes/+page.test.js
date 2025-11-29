import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import Page from "./+page.svelte";
import { gameStore } from "../lib/stores/gameStore.js";

describe("Main Game Page Integration", () => {
  beforeEach(() => {
    // Reset game store before each test
    gameStore.reset();
  });

  // Helper function to start game
  async function startGame() {
    const startButton = screen.getByRole("button", { name: /Start Game/i });
    await fireEvent.click(startButton);
  }

  it("should render game header", () => {
    render(Page);

    expect(screen.getByText("Dice of Debt")).toBeInTheDocument();
    expect(
      screen.getByText("An Educational Game About Technical Debt")
    ).toBeInTheDocument();
  });

  it("should display current sprint information", async () => {
    render(Page);
    await startGame();

    expect(screen.getByText(/Sprint 1 of 10/i)).toBeInTheDocument();
  });

  it("should integrate DiceDisplay component", async () => {
    render(Page);
    await startGame();

    // Roll NV dice
    const rollNVButton = screen.getByRole("button", {
      name: /Roll NV Dice/i,
    });
    await fireEvent.click(rollNVButton);

    // Check that dice are displayed
    const diceElements = screen.getAllByText(/[1-6]/);
    expect(diceElements.length).toBeGreaterThan(0);
  });

  it("should integrate InvestmentPanel component", async () => {
    render(Page);
    await startGame();

    // Check that investment panel is visible
    expect(screen.getByText("TD-Reducing Measures")).toBeInTheDocument();
    expect(screen.getByText("Reduced Complexity")).toBeInTheDocument();
    expect(screen.getByText("Code Review")).toBeInTheDocument();
  });

  it("should integrate ScoreSheet component", async () => {
    render(Page);
    await startGame();

    // Check that score sheet is visible
    expect(screen.getByText("Scoring Sheet")).toBeInTheDocument();
  });

  it("should complete full game flow: roll NV -> roll TD -> complete sprint", async () => {
    render(Page);
    await startGame();

    // Roll NV dice
    const rollNVButton = screen.getByRole("button", {
      name: /Roll NV Dice/i,
    });
    await fireEvent.click(rollNVButton);

    // Roll TD dice
    const rollTDButton = screen.getByRole("button", {
      name: /Roll TD Dice/i,
    });
    await fireEvent.click(rollTDButton);

    // Complete sprint button should now be available
    const completeButton = screen.getByRole("button", {
      name: /Complete Sprint 1/i,
    });
    expect(completeButton).toBeInTheDocument();
    await fireEvent.click(completeButton);

    // Should advance to sprint 2
    expect(screen.getByText(/Sprint 2 of 10/i)).toBeInTheDocument();
  });

  it("should show game over screen after sprint 10", async () => {
    render(Page);
    await startGame();

    // Fast-forward through all 10 sprints
    for (let i = 1; i <= 10; i++) {
      const rollNVButton = screen.getByRole("button", {
        name: /Roll NV Dice/i,
      });
      await fireEvent.click(rollNVButton);

      const rollTDButton = screen.getByRole("button", {
        name: /Roll TD Dice/i,
      });
      await fireEvent.click(rollTDButton);

      const completeButton = screen.getByRole("button", {
        name: new RegExp(`Complete Sprint ${i}`, "i"),
      });
      await fireEvent.click(completeButton);
    }

    // Should show game complete message
    expect(screen.getAllByText(/Game Complete!/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Final Score:/i).length).toBeGreaterThan(0);
  });

  it("should allow restarting game", async () => {
    render(Page);
    await startGame();

    // Complete first sprint
    const rollNVButton = screen.getByRole("button", {
      name: /Roll NV Dice/i,
    });
    await fireEvent.click(rollNVButton);

    const rollTDButton = screen.getByRole("button", {
      name: /Roll TD Dice/i,
    });
    await fireEvent.click(rollTDButton);

    const completeButton = screen.getByRole("button", {
      name: /Complete Sprint 1/i,
    });
    await fireEvent.click(completeButton);

    expect(screen.getByText(/Sprint 2 of 10/i)).toBeInTheDocument();

    // Note: Restart functionality will be tested when game over screen is shown
  });

  describe("Variant Toggle", () => {
    it("should show game setup screen initially", () => {
      render(Page);

      expect(screen.getByText("Game Setup")).toBeInTheDocument();
      expect(screen.getByText("Standard Mode")).toBeInTheDocument();
      expect(screen.getByText("Uncertain Outcomes Variant")).toBeInTheDocument();
    });

    it("should start game in standard mode when selected", async () => {
      render(Page);

      // Select standard mode
      const standardRadio = screen.getByLabelText(/Standard Mode/i);
      await fireEvent.click(standardRadio);

      // Click start game
      const startButton = screen.getByRole("button", { name: /Start Game/i });
      await fireEvent.click(startButton);

      // Should show game UI (not setup screen)
      expect(screen.queryByText("Game Setup")).not.toBeInTheDocument();
      expect(screen.getByText(/Sprint 1 of 10/i)).toBeInTheDocument();
    });

    it("should start game in uncertain mode when selected", async () => {
      render(Page);

      // Select uncertain mode
      const uncertainRadio = screen.getByLabelText(/Uncertain Outcomes Variant/i);
      await fireEvent.click(uncertainRadio);

      // Click start game
      const startButton = screen.getByRole("button", { name: /Start Game/i });
      await fireEvent.click(startButton);

      // Should show game UI (not setup screen)
      expect(screen.queryByText("Game Setup")).not.toBeInTheDocument();
      expect(screen.getByText(/Sprint 1 of 10/i)).toBeInTheDocument();
    });

    it("should return to setup screen when restarting game", async () => {
      render(Page);

      // Start game
      const standardRadio = screen.getByLabelText(/Standard Mode/i);
      await fireEvent.click(standardRadio);
      const startButton = screen.getByRole("button", { name: /Start Game/i });
      await fireEvent.click(startButton);

      // Complete all 10 sprints
      for (let i = 1; i <= 10; i++) {
        const rollNVButton = screen.getByRole("button", {
          name: /Roll NV Dice/i,
        });
        await fireEvent.click(rollNVButton);

        const rollTDButton = screen.getByRole("button", {
          name: /Roll TD Dice/i,
        });
        await fireEvent.click(rollTDButton);

        const completeButton = screen.getByRole("button", {
          name: new RegExp(`Complete Sprint ${i}`, "i"),
        });
        await fireEvent.click(completeButton);
      }

      // Click play again
      const playAgainButton = screen.getByRole("button", { name: /Play Again/i });
      await fireEvent.click(playAgainButton);

      // Should return to setup screen
      expect(screen.getByText("Game Setup")).toBeInTheDocument();
    });
  });
});
