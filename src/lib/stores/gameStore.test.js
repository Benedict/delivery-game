import { describe, it, expect, beforeEach } from "vitest";
import { get } from "svelte/store";
import {
  gameStore,
  startNewGame,
  investInMeasureAction,
  rollNVDiceAction,
  rollTDDiceAction,
  completeSprintAction,
} from "./gameStore.js";

describe("gameStore", () => {
  beforeEach(() => {
    startNewGame();
  });

  it("should initialize with a new game", () => {
    const game = get(gameStore);
    expect(game.state.currentSprint).toBe(1);
    expect(game.state.nvDice).toBe(8);
  });

  it("should invest in measure", () => {
    investInMeasureAction("reducedComplexity");
    const game = get(gameStore);
    expect(game.state.currentInvestment).toBe("reducedComplexity");
  });

  it("should roll NV dice", () => {
    rollNVDiceAction();
    const game = get(gameStore);
    const sprint = game.state.sprints[0];
    expect(sprint.nvRoll).toHaveLength(8);
  });

  it("should roll TD dice", () => {
    rollTDDiceAction();
    const game = get(gameStore);
    const sprint = game.state.sprints[0];
    expect(sprint.tdRoll).toHaveLength(4);
  });

  it("should complete sprint and advance", () => {
    rollNVDiceAction();
    rollTDDiceAction();
    completeSprintAction();

    const game = get(gameStore);
    expect(game.state.sprints[0].netNewValue).toBeGreaterThanOrEqual(0);
    expect(game.state.currentSprint).toBe(2);
  });
});
