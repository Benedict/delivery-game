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
 * @property {{ earned: { amount: number, features: number }, runningCosts: number, crises: { label: string, count: number, amount: number }[], otherCosts: number }} money - Where business value came from and went (adds up to the score)
 * @property {{ weeks: number, runningCosts: number }} quietWeeks - Weeks that shipped nothing, and what the team cost in them
 * @property {{ buggy: number, shipped: number }} bugs
 * @property {{ start: number, end: number }} satisfaction
 * @property {{ start: number, end: number }|null} investorConfidence - null in scenarios without investors
 */

const sumOf = entries => entries.reduce((sum, entry) => sum + entry.amount, 0);

function moneyFlow(ledger) {
  const features = ledger.filter(e => e.kind === 'feature');
  const crises = new Map();
  for (const e of ledger.filter(e => e.kind === 'event')) {
    const crisis = crises.get(e.label) ?? { label: e.label, count: 0, amount: 0 };
    crisis.count += 1;
    crisis.amount += e.amount;
    crises.set(e.label, crisis);
  }
  return {
    earned: { amount: sumOf(features), features: features.length },
    runningCosts: sumOf(ledger.filter(e => e.kind === 'burn')),
    crises: [...crises.values()],
    otherCosts: sumOf(ledger.filter(e => e.kind === 'hiring' || e.kind === 'improvement'))
  };
}

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

  const ledger = state.history.ledger ?? [];
  const weeksWithDelivery = new Set(ledger.filter(e => e.kind === 'feature').map(e => e.week));
  const quiet = weeks.filter(week => !weeksWithDelivery.has(week.week)).map(week => week.week);

  return {
    money: moneyFlow(ledger),
    quietWeeks: { weeks: quiet.length, runningCosts: sumOf(ledger.filter(e => e.kind === 'burn' && quiet.includes(e.week))) },
    bugs: { buggy: features.filter(d => d.outcome.hasBugs).length, shipped: features.length },
    satisfaction: { start: weeks[0]?.satisfaction ?? state.metrics.satisfaction, end: state.metrics.satisfaction },
    investorConfidence: state.metrics.investorConfidence === undefined
      ? null
      : { start: weeks[0]?.investorConfidence ?? state.metrics.investorConfidence, end: state.metrics.investorConfidence },
    weeklyCapacity: weeks.map(week => ({ week: week.week, points: Math.round(week.capacity * week.flowEfficiency) })),
    codeHealth: { start: weeks[0]?.codeHealth ?? state.metrics.codeHealth, end: state.metrics.codeHealth },
    pointsLostToDebt,
    valuePerPoint,
    valueLostToDebt,
    whatIfBusinessValue,
    whatIfReachesTarget: whatIfBusinessValue !== null && whatIfBusinessValue >= state.victoryConditions.businessValue
  };
}
