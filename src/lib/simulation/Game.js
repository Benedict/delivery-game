// src/lib/simulation/Game.js
//
// The game loop as pure functions: (state, input) -> new state.
// No Svelte, no globals; randomness is injected. The Svelte store is a thin
// adapter over these functions.

import { defaultRng } from './random.js';
import { clampScore } from './metrics.js';
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
  updateBonusMaturity,
  calculateMarketDelta,
  calculateWeeklyBurn,
  calculateConfidenceDelta
} from './BusinessRules.js';
import { checkForEvents, applyEventOutcome, nextLowHealthStreak } from './EventSystem.js';
import { generateOpportunities, checkDeadlines } from './OpportunityGenerator.js';

/** Capacity points needed per week of improvement work. */
export const POINTS_PER_IMPROVEMENT_WEEK = 40;

/** Maturity of a practice bonus when its improvement completes. */
const INITIAL_BONUS_MATURITY = 0.3;

/** Investor confidence thresholds (startup). */
const FUNDING_PULLED_CONFIDENCE = -50;
const FUNDING_PULLED_AFTER_WEEKS = 2;
const HIGH_CONFIDENCE = 70;
const CONFIDENCE_AFTER_DECLINING = 60;

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
      weeksLowHealth: 0,
      ledger: [] // { week, kind: 'feature' | 'burn' | 'event' | 'hiring' | 'improvement', label, amount }
    },
    activeBonuses: [],
    consecutiveWeeksLowConfidence: 0,
    consecutiveWeeksHighConfidence: 0,
    acquisitionOfferDeclined: false,
    pendingDecision: null,
    victoryType: null,
    endReason: null, // 'targetReached' | 'acquired' | 'timeUp' | 'fundingPulled'
    hiringCostMultiplier: 1, // Discount on the next hire (talent attraction)
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
 * Accept a pending acquisition offer: the game ends in an acquisition victory.
 * @param {object} state
 */
export function acceptAcquisition(state) {
  if (!state || state.pendingDecision?.type !== 'acquisition') return state;
  return { ...state, gameOver: true, victory: true, victoryType: 'acquisition', endReason: 'acquired', pendingDecision: null };
}

/**
 * Decline a pending acquisition offer: investors trust you a little less and
 * the offer never returns.
 * @param {object} state
 */
export function declineAcquisition(state) {
  if (!state || state.pendingDecision?.type !== 'acquisition') return state;
  return {
    ...state,
    metrics: { ...state.metrics, investorConfidence: CONFIDENCE_AFTER_DECLINING },
    consecutiveWeeksHighConfidence: 0,
    acquisitionOfferDeclined: true,
    pendingDecision: null
  };
}

/**
 * Has the player won or lost on business value, health and time?
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

function totalAllocated(allocation) {
  return Object.values(allocation).reduce((sum, points) => sum + points, 0);
}

function endReasonFor({ fundingPulled, gameOver, victory }) {
  if (fundingPulled) return 'fundingPulled';
  if (!gameOver) return null;
  return victory ? 'targetReached' : 'timeUp';
}

function progressWork(workInProgress, capacityAllocation, efficiency) {
  const completed = [];
  const remaining = [];
  const progress = [];

  for (const item of workInProgress) {
    const allocated = capacityAllocation[item.id] || 0;
    const pointsAdded = Math.round(allocated * efficiency);
    const pointsCompleted = item.pointsCompleted + pointsAdded;
    progress.push({ id: item.id, name: item.name, pointsAdded, pointsCompleted: Math.min(pointsCompleted, item.pointsNeeded), pointsNeeded: item.pointsNeeded });
    if (pointsCompleted >= item.pointsNeeded) {
      completed.push(item);
    } else {
      remaining.push({ ...item, pointsCompleted });
    }
  }

  return { completed, remaining, progress };
}

function deliver(item, metrics, activeBonuses, hiringCostMultiplier, week, rng) {
  if (item.type === 'feature') {
    const outcome = calculateFeatureDelivery(item, metrics.capacity, metrics.codeHealth, activeBonuses, rng);
    return {
      metrics: applyFeatureOutcome(metrics, outcome),
      decision: { type: 'feature', week, feature: item, outcome },
      completion: { type: 'feature', hasBugs: outcome.hasBugs },
      bonus: null
    };
  }

  const outcome = calculateImprovementOutcome(item, metrics.capacity, hiringCostMultiplier);
  return {
    metrics: applyImprovementOutcome(metrics, outcome),
    decision: { type: 'improvement', week, improvement: item, outcome },
    completion: { type: 'improvement' },
    bonus: item.ongoingBonus
      ? { type: item.ongoingBonus, sourceImprovement: item.id, maturity: INITIAL_BONUS_MATURITY, completedWeek: week }
      : null
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

/**
 * Startup investor pressure: apply this week's confidence change and update
 * the low/high streak counters.
 */
function updateInvestorConfidence(state, metrics, completions, events) {
  const delta = calculateConfidenceDelta(metrics, completions, events);
  const investorConfidence = clampScore(metrics.investorConfidence + delta);
  return {
    metrics: { ...metrics, investorConfidence },
    lowWeeks: investorConfidence <= FUNDING_PULLED_CONFIDENCE ? state.consecutiveWeeksLowConfidence + 1 : 0,
    highWeeks: investorConfidence >= HIGH_CONFIDENCE ? state.consecutiveWeeksHighConfidence + 1 : 0
  };
}

function carryOverAllocation(workInProgress, previousAllocation, metrics) {
  const blocked = workInProgress.some(item => item.forced);
  const allocation = {};

  for (const item of workInProgress) {
    if (item.forced) {
      // A forced fix takes the whole week's capacity.
      allocation[item.id] = calculateWeeklyCapacity(metrics.capacity, metrics.flowEfficiency);
    } else if (!blocked && item.id in previousAllocation) {
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
 * @property {object[]} events - Events triggered this week (pre- and post-phase)
 * @property {number} efficiency - Context-switching multiplier applied this week
 * @property {object[]} progress - Points each work item gained this week ({ id, name, pointsAdded, pointsCompleted, pointsNeeded })
 */

/**
 * Finish the current week. Order matters (see docs/plans startup redesign):
 * deliver completed work, resolve events, mature practice bonuses, apply
 * burn and investor confidence, refresh opportunities, check the end of the
 * game, then post-phase events that may offer a decision.
 *
 * @param {object} state
 * @param {{ rng?: import('./random.js').Rng }} [options]
 * @returns {{ state: object, report: WeekReport }}
 */
export function advanceWeek(state, { rng = defaultRng } = {}) {
  if (!canAct(state)) {
    return { state, report: { week: state?.week, completed: [], decisions: [], events: [], efficiency: 1, progress: [] } };
  }

  const newWeek = state.week + 1;
  const scenario = getScenario(state.scenario);
  const allocatedItemCount = Object.keys(state.capacityAllocation).length;
  const efficiency = calculateContextSwitchingPenalty(allocatedItemCount);
  const { completed, remaining, progress } = progressWork(state.workInProgress, state.capacityAllocation, efficiency);

  // 1. Deliver completed work
  let metrics = { ...state.metrics };
  let activeBonuses = [...state.activeBonuses];
  const decisions = [];
  const completions = [];
  let hiringCostMultiplier = state.hiringCostMultiplier ?? 1;
  // Every change to business value is recorded where it happens, so the
  // ledger always adds up to the score.
  const ledger = [];
  const record = (kind, label, before, after) => {
    if (after !== before) ledger.push({ week: state.week, kind, label, amount: after - before });
  };
  for (const item of completed) {
    const result = deliver(item, metrics, state.activeBonuses, hiringCostMultiplier, newWeek, rng);
    if (item.isHire) hiringCostMultiplier = 1;
    const kind = item.type === 'feature' ? 'feature' : item.isHire ? 'hiring' : 'improvement';
    record(kind, item.name, metrics.businessValue, result.metrics.businessValue);
    metrics = result.metrics;
    decisions.push(result.decision);
    completions.push(result.completion);
    if (result.bonus) activeBonuses.push(result.bonus);
  }
  metrics.flowEfficiency = calculateFlowEfficiency(metrics.codeHealth);

  // 2. Events
  const workInProgress = [...remaining];
  const unlockedOpportunities = [];
  const eventState = {
    scenario: state.scenario,
    consecutiveWeeksHighConfidence: state.consecutiveWeeksHighConfidence,
    acquisitionOfferDeclined: state.acquisitionOfferDeclined
  };
  const weeksLowHealth = nextLowHealthStreak(metrics, state.history.weeksLowHealth, state.metrics.codeHealth);
  const history = { ...state.history, weeksLowHealth };
  const events = checkForEvents(metrics, history, newWeek, eventState, 'pre', rng);
  for (const event of events) {
    const before = metrics.businessValue;
    metrics = applyEventOutcome(metrics, event);
    record('event', event.event.name, before, metrics.businessValue);
    if (event.outcome.forcedFix && !workInProgress.some(item => item.forced)) {
      workInProgress.push(forcedFixItem(newWeek));
    }
    if (event.outcome.hiringCostReduction) {
      hiringCostMultiplier = 1 - event.outcome.hiringCostReduction;
    }
    unlockedOpportunities.push(...opportunitiesFromEvent(event, newWeek));
  }
  metrics.flowEfficiency = calculateFlowEfficiency(metrics.codeHealth);

  // Market position follows delivery and customer satisfaction
  metrics = { ...metrics, marketPosition: clampScore(metrics.marketPosition + calculateMarketDelta(metrics, completions)) };

  // 3. Practice bonuses mature or erode under end-of-week stress
  activeBonuses = updateBonusMaturity(activeBonuses, metrics, allocatedItemCount);

  // 4. Startup pressures: burn and investor confidence
  if (scenario.mechanics?.burnRate) {
    const before = metrics.businessValue;
    metrics = { ...metrics, businessValue: metrics.businessValue - calculateWeeklyBurn(metrics.capacity, scenario.mechanics.burnRate) };
    record('burn', 'Team running costs', before, metrics.businessValue);
  }
  let lowConfidenceWeeks = state.consecutiveWeeksLowConfidence;
  let highConfidenceWeeks = state.consecutiveWeeksHighConfidence;
  if (scenario.mechanics?.investorConfidence) {
    const confidence = updateInvestorConfidence(state, metrics, completions, events);
    metrics = confidence.metrics;
    lowConfidenceWeeks = confidence.lowWeeks;
    highConfidenceWeeks = confidence.highWeeks;
  }

  // 5. Opportunities
  const allDecisions = [...state.history.decisions, ...decisions];
  const completedFeatureNames = allDecisions.filter(d => d.type === 'feature').map(d => d.feature.name);
  const { active } = checkDeadlines(state.opportunities, newWeek);
  const offered = [...active];
  const isOffered = name => offered.some(opp => opp.name === name);
  for (const opp of unlockedOpportunities) {
    if (!isOffered(opp.name)) offered.push(opp);
  }
  const unavailableNames = [
    ...workInProgress.filter(item => item.type === 'feature').map(item => item.name),
    ...offered.map(opp => opp.name)
  ];
  const opportunities = [
    ...offered,
    ...generateOpportunities(state.scenario, newWeek, metrics, completedFeatureNames, unavailableNames, rng)
  ];

  // 6. End of game
  const fundingPulled = Boolean(scenario.mechanics?.investorConfidence) && lowConfidenceWeeks >= FUNDING_PULLED_AFTER_WEEKS;
  const result = checkVictoryConditions(metrics, state.week, state.victoryConditions);
  const gameOver = fundingPulled || result.gameOver;

  // 7. Post-phase events use the just-updated counters, and cannot offer a
  // decision in a week that ends the game.
  const postEventState = { ...eventState, consecutiveWeeksHighConfidence: highConfidenceWeeks };
  const postEvents = checkForEvents(metrics, history, newWeek, postEventState, 'post', rng);
  let pendingDecision = state.pendingDecision;
  if (!gameOver && postEvents.some(event => event.outcome?.pendingDecision === 'acquisition')) {
    pendingDecision = { type: 'acquisition', week: newWeek };
  }

  const allEvents = [...events, ...postEvents];
  const report = { week: state.week, completed, decisions, events: allEvents, efficiency, progress };

  const nextState = {
    ...state,
    week: newWeek,
    metrics,
    workInProgress,
    capacityAllocation: carryOverAllocation(workInProgress, state.capacityAllocation, metrics),
    opportunities,
    activeBonuses,
    hiringCostMultiplier,
    consecutiveWeeksLowConfidence: lowConfidenceWeeks,
    consecutiveWeeksHighConfidence: highConfidenceWeeks,
    pendingDecision,
    history: {
      events: [...state.history.events, ...allEvents],
      decisions: allDecisions,
      weeklyMetrics: [...state.history.weeklyMetrics, { week: state.week, ...state.metrics, allocatedPoints: totalAllocated(state.capacityAllocation) }],
      weeksLowHealth,
      ledger: [...(state.history.ledger ?? []), ...ledger]
    },
    gameOver,
    victory: fundingPulled ? false : result.victory,
    endReason: endReasonFor({ fundingPulled, ...result }),
    lastWeek: report
  };

  return { state: nextState, report };
}
