import {
  createInitialState,
  getCurrentSprint,
  advanceSprint,
  progressInvestment,
  applyMeasureBenefits,
  startInvestment,
  canInvest,
  applyTDModifiers,
  canRerollTD,
} from "./GameState.js";
import { rollDice } from "./DiceRoller.js";

/**
 * Create a new game
 * @returns {object} Game object
 */
export function createGame() {
  return {
    state: createInitialState(),
  };
}

/**
 * Invest in a TD-reducing measure
 * @param {object} game
 * @param {string} measureId
 * @returns {object} New game
 */
export function investInMeasure(game, measureId) {
  if (!canInvest(game.state, measureId)) {
    return game;
  }

  return {
    ...game,
    state: startInvestment(game.state, measureId),
  };
}

/**
 * Roll NV dice for current sprint
 * @param {object} game
 * @returns {object} New game
 */
export function rollNVDice(game) {
  const sprint = getCurrentSprint(game.state);
  const diceCount = game.state.nvDice;
  const rolls = rollDice(diceCount);
  const total = rolls.reduce((sum, die) => sum + die, 0);

  const updatedSprint = {
    ...sprint,
    nvDiceCount: diceCount,
    nvRoll: rolls,
    nvTotal: total,
  };

  const newSprints = [...game.state.sprints];
  newSprints[game.state.currentSprint - 1] = updatedSprint;

  return {
    ...game,
    state: {
      ...game.state,
      sprints: newSprints,
    },
  };
}

/**
 * Roll TD dice for current sprint
 * @param {object} game
 * @returns {object} New game
 */
export function rollTDDice(game) {
  const sprint = getCurrentSprint(game.state);
  const diceCount = game.state.tdDice;
  const rolls = rollDice(diceCount);
  const rawTotal = rolls.reduce((sum, die) => sum + die, 0);
  const total = applyTDModifiers(game.state, rawTotal);

  const updatedSprint = {
    ...sprint,
    tdDiceCount: diceCount,
    tdRoll: rolls,
    tdTotal: total,
  };

  const newSprints = [...game.state.sprints];
  newSprints[game.state.currentSprint - 1] = updatedSprint;

  return {
    ...game,
    state: {
      ...game.state,
      sprints: newSprints,
    },
  };
}

/**
 * Reroll TD dice (if continuous integration active)
 * @param {object} game
 * @param {number[]} diceIndices - Indices of dice to reroll
 * @returns {object} New game
 */
export function rerollTDDice(game, diceIndices) {
  if (!canRerollTD(game.state)) {
    return game;
  }

  const sprint = getCurrentSprint(game.state);
  const newRolls = [...sprint.tdRoll];

  diceIndices.forEach((index) => {
    newRolls[index] = rollDice(1)[0];
  });

  const rawTotal = newRolls.reduce((sum, die) => sum + die, 0);
  const total = applyTDModifiers(game.state, rawTotal);

  const updatedSprint = {
    ...sprint,
    tdRoll: newRolls,
    tdTotal: total,
  };

  const newSprints = [...game.state.sprints];
  newSprints[game.state.currentSprint - 1] = updatedSprint;

  return {
    ...game,
    state: {
      ...game.state,
      sprints: newSprints,
    },
  };
}

/**
 * Complete current sprint and advance to next
 * @param {object} game
 * @returns {object} New game
 */
export function completeSprint(game) {
  const sprint = getCurrentSprint(game.state);

  // Calculate net new value
  const netNewValue = Math.max(0, sprint.nvTotal - sprint.tdTotal);
  const previousSprint =
    game.state.currentSprint > 1
      ? game.state.sprints[game.state.currentSprint - 2]
      : null;
  const cumulativeValue = (previousSprint?.cumulativeValue || 0) + netNewValue;

  const updatedSprint = {
    ...sprint,
    netNewValue,
    cumulativeValue,
  };

  const newSprints = [...game.state.sprints];
  newSprints[game.state.currentSprint - 1] = updatedSprint;

  let newState = {
    ...game.state,
    sprints: newSprints,
  };

  // Progress investment
  newState = progressInvestment(newState);

  // Apply measure benefits if investment just completed
  newState = applyMeasureBenefits(newState);

  // Advance sprint
  newState = advanceSprint(newState);

  return {
    ...game,
    state: newState,
  };
}

/**
 * Check if game is over
 * @param {object} game
 * @returns {boolean}
 */
export function isGameOver(game) {
  return (
    game.state.currentSprint === 10 &&
    game.state.sprints[9].netNewValue !== null
  );
}

/**
 * Get final score
 * @param {object} game
 * @returns {number}
 */
export function getFinalScore(game) {
  return game.state.sprints[9].cumulativeValue;
}
