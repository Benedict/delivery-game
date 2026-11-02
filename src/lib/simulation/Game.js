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
  applyImprovementOutcome
} from './BusinessRules.js';
import { checkForEvents, applyEventOutcome } from './EventSystem.js';
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
      weeklyMetrics: []
    },
    victoryConditions: scenario.victoryConditions,
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
 * @param {number} week - The week about to start
 * @param {object} conditions - Scenario victory conditions
 */
export function checkVictoryConditions(metrics, week, conditions) {
  const hasBusinessValue = metrics.businessValue >= conditions.businessValue;
  const hasCodeHealth = !conditions.codeHealth || metrics.codeHealth >= conditions.codeHealth;
  const withinTimeLimit = week <= conditions.weeks;

  if (hasBusinessValue && hasCodeHealth && withinTimeLimit) {
    return { victory: true, gameOver: true };
  }
  if (week > conditions.weeks) {
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

function deliver(item, metrics, week, rng) {
  if (item.type === 'feature') {
    const outcome = calculateFeatureDelivery(item, metrics.capacity, metrics.codeHealth, rng);
    return {
      metrics: applyFeatureOutcome(metrics, outcome),
      decision: { type: 'feature', week, feature: item, outcome }
    };
  }

  const outcome = calculateImprovementOutcome(item, metrics.capacity);
  return {
    metrics: applyImprovementOutcome(metrics, outcome),
    decision: { type: 'improvement', week, improvement: item, outcome }
  };
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

  let metrics = { ...state.metrics };
  const decisions = [];
  for (const item of completed) {
    const result = deliver(item, metrics, newWeek, rng);
    metrics = result.metrics;
    decisions.push(result.decision);
  }
  metrics.flowEfficiency = calculateFlowEfficiency(metrics.codeHealth);

  const workInProgress = [...remaining];
  const events = checkForEvents(metrics, state.history, newWeek, rng);
  for (const event of events) {
    metrics = applyEventOutcome(metrics, event);
    if (event.outcome.forcedFix) {
      workInProgress.push(forcedFixItem(newWeek));
    }
  }
  metrics.flowEfficiency = calculateFlowEfficiency(metrics.codeHealth);

  const allDecisions = [...state.history.decisions, ...decisions];
  const completedFeatureNames = allDecisions.filter(d => d.type === 'feature').map(d => d.feature.name);
  const wipFeatureNames = workInProgress.filter(item => item.type === 'feature').map(item => item.name);
  const { active } = checkDeadlines(state.opportunities, newWeek);
  const opportunities = [
    ...active,
    ...generateOpportunities(state.scenario, newWeek, metrics, completedFeatureNames, wipFeatureNames, rng)
  ];

  const { victory, gameOver } = checkVictoryConditions(metrics, newWeek, state.victoryConditions);
  const report = { week: state.week, completed, decisions, events, efficiency };

  const nextState = {
    ...state,
    week: newWeek,
    metrics,
    workInProgress,
    capacityAllocation: carryOverAllocation(workInProgress, state.capacityAllocation, metrics),
    opportunities,
    history: {
      events: [...state.history.events, ...events],
      decisions: allDecisions,
      weeklyMetrics: [...state.history.weeklyMetrics, { week: state.week, ...state.metrics }]
    },
    gameOver,
    victory,
    lastWeek: report
  };

  return { state: nextState, report };
}
