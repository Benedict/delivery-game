// src/lib/simulation/Game.js
//
// The game loop as pure functions: (state, input) -> new state.
// No Svelte, no globals; randomness is injected. The Svelte store is a thin
// adapter over these functions.

import { defaultRng } from './random.js';
import { getScenario } from './ScenarioDefinitions.js';
import {
  calculateFlowEfficiency,
  getComplexityPoints,
  calculateContextSwitchingPenalty,
  calculateWeeklyCapacity
} from './GameEngine.js';
import {
  calculateFeatureDelivery,
  applyFeatureOutcome,
  IMPROVEMENTS,
  calculateImprovementOutcome,
  applyImprovementOutcome,
  applyPractices
} from './BusinessRules.js';
import { checkForEvents, applyEventOutcome, nextLowHealthStreak } from './EventSystem.js';
import { generateOpportunities, checkDeadlines } from './OpportunityGenerator.js';

/** Capacity points needed per week of improvement work. */
export const POINTS_PER_IMPROVEMENT_WEEK = 40;

/**
 * @param {{ weeks: number }} improvement
 * @returns {number} Points needed to complete the improvement
 */
export function improvementPoints(improvement) {
  return improvement.weeks * POINTS_PER_IMPROVEMENT_WEEK;
}

/**
 * A forced fix (e.g. after a security incident) blocks all other work.
 * @param {object} state
 */
export function isBlockedByForcedFix(state) {
  return state.workInProgress.some(item => item.forced);
}

function canAct(state) {
  return Boolean(state) && !state.gameOver;
}

function canStartWork(state) {
  return canAct(state) && !isBlockedByForcedFix(state);
}

function toWorkItem(item, type, pointsNeeded, week) {
  return { ...item, type, pointsCompleted: 0, pointsNeeded, startedWeek: week };
}

/**
 * Create the initial state for a scenario.
 * @param {string} scenarioId
 * @param {{ rng?: import('./random.js').Rng }} [options]
 */
export function createGame(scenarioId = 'startup', { rng = defaultRng } = {}) {
  const scenario = getScenario(scenarioId);
  const metrics = { ...scenario.initialMetrics };
  metrics.flowEfficiency = calculateFlowEfficiency(metrics.codeHealth);

  return {
    scenario: scenarioId,
    week: 1,
    metrics,
    opportunities: generateOpportunities(scenarioId, 1, metrics, [], [], rng),
    workInProgress: [],
    capacityAllocation: {}, // { itemId: points }
    history: {
      events: [],
      decisions: [],
      weeklyMetrics: [],
      weeksLowHealth: 0
    },
    victoryConditions: scenario.victoryConditions,
    practices: [], // Ongoing bonuses from completed improvements
    hiringCostMultiplier: 1, // Discount on the next hire
    gameOver: false,
    victory: false
  };
}

/**
 * Move a feature opportunity into work in progress.
 * @param {object} state
 * @param {object} feature
 */
export function startFeature(state, feature) {
  if (!canStartWork(state)) return state;

  return {
    ...state,
    workInProgress: [
      ...state.workInProgress,
      toWorkItem(feature, 'feature', getComplexityPoints(feature.complexity), state.week)
    ],
    opportunities: state.opportunities.filter(opp => opp.id !== feature.id)
  };
}

/**
 * Start an improvement from the catalogue.
 * @param {object} state
 * @param {string} improvementId
 */
export function startImprovement(state, improvementId) {
  if (!canStartWork(state)) return state;

  const improvement = IMPROVEMENTS[improvementId];
  return {
    ...state,
    workInProgress: [
      ...state.workInProgress,
      toWorkItem(improvement, 'improvement', improvementPoints(improvement), state.week)
    ]
  };
}

/**
 * Set how many capacity points go to each work item this week.
 * @param {object} state
 * @param {Record<string, number>} allocation
 */
export function allocateCapacity(state, allocation) {
  if (!canAct(state)) return state;
  return { ...state, capacityAllocation: allocation };
}

/**
 * Has the player won or lost?
 * @param {object} metrics
 * @param {number} weeksCompleted - Weeks played so far, including the one just finished
 * @param {object} conditions - Scenario victory conditions
 */
export function checkVictoryConditions(metrics, weeksCompleted, conditions) {
  const hasBusinessValue = metrics.businessValue >= conditions.businessValue;
  const hasCodeHealth = !conditions.codeHealth || metrics.codeHealth >= conditions.codeHealth;
  const withinTimeLimit = weeksCompleted <= conditions.weeks;

  if (hasBusinessValue && hasCodeHealth && withinTimeLimit) {
    return { victory: true, gameOver: true };
  }
  if (weeksCompleted >= conditions.weeks) {
    return { victory: false, gameOver: true };
  }
  return { victory: false, gameOver: false };
}

function progressWork(workInProgress, capacityAllocation, efficiency) {
  const completed = [];
  const remaining = [];

  for (const item of workInProgress) {
    const allocated = capacityAllocation[item.id] || 0;
    const pointsCompleted = item.pointsCompleted + Math.round(allocated * efficiency);
    if (pointsCompleted >= item.pointsNeeded) {
      completed.push(item);
    } else {
      remaining.push({ ...item, pointsCompleted });
    }
  }

  return { completed, remaining };
}

function deliver(item, game, week, rng) {
  const { metrics, practices, hiringCostMultiplier } = game;

  if (item.type === 'feature') {
    const outcome = applyPractices(calculateFeatureDelivery(item, metrics.capacity, metrics.codeHealth, rng), practices);
    return {
      game: { ...game, metrics: applyFeatureOutcome(metrics, outcome) },
      decision: { type: 'feature', week, feature: item, outcome }
    };
  }

  const outcome = calculateImprovementOutcome(item, hiringCostMultiplier);
  return {
    game: {
      metrics: applyImprovementOutcome(metrics, outcome),
      practices: outcome.ongoingBonus && !practices.includes(outcome.ongoingBonus)
        ? [...practices, outcome.ongoingBonus]
        : practices,
      hiringCostMultiplier: item.isHire ? 1 : hiringCostMultiplier
    },
    decision: { type: 'improvement', week, improvement: item, outcome }
  };
}

/**
 * Opportunities an event makes available, with ids unique to the week.
 * @param {object} triggeredEvent
 * @param {number} week
 */
function opportunitiesFromEvent({ event, outcome }, week) {
  return [outcome.opportunityUnlocked, outcome.urgentFeature]
    .filter(Boolean)
    .map(opp => ({ ...opp, id: `${opp.id || event.id}-w${week}`, createdWeek: week }));
}

function forcedFixItem(week) {
  const securityFix = IMPROVEMENTS.securityFix;
  return { ...toWorkItem(securityFix, 'improvement', improvementPoints(securityFix), week), forced: true };
}

function carryOverAllocation(workInProgress, previousAllocation, metrics) {
  const blocked = workInProgress.some(item => item.forced);
  const allocation = {};

  for (const item of workInProgress) {
    if (item.forced) {
      // A forced fix takes the whole week's capacity.
      allocation[item.id] = calculateWeeklyCapacity(metrics.capacity, metrics.flowEfficiency);
    } else if (!blocked && previousAllocation[item.id]) {
      allocation[item.id] = previousAllocation[item.id];
    }
  }
  return allocation;
}

/**
 * What happened in a finished week. Also kept on state as `lastWeek` so the
 * UI can narrate it.
 * @typedef {object} WeekReport
 * @property {number} week - The week that just finished
 * @property {object[]} completed - Work items finished this week
 * @property {object[]} decisions - Delivery outcomes for those items, in the same order
 * @property {object[]} events - Events triggered at the end of the week
 * @property {number} efficiency - Context-switching multiplier applied this week
 */

/**
 * Finish the current week: progress work, deliver completed items, resolve
 * events, refresh opportunities and check for the end of the game.
 *
 * @param {object} state
 * @param {{ rng?: import('./random.js').Rng }} [options]
 * @returns {{ state: object, report: WeekReport }}
 */
export function advanceWeek(state, { rng = defaultRng } = {}) {
  if (!canAct(state)) {
    return { state, report: { week: state?.week, completed: [], decisions: [], events: [], efficiency: 1 } };
  }

  const newWeek = state.week + 1;
  const efficiency = calculateContextSwitchingPenalty(Object.keys(state.capacityAllocation).length);
  const { completed, remaining } = progressWork(state.workInProgress, state.capacityAllocation, efficiency);

  let game = {
    metrics: { ...state.metrics },
    practices: state.practices || [],
    hiringCostMultiplier: state.hiringCostMultiplier ?? 1
  };
  const decisions = [];
  for (const item of completed) {
    const result = deliver(item, game, newWeek, rng);
    game = result.game;
    decisions.push(result.decision);
  }
  let { metrics } = game;
  metrics.flowEfficiency = calculateFlowEfficiency(metrics.codeHealth);

  const workInProgress = [...remaining];
  const unlockedOpportunities = [];
  let { hiringCostMultiplier } = game;
  const weeksLowHealth = nextLowHealthStreak(metrics, state.history.weeksLowHealth);
  const events = checkForEvents(metrics, { ...state.history, weeksLowHealth }, newWeek, rng);
  for (const event of events) {
    metrics = applyEventOutcome(metrics, event);
    if (event.outcome.forcedFix && !workInProgress.some(item => item.forced)) {
      workInProgress.push(forcedFixItem(newWeek));
    }
    if (event.outcome.hiringCostReduction) {
      hiringCostMultiplier = 1 - event.outcome.hiringCostReduction;
    }
    unlockedOpportunities.push(...opportunitiesFromEvent(event, newWeek));
  }
  metrics.flowEfficiency = calculateFlowEfficiency(metrics.codeHealth);

  const allDecisions = [...state.history.decisions, ...decisions];
  const completedFeatureNames = allDecisions.filter(d => d.type === 'feature').map(d => d.feature.name);
  const wipFeatureNames = workInProgress.filter(item => item.type === 'feature').map(item => item.name);
  const { active } = checkDeadlines(state.opportunities, newWeek);
  const opportunities = [
    ...active,
    ...unlockedOpportunities,
    ...generateOpportunities(state.scenario, newWeek, metrics, completedFeatureNames, wipFeatureNames, rng)
  ];

  const { victory, gameOver } = checkVictoryConditions(metrics, state.week, state.victoryConditions);
  const report = { week: state.week, completed, decisions, events, efficiency };

  const nextState = {
    ...state,
    week: newWeek,
    metrics,
    practices: game.practices,
    hiringCostMultiplier,
    workInProgress,
    capacityAllocation: carryOverAllocation(workInProgress, state.capacityAllocation, metrics),
    opportunities,
    history: {
      events: [...state.history.events, ...events],
      decisions: allDecisions,
      weeklyMetrics: [...state.history.weeklyMetrics, { week: state.week, ...state.metrics }],
      weeksLowHealth
    },
    gameOver,
    victory,
    lastWeek: report
  };

  return { state: nextState, report };
}
