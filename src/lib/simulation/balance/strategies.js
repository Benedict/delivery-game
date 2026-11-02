// src/lib/simulation/balance/strategies.js
//
// Bot players used to check game balance. They stand in for kinds of human
// play: naive first attempts, fixed recipes, and an adaptive "mastery" player.
// A strategy decides what to start this week; the simulator then puts the
// team's whole weekly capacity on the work in progress.

import { startFeature, startImprovement } from '../Game.js';
import { getComplexityPoints, calculateWeeklyCapacity } from '../GameEngine.js';
import { getScenario } from '../ScenarioDefinitions.js';

const byValue = (a, b) => b.value - a.value;
const highestValue = state => [...state.opportunities].sort(byValue)[0];
const hasCompleted = (state, id) => state.history.decisions.some(d => d.improvement?.id === id);
const idle = state => state.workInProgress.length === 0;

function startBestFeature(state, choose = highestValue) {
  return state.opportunities.length ? startFeature(state, choose(state)) : state;
}

/** Naive: ships the most valuable feature on offer, never invests. */
export function featuresOnly(state) {
  return idle(state) ? startBestFeature(state) : state;
}

/** Naive: picks whatever is offered first, as a hurried first-timer might. */
export function firstOffered(state) {
  return idle(state) ? startBestFeature(state, s => s.opportunities[0]) : state;
}

/** Naive: a player clicking around without a plan (30% improvements). */
export function randomChoices(state, rng) {
  if (!idle(state)) return state;
  if (rng() < 0.3) {
    const ids = ['fixBugs', 'codeReviews', 'refactorPayment', 'hireSenior', 'adoptTDD'];
    return startImprovement(state, ids[Math.floor(rng() * ids.length)]);
  }
  return startBestFeature(state, s => s.opportunities[Math.floor(rng() * s.opportunities.length)]);
}

/** Fixed recipe: adopt pair programming once, then ship features. */
export function pairingFirst(state) {
  if (!idle(state)) return state;
  if (!hasCompleted(state, 'codeReviews')) return startImprovement(state, 'codeReviews');
  return startBestFeature(state);
}

/** Fixed recipe: adopt both practices (pairing, then TDD), then ship features. */
export function practicesFirst(state) {
  if (!idle(state)) return state;
  if (!hasCompleted(state, 'codeReviews')) return startImprovement(state, 'codeReviews');
  if (!hasCompleted(state, 'adoptTDD')) return startImprovement(state, 'adoptTDD');
  return startBestFeature(state);
}

/** Fixed recipe: keep code health at or above 60, otherwise ship. */
export function healthAbove60(state) {
  if (!idle(state)) return state;
  if (state.metrics.codeHealth < 60) {
    return startImprovement(state, hasCompleted(state, 'refactorPayment') ? 'fixBugs' : 'refactorPayment');
  }
  return startBestFeature(state);
}

/**
 * Adaptive: reads the scenario and the state. Invests early while there is
 * time for it to pay back, keeps health above what the scenario needs,
 * prefers value per point, and skips features it cannot finish in time.
 */
export function adaptive(state) {
  if (!idle(state)) return state;

  const { metrics, victoryConditions: goal } = state;
  const weeksLeft = goal.weeks - state.week + 1;
  const weekly = Math.max(1, calculateWeeklyCapacity(metrics.capacity, metrics.flowEfficiency));
  const healthFloor = goal.codeHealth ? goal.codeHealth + 10 : 30;
  // Where the team burns cash every week, bigger teams and slow-paying
  // investments cost more than they return.
  const burnsCash = Boolean(getScenario(state.scenario).mechanics?.burnRate);

  if (!hasCompleted(state, 'codeReviews') && weeksLeft > 6) return startImprovement(state, 'codeReviews');
  // TDD prevents new bugs; it is worth it once the codebase is healthy, not instead of fixing it.
  const healthy = metrics.codeHealth >= healthFloor;
  if (!burnsCash && healthy && !hasCompleted(state, 'adoptTDD') && weeksLeft > 8) return startImprovement(state, 'adoptTDD');
  if (metrics.codeHealth < healthFloor && weeksLeft > 2) {
    const bigFix = !hasCompleted(state, 'refactorPayment') && weeksLeft > 5;
    return startImprovement(state, bigFix ? 'refactorPayment' : 'fixBugs');
  }
  if (!burnsCash && !hasCompleted(state, 'hireSenior') && weeksLeft > 8 && metrics.businessValue >= 50) {
    return startImprovement(state, 'hireSenior');
  }

  const finishable = state.opportunities.filter(opp => {
    const weeksToFinish = Math.ceil(getComplexityPoints(opp.complexity) / weekly);
    return opp.createdWeek + opp.deadline >= state.week + weeksToFinish - 1 && weeksToFinish <= weeksLeft;
  });
  if (!finishable.length) return state;

  // Work finishes in whole weeks, so what matters is value per week of work,
  // not value per point.
  const valuePerWeek = opp => opp.value / Math.ceil(getComplexityPoints(opp.complexity) / weekly);
  return startFeature(state, [...finishable].sort((a, b) => valuePerWeek(b) - valuePerWeek(a))[0]);
}

export const NAIVE = { featuresOnly, firstOffered, randomChoices };
export const RECIPES = { pairingFirst, practicesFirst, healthAbove60 };
export const MASTERY = { adaptive };
export const ALL_STRATEGIES = { ...NAIVE, ...RECIPES, ...MASTERY };
