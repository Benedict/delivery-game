import { describe, it, expect } from "vitest";
import {
  createInitialState,
  getCurrentSprint,
  startInvestment,
  canInvest,
  recordSprintRolls,
  advanceSprint,
} from "./GameState.js";

describe("GameState", () => {
  describe("createInitialState", () => {
    it("should create initial state with correct values", () => {
      const state = createInitialState();

      expect(state.currentSprint).toBe(1);
      expect(state.nvDice).toBe(8);
      expect(state.tdDice).toBe(4);
      expect(state.totalDice).toBe(12);
      expect(state.sprints).toHaveLength(10);
      expect(state.activeMeasures).toEqual([]);
      expect(state.completedMeasures).toEqual([]);
      expect(state.currentInvestment).toBeNull();
    });

    it("should initialize all sprints with empty data", () => {
      const state = createInitialState();

      state.sprints.forEach((sprint, index) => {
        expect(sprint.number).toBe(index + 1);
        expect(sprint.nvDiceCount).toBe(8);
        expect(sprint.tdDiceCount).toBe(4);
        expect(sprint.investedDice).toBe(0);
        expect(sprint.nvRoll).toBeNull();
        expect(sprint.tdRoll).toBeNull();
        expect(sprint.nvTotal).toBeNull();
        expect(sprint.tdTotal).toBeNull();
        expect(sprint.netNewValue).toBeNull();
        expect(sprint.cumulativeValue).toBe(0);
      });
    });
  });

  describe("getCurrentSprint", () => {
    it("should return current sprint data", () => {
      const state = createInitialState();
      const sprint = getCurrentSprint(state);

      expect(sprint.number).toBe(1);
      expect(sprint.nvDiceCount).toBe(8);
    });
  });

  describe("investment management", () => {
    it("should allow starting investment when none active", () => {
      const state = createInitialState();
      expect(canInvest(state, "reducedComplexity")).toBe(true);
    });

    it("should not allow investment when one is active", () => {
      const state = createInitialState();
      const newState = startInvestment(state, "reducedComplexity");
      expect(canInvest(newState, "codeReview")).toBe(false);
    });

    it("should not allow investing in same measure twice", () => {
      const state = createInitialState();
      state.completedMeasures = ["reducedComplexity"];
      expect(canInvest(state, "reducedComplexity")).toBe(false);
    });

    it("should start investment correctly", () => {
      const state = createInitialState();
      const newState = startInvestment(state, "reducedComplexity");

      expect(newState.currentInvestment).toBe("reducedComplexity");
      expect(newState.investmentProgress).toBe(0);
      expect(newState.nvDice).toBe(6); // 8 - 2 (cost of reduced complexity)
    });
  });

  describe("sprint management", () => {
    it("should record sprint rolls correctly", () => {
      const state = createInitialState();
      const nvRoll = [1, 2, 3, 4, 5, 6, 1, 2]; // sum = 24
      const tdRoll = [6, 6, 6, 6]; // sum = 24

      const newState = recordSprintRolls(state, nvRoll, tdRoll);
      const sprint = getCurrentSprint(newState);

      expect(sprint.nvRoll).toEqual(nvRoll);
      expect(sprint.tdRoll).toEqual(tdRoll);
      expect(sprint.nvTotal).toBe(24);
      expect(sprint.tdTotal).toBe(24);
      expect(sprint.netNewValue).toBe(0); // 24 - 24 = 0
      expect(sprint.cumulativeValue).toBe(0);
    });

    it("should calculate net new value correctly with positive result", () => {
      const state = createInitialState();
      const nvRoll = [6, 6, 6, 6, 6, 6, 6, 6]; // sum = 48
      const tdRoll = [1, 1, 1, 1]; // sum = 4

      const newState = recordSprintRolls(state, nvRoll, tdRoll);
      const sprint = getCurrentSprint(newState);

      expect(sprint.netNewValue).toBe(44); // 48 - 4 = 44
    });

    it("should not allow negative net new value", () => {
      const state = createInitialState();
      const nvRoll = [1, 1, 1, 1, 1, 1, 1, 1]; // sum = 8
      const tdRoll = [6, 6, 6, 6]; // sum = 24

      const newState = recordSprintRolls(state, nvRoll, tdRoll);
      const sprint = getCurrentSprint(newState);

      expect(sprint.netNewValue).toBe(0); // Can't be negative
    });

    it("should track cumulative value across sprints", () => {
      let state = createInitialState();

      // Sprint 1: NNV = 10
      state = recordSprintRolls(state, [2, 2, 2, 2, 2, 2, 2, 2], [1, 1, 1, 3]);
      expect(getCurrentSprint(state).cumulativeValue).toBe(10);

      state = advanceSprint(state);

      // Sprint 2: NNV = 15
      state = recordSprintRolls(state, [3, 3, 3, 3, 3, 3, 3, 3], [2, 2, 2, 3]);
      expect(getCurrentSprint(state).cumulativeValue).toBe(25); // 10 + 15
    });

    it("should advance to next sprint", () => {
      const state = createInitialState();
      const newState = advanceSprint(state);

      expect(newState.currentSprint).toBe(2);
    });

    it("should not advance past sprint 10", () => {
      let state = createInitialState();
      state.currentSprint = 10;

      const newState = advanceSprint(state);
      expect(newState.currentSprint).toBe(10);
    });
  });
});
