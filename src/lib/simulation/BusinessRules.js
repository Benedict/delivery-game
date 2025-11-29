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
