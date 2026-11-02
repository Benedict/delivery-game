// src/lib/simulation/Debrief.js
//
// What the score doesn't show: how much capacity the team lost as code
// health fell, priced at the player's own return per point of feature work.
// Shown on the end screen as data, not as a verdict.

/**
 * @typedef {object} Debrief
 * @property {{ week: number, points: number }[]} weeklyCapacity - Points available each week
 * @property {{ start: number, end: number }} codeHealth
 * @property {number} pointsLostToDebt - Capacity lost to falling flow efficiency (negative = gained), counting only capacity the player used
 * @property {number|null} valuePerPoint - £K delivered per point of feature work, or null before any feature shipped
 * @property {number|null} valueLostToDebt - pointsLostToDebt priced at valuePerPoint (£K)
 * @property {number|null} whatIfBusinessValue - Final business value had flow stayed at its week-1 level (£K)
 * @property {boolean} whatIfReachesTarget
 */

/**
 * @param {object} state - Game state (finished or not)
 * @returns {Debrief}
 */
export function debrief(state) {
  const weeks = state.history.weeklyMetrics;
  const baselineFlow = weeks[0]?.flowEfficiency ?? state.metrics.flowEfficiency;

  let pointsLost = 0;
  for (const week of weeks) {
    const available = week.capacity * week.flowEfficiency;
    // Lost capacity only matters to the extent the player was using capacity.
    const utilisation = available > 0 ? Math.min(1, (week.allocatedPoints ?? available) / available) : 0;
    pointsLost += week.capacity * (baselineFlow - week.flowEfficiency) * utilisation;
  }
  const pointsLostToDebt = Math.round(pointsLost);

  const features = state.history.decisions.filter(d => d.type === 'feature');
  const featurePoints = features.reduce((sum, d) => sum + (d.feature.pointsNeeded || 0), 0);
  const featureValue = features.reduce((sum, d) => sum + d.outcome.valueDelivered, 0);
  const valuePerPoint = featurePoints > 0 ? featureValue / featurePoints : null;

  const valueLostToDebt = valuePerPoint === null ? null : Math.round(pointsLostToDebt * valuePerPoint);
  const whatIfBusinessValue = valueLostToDebt === null ? null : state.metrics.businessValue + valueLostToDebt;

  return {
    weeklyCapacity: weeks.map(week => ({ week: week.week, points: Math.round(week.capacity * week.flowEfficiency) })),
    codeHealth: { start: weeks[0]?.codeHealth ?? state.metrics.codeHealth, end: state.metrics.codeHealth },
    pointsLostToDebt,
    valuePerPoint,
    valueLostToDebt,
    whatIfBusinessValue,
    whatIfReachesTarget: whatIfBusinessValue !== null && whatIfBusinessValue >= state.victoryConditions.businessValue
  };
}
