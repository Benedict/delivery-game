// src/lib/simulation/GameEngine.js

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
 * Get complexity points required to complete a feature
 * @param {string} complexity - 'low' | 'medium' | 'high'
 * @returns {number} Points needed to complete
 */
export function getComplexityPoints(complexity) {
  const points = {
    low: 30,
    medium: 60,
    high: 100
  };
  return points[complexity] || 60;
}

/**
 * Calculate context switching penalty
 * @param {number} activeItemCount - Number of items being worked on
 * @returns {number} Efficiency multiplier (0.5 to 1.0)
 */
export function calculateContextSwitchingPenalty(activeItemCount) {
  if (activeItemCount <= 1) return 1.0;
  if (activeItemCount === 2) return 0.85;
  if (activeItemCount === 3) return 0.7;
  return 0.5; // 4+ items = severe penalty
}

/**
 * Calculate weekly capacity points available for work
 * @param {number} capacity - Team capacity
 * @param {number} flowEfficiency - Flow efficiency (0-1)
 * @returns {number} Capacity points for the week
 */
export function calculateWeeklyCapacity(capacity, flowEfficiency) {
  return Math.round(capacity * flowEfficiency);
}
