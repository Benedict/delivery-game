// src/lib/simulation/BusinessRules.js

/**
 * Calculate the outcome of delivering a feature.
 * @param {object} feature - Feature to deliver
 * @param {number} capacity - Team capacity
 * @param {number} codeHealth - Current code health
 * @param {Array<object>} [activeBonuses] - Active bonuses from game state
 * @returns {object} Delivery outcome
 */
export function calculateFeatureDelivery(feature, capacity, codeHealth, activeBonuses = []) {
  const baseValue = feature.value;
  const complexityFactors = { low: 0.5, medium: 1.0, high: 1.5 };
  const complexityFactor = complexityFactors[feature.complexity] || 1.0;

  const capacityRatio = capacity / 100;
  const effectiveCapacity = Math.max(0.3, capacityRatio);

  const healthPenalty = codeHealth < 50 ? (50 - codeHealth) * 0.01 : 0;
  const deliveryEfficiency = Math.max(0.5, 1 - healthPenalty);

  const marketVariability = 0.8 + (Math.random() * 0.4);

  const valueDelivered = Math.round(baseValue * effectiveCapacity * deliveryEfficiency * marketVariability);
  const hasBugs = Math.random() < calculateBugProbability(codeHealth, activeBonuses);
  const weeksRequired = 1;

  const satisfactionDelta = hasBugs ? 0 : Math.min(5, Math.round(baseValue / 10));

  const ppReduction = getBonusStrength(activeBonuses, 'reduceFeatureImpact', { complexity: feature.complexity });
  const baseCodeHealthDelta = -5 * complexityFactor * (1 + healthPenalty);
  const codeHealthDelta = Math.round(baseCodeHealthDelta * (1 - ppReduction));

  return {
    valueDelivered,
    hasBugs,
    weeksRequired,
    satisfactionDelta,
    codeHealthDelta
  };
}

/**
 * Calculate probability of bugs based on code health, with optional bonus reduction.
 * @param {number} codeHealth - Current code health (-100 to 100)
 * @param {Array<object>} [activeBonuses] - Active bonuses; reduceBugProbability lowers the result
 * @returns {number} Bug probability (0.0 to 1.0)
 */
export function calculateBugProbability(codeHealth, activeBonuses = []) {
  let baseProbability;
  if (codeHealth >= 100) baseProbability = 0;
  else if (codeHealth >= 80) baseProbability = 0.1;
  else if (codeHealth >= 50) baseProbability = Math.round((0.1 + (80 - codeHealth) * 0.0067) * 100) / 100;
  else if (codeHealth >= 0) baseProbability = Math.round((0.3 + (50 - codeHealth) * 0.008) * 100) / 100;
  else baseProbability = Math.min(1.0, Math.round((0.7 + Math.abs(codeHealth) * 0.006) * 100) / 100);

  const reduction = getBonusStrength(activeBonuses, 'reduceBugProbability', { codeHealth });
  return baseProbability * (1 - reduction);
}

/**
 * Look up the strength of an active ongoing bonus, scaled by its current maturity.
 * @param {Array<object>} activeBonuses - Active bonuses from game state
 * @param {string} type - Bonus type (e.g., 'reduceBugProbability')
 * @param {object} context - Context for magnitude lookup. For 'reduceBugProbability',
 *   include `codeHealth`. For 'reduceFeatureImpact', include `complexity`.
 * @returns {number} Reduction strength from 0.0 to 1.0
 */
export function getBonusStrength(activeBonuses, type, context) {
  const bonus = activeBonuses.find(b => b.type === type);
  if (!bonus) return 0;

  let baseReduction = 0;
  if (type === 'reduceBugProbability') {
    if (context.codeHealth >= 50) baseReduction = 0.20;
    else if (context.codeHealth >= 0) baseReduction = 0.50;
    else baseReduction = 0.70;
  } else if (type === 'reduceFeatureImpact') {
    if (context.complexity === 'low') baseReduction = 0.10;
    else if (context.complexity === 'medium') baseReduction = 0.30;
    else if (context.complexity === 'high') baseReduction = 0.50;
  }

  return baseReduction * bonus.maturity;
}

/**
 * Advance every active bonus by one week's ramp or decay, based on stress signals.
 * @param {Array<object>} activeBonuses - Active bonuses from game state
 * @param {object} metrics - Current metrics, must include codeHealth
 * @param {number} allocatedItemCount - Number of items in capacityAllocation
 * @returns {Array<object>} New array of bonuses with updated maturity
 */
export function updateBonusMaturity(activeBonuses, metrics, allocatedItemCount) {
  const wipStress = allocatedItemCount >= 4;
  const crisisStress = metrics.codeHealth < 0;

  let delta;
  if (wipStress && crisisStress) delta = -0.30;
  else if (wipStress || crisisStress) delta = -0.20;
  else delta = 0.175;

  return activeBonuses.map(bonus => ({
    ...bonus,
    maturity: Math.max(0, Math.min(1.0, bonus.maturity + delta))
  }));
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
    description: 'Stabilise the codebase by fixing high-priority bugs',
    weeks: 1,
    codeHealthDelta: 10,
    satisfactionDelta: 5,
    capacityDelta: 0,
    capacityPenalty: 0
  },
  codeReviews: {
    id: 'codeReviews',
    name: 'Implement Pair Programming',
    description: 'Establish pair programming practice to improve quality',
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
  },
  adoptTDD: {
    id: 'adoptTDD',
    name: 'Adopt Test-Driven Development',
    description: 'Write tests first to improve design and catch bugs early',
    weeks: 3,
    codeHealthDelta: 20,
    satisfactionDelta: -5, // Initial resistance to change
    capacityDelta: 0,
    capacityPenalty: -15, // Slower initially while learning
    ongoingBonus: 'reduceBugProbability' // Fewer bugs in features
  },
  securityFix: {
    id: 'securityFix',
    name: 'Emergency Security Fix',
    description: 'All hands on deck to fix critical security vulnerability',
    weeks: 2,
    codeHealthDelta: 30,
    satisfactionDelta: 10, // Restores some trust
    capacityDelta: 0,
    capacityPenalty: 0,
    forced: true, // This is a forced improvement
    minAllocation: 1.0 // Must allocate 100% of capacity
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

/**
 * Calculate weekly burn rate in pounds based on team capacity.
 * Burn scales at £0.20K per capacity point, so a team of 120 burns £24K per week.
 * @param {number} capacity - Current team capacity
 * @returns {number} Weekly burn in pounds (always non-negative)
 */
export function calculateWeeklyBurn(capacity) {
  return Math.max(0, capacity * 0.20);
}
