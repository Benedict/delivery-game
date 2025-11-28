import { describe, it, expect, vi } from "vitest";
import {
  createGame,
  investInMeasure,
  rollNVDice,
  rollTDDice,
  rerollTDDice,
  completeSprint,
  isGameOver,
  getFinalScore,
} from "./GameController.js";

describe("GameController", () => {
  describe("createGame", () => {
    it("should create a new game", () => {
      const game = createGame();
      expect(game.state.currentSprint).toBe(1);
      expect(game.state.nvDice).toBe(8);
    });
  });

  describe("investInMeasure", () => {
    it("should invest in a measure", () => {
      const game = createGame();
      const newGame = investInMeasure(game, "reducedComplexity");

      expect(newGame.state.currentInvestment).toBe("reducedComplexity");
      expect(newGame.state.nvDice).toBe(6);
    });

    it("should not allow duplicate investments", () => {
      let game = createGame();
      game = investInMeasure(game, "reducedComplexity");

      const result = investInMeasure(game, "codeReview");
      expect(result).toEqual(game); // No change
    });
  });

  describe("rollNVDice", () => {
    it("should roll NV dice based on current count", () => {
      const game = createGame();
      const newGame = rollNVDice(game);

      const sprint = newGame.state.sprints[0];
      expect(sprint.nvRoll).toHaveLength(8);
      expect(sprint.nvTotal).toBeGreaterThan(0);
    });

    it("should account for invested dice", () => {
      let game = createGame();
      game = investInMeasure(game, "reducedComplexity"); // -2 dice
      game = rollNVDice(game);

      const sprint = game.state.sprints[0];
      expect(sprint.nvRoll).toHaveLength(6);
    });
  });

  describe("rollTDDice", () => {
    it("should roll TD dice and apply modifiers", () => {
      const game = createGame();
      const newGame = rollTDDice(game);

      const sprint = newGame.state.sprints[0];
      expect(sprint.tdRoll).toHaveLength(4);
      expect(sprint.tdTotal).toBeGreaterThanOrEqual(0);
    });
  });

  describe("completeSprint", () => {
    it("should calculate net new value and advance sprint", () => {
      let game = createGame();
      game = rollNVDice(game);
      game = rollTDDice(game);
      game = completeSprint(game);

      expect(game.state.sprints[0].netNewValue).toBeGreaterThanOrEqual(0);
      expect(game.state.currentSprint).toBe(2);
    });

    it("should progress investment when advancing", () => {
      let game = createGame();
      game = investInMeasure(game, "continuousIntegration");
      game = rollNVDice(game);
      game = rollTDDice(game);

      expect(game.state.investmentProgress).toBe(0);

      game = completeSprint(game);
      expect(game.state.investmentProgress).toBe(1);
    });
  });

  describe("isGameOver", () => {
    it("should return false before sprint 10", () => {
      const game = createGame();
      expect(isGameOver(game)).toBe(false);
    });

    it("should return true after sprint 10 is complete", () => {
      let game = createGame();
      game.state.currentSprint = 10;
      game.state.sprints[9].netNewValue = 20; // Sprint 10 completed

      expect(isGameOver(game)).toBe(true);
    });
  });

  describe("getFinalScore", () => {
    it("should return cumulative value from sprint 10", () => {
      const game = createGame();
      game.state.sprints[9].cumulativeValue = 250;

      expect(getFinalScore(game)).toBe(250);
    });
  });
});
