// src/lib/simulation/GameEngine.js

/**
 * Create initial metrics based on scenario
 * @param {string} scenario - 'startup' | 'enterprise' | 'greenfield'
 * @returns {object} Initial metrics
 */
export function createInitialMetrics(scenario) {
  const scenarios = {
    startup: { capacity: 120, codeHealth: 70, satisfaction: 50, marketPosition: 50, businessValue: 0 },
    enterprise: { capacity: 80, codeHealth: -20, satisfaction: 60, marketPosition: 40, businessValue: 0 },
    greenfield: { capacity: 100, codeHealth: 80, satisfaction: 50, marketPosition: 50, businessValue: 0 }
  };

  const metrics = scenarios[scenario] || scenarios.greenfield;
  metrics.flowEfficiency = Math.round(calculateFlowEfficiency(metrics.codeHealth) * 100) / 100;

  return metrics;
}

/**
 * Calculate team capacity based on base capacity and code health
 * Code health affects productivity: good health = more capacity, poor health = less
 * @param {number} baseCapacity - Base capacity (usually 100)
 * @param {number} codeHealth - Current code health (-100 to 100)
 * @returns {number} Effective capacity
 */
export function calculateCapacity(baseCapacity, codeHealth) {
  // Health bonus/penalty: +30% at 100, 0% at 50, -30% at 0, -60% at -50
  const healthModifier = (codeHealth - 50) * 0.006;
  return Math.round(baseCapacity * (1 + healthModifier));
}

/**
 * Calculate flow efficiency - percentage of capacity going to new work vs rework
 * @param {number} codeHealth - Current code health (-100 to 100)
 * @returns {number} Flow efficiency (0.0 to 1.0)
 */
export function calculateFlowEfficiency(codeHealth) {
  // Simple linear relationship: 0.01 per point, starting at 0.5 baseline at health 0
  // 100 health = 100% flow, 50 = 75%, 0 = 50%, -50 = 25%
  if (codeHealth >= 100) return 1.0;
  if (codeHealth >= 0) return 0.5 + codeHealth * 0.005;
  return Math.max(0.25, 0.5 + codeHealth * 0.005);
}

/**
 * Calculate impact of delivering a feature on code health
 * Poor code health = features create more technical debt
 * @param {number} currentHealth - Current code health
 * @param {object} feature - Feature being delivered
 * @returns {number} Code health delta (negative number)
 */
export function calculateFeatureImpact(currentHealth, feature) {
  const complexityMultipliers = {
    low: 0.5,
    medium: 1.0,
    high: 2.0
  };

  const baseImpact = -5;
  const complexityFactor = complexityMultipliers[feature.complexity] || 1.0;

  // Poor code health amplifies impact
  const healthFactor = currentHealth < 50 ? (50 - currentHealth) / 15 : 0;

  return Math.round(baseImpact * complexityFactor * (1 + healthFactor));
}
