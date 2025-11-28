import { describe, it, expect } from "vitest";
import {
  createInitialState,
  getCurrentSprint,
  getSprint,
  startInvestment,
  canInvest,
  recordSprintRolls,
  advanceSprint,
  progressInvestment,
  applyMeasureBenefits,
  applyTDModifiers,
  canRerollTD,
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

    it('should get specific sprint by number', () => {
      const state = createInitialState();
      const sprint5 = getSprint(state, 5);
      expect(sprint5.number).toBe(5);
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

  describe("investment lifecycle", () => {
    it("should progress investment each sprint", () => {
      let state = createInitialState();
      state = startInvestment(state, "reducedComplexity"); // cost 2, duration 3

      expect(state.investmentProgress).toBe(0);

      state = progressInvestment(state);
      expect(state.investmentProgress).toBe(1);

      state = progressInvestment(state);
      expect(state.investmentProgress).toBe(2);
    });

    it("should complete investment after duration", () => {
      let state = createInitialState();
      state = startInvestment(state, "continuousIntegration"); // cost 1, duration 2

      state = progressInvestment(state);
      expect(state.currentInvestment).toBe("continuousIntegration");

      state = progressInvestment(state);
      expect(state.currentInvestment).toBeNull();
      expect(state.completedMeasures).toContain("continuousIntegration");
      expect(state.activeMeasures).toContain("continuousIntegration");
    });

    it("should return invested dice after completion", () => {
      let state = createInitialState();
      expect(state.nvDice).toBe(8);

      state = startInvestment(state, "reducedComplexity"); // cost 2
      expect(state.nvDice).toBe(6);

      // Complete investment
      state = progressInvestment(state);
      state = progressInvestment(state);
      state = progressInvestment(state);

      expect(state.nvDice).toBe(8); // Dice returned
    });

    it("should apply moveDice benefit correctly", () => {
      let state = createInitialState();
      expect(state.nvDice).toBe(8);
      expect(state.tdDice).toBe(4);

      state = startInvestment(state, "reducedComplexity"); // moves 2 dice
      state = progressInvestment(state);
      state = progressInvestment(state);
      state = progressInvestment(state);

      state = applyMeasureBenefits(state);

      expect(state.nvDice).toBe(10); // 8 + 2
      expect(state.tdDice).toBe(2); // 4 - 2
    });
  });

  describe("TD modifiers from measures", () => {
    it("should allow TD reroll when continuous integration active", () => {
      let state = createInitialState();
      state.activeMeasures = ["continuousIntegration"];

      expect(canRerollTD(state)).toBe(true);
    });

    it("should not allow reroll without continuous integration", () => {
      const state = createInitialState();
      expect(canRerollTD(state)).toBe(false);
    });

    it("should subtract from TD total with increased test coverage", () => {
      let state = createInitialState();
      state.activeMeasures = ["increasedTestCoverage"];

      const tdTotal = 20;
      const modified = applyTDModifiers(state, tdTotal);

      expect(modified).toBe(17); // 20 - 3
    });

    it("should not go below 0 when subtracting", () => {
      let state = createInitialState();
      state.activeMeasures = ["increasedTestCoverage"];

      const modified = applyTDModifiers(state, 2);
      expect(modified).toBe(0); // max(0, 2 - 3)
    });

    it("should not modify TD total without measures", () => {
      const state = createInitialState();
      const modified = applyTDModifiers(state, 20);
      expect(modified).toBe(20);
    });
  });
});
