const TOTAL_SPRINTS = 10;
const INITIAL_NV_DICE = 8;
const INITIAL_TD_DICE = 4;
const TOTAL_DICE = 12;

/**
 * Create a sprint data object
 * @param {number} sprintNumber
 * @param {number} nvDice
 * @param {number} tdDice
 * @returns {object}
 */
function createSprint(
  sprintNumber,
  nvDice = INITIAL_NV_DICE,
  tdDice = INITIAL_TD_DICE
) {
  return {
    number: sprintNumber,
    nvDiceCount: nvDice,
    tdDiceCount: tdDice,
    investedDice: 0,
    nvRoll: null, // Array of individual die results
    tdRoll: null, // Array of individual die results
    nvTotal: null,
    tdTotal: null,
    netNewValue: null,
    cumulativeValue: 0,
  };
}

/**
 * Create initial game state
 * @returns {object} Initial game state
 */
export function createInitialState() {
  return {
    currentSprint: 1,
    nvDice: INITIAL_NV_DICE,
    tdDice: INITIAL_TD_DICE,
    totalDice: TOTAL_DICE,
    sprints: Array.from({ length: TOTAL_SPRINTS }, (_, i) =>
      createSprint(i + 1)
    ),
    activeMeasures: [], // Measures currently providing benefits
    completedMeasures: [], // All measures that have been fully invested in
    currentInvestment: null, // Current measure being invested in
    investmentProgress: 0, // Sprints invested so far
  };
}

/**
 * Get the current sprint data
 * @param {object} state
 * @returns {object} Current sprint
 */
export function getCurrentSprint(state) {
  return state.sprints[state.currentSprint - 1];
}

/**
 * Get a specific sprint by number
 * @param {object} state
 * @param {number} sprintNumber
 * @returns {object} Sprint data
 */
export function getSprint(state, sprintNumber) {
  return state.sprints[sprintNumber - 1];
}

import { getMeasure } from "./TDMeasures.js";

/**
 * Check if can invest in a measure
 * @param {object} state
 * @param {string} measureId
 * @returns {boolean}
 */
export function canInvest(state, measureId) {
  // Can't invest if already have an active investment
  if (state.currentInvestment !== null) {
    return false;
  }

  // Can't invest in a measure already completed
  if (state.completedMeasures.includes(measureId)) {
    return false;
  }

  return true;
}

/**
 * Start investing in a measure
 * @param {object} state
 * @param {string} measureId
 * @returns {object} New state
 */
export function startInvestment(state, measureId) {
  if (!canInvest(state, measureId)) {
    return state;
  }

  const measure = getMeasure(measureId);

  return {
    ...state,
    currentInvestment: measureId,
    investmentProgress: 0,
    nvDice: state.nvDice - measure.cost,
  };
}

/**
 * Record dice rolls for current sprint
 * @param {object} state
 * @param {number[]} nvRoll - Individual NV die results
 * @param {number[]} tdRoll - Individual TD die results
 * @returns {object} New state
 */
export function recordSprintRolls(state, nvRoll, tdRoll) {
  const currentSprint = getCurrentSprint(state);
  const previousSprint =
    state.currentSprint > 1 ? getSprint(state, state.currentSprint - 1) : null;

  const nvTotal = nvRoll.reduce((sum, die) => sum + die, 0);
  const tdTotal = tdRoll.reduce((sum, die) => sum + die, 0);
  const netNewValue = Math.max(0, nvTotal - tdTotal);
  const cumulativeValue = (previousSprint?.cumulativeValue || 0) + netNewValue;

  const updatedSprint = {
    ...currentSprint,
    nvRoll,
    tdRoll,
    nvTotal,
    tdTotal,
    netNewValue,
    cumulativeValue,
  };

  const newSprints = [...state.sprints];
  newSprints[state.currentSprint - 1] = updatedSprint;

  return {
    ...state,
    sprints: newSprints,
  };
}

/**
 * Advance to next sprint
 * @param {object} state
 * @returns {object} New state
 */
export function advanceSprint(state) {
  if (state.currentSprint >= TOTAL_SPRINTS) {
    return state;
  }

  return {
    ...state,
    currentSprint: state.currentSprint + 1,
  };
}
