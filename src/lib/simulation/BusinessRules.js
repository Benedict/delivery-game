// src/lib/simulation/BusinessRules.js

/**
 * Calculate the outcome of delivering a feature
 * @param {object} feature - Feature to deliver
 * @param {number} capacity - Team capacity
 * @param {number} codeHealth - Current code health
 * @returns {object} Delivery outcome
 */
export function calculateFeatureDelivery(feature, capacity, codeHealth) {
  const baseValue = feature.value;
  const complexityFactors = { low: 0.5, medium: 1.0, high: 1.5 };
  const complexityFactor = complexityFactors[feature.complexity] || 1.0;

  // Capacity affects delivery
  const capacityRatio = capacity / 100;
  const effectiveCapacity = Math.max(0.3, capacityRatio); // Min 30% delivery

  // Code health affects quality and speed
  const healthPenalty = codeHealth < 50 ? (50 - codeHealth) * 0.01 : 0;
  const deliveryEfficiency = Math.max(0.5, 1 - healthPenalty);

  const valueDelivered = Math.round(baseValue * effectiveCapacity * deliveryEfficiency);
  const hasBugs = Math.random() < calculateBugProbability(codeHealth);
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
    codeHealth: metrics.codeHealth + outcome.codeHealthDelta,
    satisfaction: Math.max(-100, Math.min(100,
      metrics.satisfaction + outcome.satisfactionDelta + bugPenalty
    ))
  };
}

/**
 * Available improvements
 */
export const IMPROVEMENTS = {
  fixBugs: {
    id: 'fixBugs',
    name: 'Fix Critical Bugs',
    description: 'Stabilize the codebase by fixing high-priority bugs',
    weeks: 1,
    codeHealthDelta: 10,
    satisfactionDelta: 5,
    capacityDelta: 0,
    capacityPenalty: 0
  },
  codeReviews: {
    id: 'codeReviews',
    name: 'Implement Code Reviews',
    description: 'Establish code review process to improve quality',
    weeks: 2,
    codeHealthDelta: 15,
    satisfactionDelta: 0,
    capacityDelta: 0,
    capacityPenalty: -10,
    ongoingBonus: 'reduceFeatureImpact' // Features degrade health less
  },
  refactorPayment: {
    id: 'refactorPayment',
    name: 'Refactor Payment Module',
    description: 'Major refactoring of critical payment system',
    weeks: 3,
    codeHealthDelta: 30,
    satisfactionDelta: 0,
    capacityDelta: 0,
    capacityPenalty: -15
  },
  hireSenior: {
    id: 'hireSenior',
    name: 'Hire Senior Engineer',
    description: 'Bring on experienced engineer to boost capacity',
    weeks: 2,
    codeHealthDelta: 5,
    satisfactionDelta: 0,
    capacityDelta: 20, // Permanent capacity increase
    capacityPenalty: -10, // Onboarding time
    businessValueCost: 50 // Hiring costs
  }
};

/**
 * Calculate the outcome of an improvement investment
 * @param {object} improvement - Improvement to invest in
 * @param {number} currentCapacity - Current team capacity
 * @returns {object} Improvement outcome
 */
export function calculateImprovementOutcome(improvement, currentCapacity) {
  return {
    weeksRequired: improvement.weeks,
    codeHealthDelta: improvement.codeHealthDelta,
    capacityDelta: improvement.capacityDelta || 0,
    capacityPenalty: improvement.capacityPenalty || 0,
    satisfactionDelta: improvement.satisfactionDelta || 0,
    businessValueCost: improvement.businessValueCost || 0,
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
    codeHealth: Math.min(100, metrics.codeHealth + outcome.codeHealthDelta),
    capacity: metrics.capacity + outcome.capacityDelta,
    satisfaction: Math.max(-100, Math.min(100,
      metrics.satisfaction + outcome.satisfactionDelta
    )),
    businessValue: metrics.businessValue - (outcome.businessValueCost || 0)
  };
}
