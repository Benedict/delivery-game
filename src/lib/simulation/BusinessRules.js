// src/lib/simulation/BusinessRules.js
import { clampScore } from './metrics.js';
import { defaultRng } from './random.js';

/**
 * Calculate the outcome of delivering a feature
 * @param {object} feature - Feature to deliver
 * @param {number} capacity - Team capacity
 * @param {number} codeHealth - Current code health
 * @param {import('./random.js').Rng} [rng] - Random source
 * @returns {object} Delivery outcome
 */
export function calculateFeatureDelivery(feature, capacity, codeHealth, rng = defaultRng) {
  const baseValue = feature.value;
  const complexityFactors = { low: 0.5, medium: 1.0, high: 1.5 };
  const complexityFactor = complexityFactors[feature.complexity] || 1.0;

  // Capacity affects delivery
  const capacityRatio = capacity / 100;
  const effectiveCapacity = Math.max(0.3, capacityRatio); // Min 30% delivery

  // Code health affects quality and speed
  const healthPenalty = codeHealth < 50 ? (50 - codeHealth) * 0.01 : 0;
  const deliveryEfficiency = Math.max(0.5, 1 - healthPenalty);

  // Market variability: features might not hit their target value
  // Random factor between 0.8 and 1.2 (±20% variability)
  const marketVariability = 0.8 + (rng() * 0.4);

  const valueDelivered = Math.round(baseValue * effectiveCapacity * deliveryEfficiency * marketVariability);
  const hasBugs = rng() < calculateBugProbability(codeHealth);
  const weeksRequired = 1; // Simplified: all features take 1 week

  // Calculate satisfaction change
  const satisfactionDelta = hasBugs ? 0 : Math.min(5, Math.round(baseValue / 10));

  return {
    valueDelivered,
    hasBugs,
    weeksRequired,
    satisfactionDelta,
    codeHealthDelta: Math.round(-5 * complexityFactor * (1 + healthPenalty))
  };
}

/**
 * Calculate probability of bugs based on code health
 * @param {number} codeHealth - Current code health (-100 to 100)
 * @returns {number} Bug probability (0.0 to 1.0)
 */
export function calculateBugProbability(codeHealth) {
  if (codeHealth >= 100) return 0;
  if (codeHealth >= 80) return 0.1;
  if (codeHealth >= 50) return Math.round((0.1 + (80 - codeHealth) * 0.0067) * 100) / 100;
  if (codeHealth >= 0) return Math.round((0.3 + (50 - codeHealth) * 0.008) * 100) / 100;
  return Math.min(1.0, Math.round((0.7 + Math.abs(codeHealth) * 0.006) * 100) / 100);
}

/**
 * Apply feature delivery outcome to current metrics
 * @param {object} metrics - Current metrics
 * @param {object} outcome - Delivery outcome
 * @returns {object} Updated metrics
 */
export function applyFeatureOutcome(metrics, outcome) {
  const bugPenalty = outcome.hasBugs ? -15 : 0;

  return {
    ...metrics,
    businessValue: metrics.businessValue + outcome.valueDelivered,
    codeHealth: clampScore(metrics.codeHealth + outcome.codeHealthDelta),
    satisfaction: clampScore(metrics.satisfaction + outcome.satisfactionDelta + bugPenalty)
  };
}

/**
 * Available improvements
 */
export const IMPROVEMENTS = {
  fixBugs: {
    id: 'fixBugs',
    name: 'Fix Critical Bugs',
    description: 'Stabilise the codebase by fixing high-priority bugs',
    weeks: 1,
    codeHealthDelta: 10,
    satisfactionDelta: 5,
    capacityDelta: 0
  },
  codeReviews: {
    id: 'codeReviews',
    name: 'Implement Pair Programming',
    description: 'Establish pair programming; from then on, features damage code health half as much',
    weeks: 2,
    codeHealthDelta: 15,
    satisfactionDelta: 0,
    capacityDelta: 0,
    ongoingBonus: 'reduceFeatureImpact' // Features degrade health half as much from then on
  },
  refactorPayment: {
    id: 'refactorPayment',
    name: 'Refactor Payment Module',
    description: 'Major refactoring of critical payment system',
    weeks: 3,
    codeHealthDelta: 30,
    satisfactionDelta: 0,
    capacityDelta: 0
  },
  hireSenior: {
    id: 'hireSenior',
    name: 'Hire Senior Engineer',
    description: 'Bring on experienced engineer to boost capacity',
    weeks: 2,
    codeHealthDelta: 5,
    satisfactionDelta: 0,
    capacityDelta: 20, // Permanent capacity increase
    businessValueCost: 50, // Hiring costs
    isHire: true // Cost is reduced by talent attraction
  },
  securityFix: {
    id: 'securityFix',
    name: 'Emergency Security Fix',
    description: 'All hands on deck to fix critical security vulnerability',
    weeks: 2,
    codeHealthDelta: 30,
    satisfactionDelta: 10, // Restores some trust
    capacityDelta: 0,
    forced: true // Takes all capacity and blocks other work until done
  }
};

/** How much of a feature's code health damage remains with pair programming. */
export const PAIRING_IMPACT_FACTOR = 0.5;

/**
 * Adjust a feature delivery outcome for practices the team has adopted.
 * @param {object} outcome - Feature delivery outcome
 * @param {string[]} practices - Ongoing bonuses in effect
 * @returns {object} Adjusted outcome
 */
export function applyPractices(outcome, practices = []) {
  if (!practices.includes('reduceFeatureImpact')) return outcome;
  return { ...outcome, codeHealthDelta: Math.round(outcome.codeHealthDelta * PAIRING_IMPACT_FACTOR) };
}

/**
 * Calculate the outcome of an improvement investment
 * @param {object} improvement - Improvement to invest in
 * @param {number} [hiringCostMultiplier] - Discount on hiring costs (1 = full price)
 * @returns {object} Improvement outcome
 */
export function calculateImprovementOutcome(improvement, hiringCostMultiplier = 1) {
  const baseCost = improvement.businessValueCost || 0;
  return {
    weeksRequired: improvement.weeks,
    codeHealthDelta: improvement.codeHealthDelta,
    capacityDelta: improvement.capacityDelta || 0,
    satisfactionDelta: improvement.satisfactionDelta || 0,
    businessValueCost: improvement.isHire ? Math.round(baseCost * hiringCostMultiplier) : baseCost,
    ongoingBonus: improvement.ongoingBonus || null
  };
}

/**
 * Apply improvement outcome to current metrics
 * @param {object} metrics - Current metrics
 * @param {object} outcome - Improvement outcome
 * @returns {object} Updated metrics
 */
export function applyImprovementOutcome(metrics, outcome) {
  return {
    ...metrics,
    codeHealth: clampScore(metrics.codeHealth + outcome.codeHealthDelta),
    capacity: metrics.capacity + outcome.capacityDelta,
    satisfaction: clampScore(metrics.satisfaction + outcome.satisfactionDelta),
    businessValue: metrics.businessValue - (outcome.businessValueCost || 0)
  };
}
