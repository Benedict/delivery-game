// src/lib/simulation/Debrief.test.js
import { describe, it, expect } from 'vitest';
import { debrief } from './Debrief.js';

// A week record as kept in history.weeklyMetrics
const week = (n, flowEfficiency, allocatedPoints, extra = {}) => ({
  week: n, capacity: 100, flowEfficiency, codeHealth: 0, businessValue: 0, allocatedPoints, ...extra
});
const feature = (value, pointsNeeded) => ({ type: 'feature', feature: { pointsNeeded }, outcome: { valueDelivered: value } });

function game({ weeks, decisions = [], businessValue = 500, target = 600, codeHealth = 20 }) {
  return {
    metrics: { businessValue, codeHealth, capacity: 100, flowEfficiency: weeks.at(-1).flowEfficiency },
    victoryConditions: { businessValue: target },
    history: { weeklyMetrics: weeks, decisions, events: [] }
  };
}

describe('debrief', () => {
  it('counts the capacity lost as flow efficiency fell below week 1', () => {
    const result = debrief(game({
      weeks: [week(1, 0.8, 80), week(2, 0.7, 70), week(3, 0.6, 60)],
      decisions: [feature(100, 50)]
    }));

    // Week 2 lost 10 points, week 3 lost 20.
    expect(result.pointsLostToDebt).toBe(30);
    expect(result.valuePerPoint).toBe(2);
    expect(result.valueLostToDebt).toBe(60);
    expect(result.whatIfBusinessValue).toBe(560);
  });

  it('only counts lost capacity the player would have used', () => {
    // Half the available capacity went unallocated in week 2, so only half the loss bit.
    const result = debrief(game({
      weeks: [week(1, 0.8, 80), week(2, 0.6, 30)],
      decisions: [feature(100, 50)]
    }));

    expect(result.pointsLostToDebt).toBe(10);
  });

  it('says whether the what-if would have reached the target', () => {
    const close = debrief(game({ weeks: [week(1, 0.8, 80), week(2, 0.4, 40)], decisions: [feature(100, 50)], businessValue: 550, target: 600 }));
    expect(close.whatIfReachesTarget).toBe(true);

    const far = debrief(game({ weeks: [week(1, 0.8, 80), week(2, 0.75, 75)], decisions: [feature(100, 50)], businessValue: 300, target: 600 }));
    expect(far.whatIfReachesTarget).toBe(false);
  });

  it('reports capacity gained when code got healthier', () => {
    const result = debrief(game({ weeks: [week(1, 0.6, 60), week(2, 0.8, 80)], decisions: [feature(100, 50)] }));

    expect(result.pointsLostToDebt).toBe(-20);
  });

  it('cannot price lost capacity before any feature has shipped', () => {
    const result = debrief(game({ weeks: [week(1, 0.8, 80), week(2, 0.6, 60)] }));

    expect(result.pointsLostToDebt).toBe(20);
    expect(result.valuePerPoint).toBeNull();
    expect(result.valueLostToDebt).toBeNull();
    expect(result.whatIfBusinessValue).toBeNull();
  });

  it('describes the weekly capacity trend and the code health journey', () => {
    const result = debrief(game({
      weeks: [week(1, 0.8, 80, { codeHealth: 70 }), week(2, 0.6, 60, { codeHealth: 30 })],
      codeHealth: 1
    }));

    expect(result.weeklyCapacity).toEqual([{ week: 1, points: 80 }, { week: 2, points: 60 }]);
    expect(result.codeHealth).toEqual({ start: 70, end: 1 });
  });
});

describe('debrief: where the money went', () => {
  const shipped = (week, value, hasBugs = false) => ({ type: 'feature', week: week + 1, feature: { pointsNeeded: 50 }, outcome: { valueDelivered: value, hasBugs } });
  const entry = (week, kind, label, amount) => ({ week, kind, label, amount });

  function played({ ledger, decisions, start = {}, end = {} }) {
    const weeks = [1, 2, 3, 4].map(n => week(n, 0.8, 80, { satisfaction: 50, investorConfidence: 50, ...(n === 1 ? start : {}) }));
    return {
      metrics: { businessValue: ledger.reduce((sum, e) => sum + e.amount, 0), codeHealth: 20, capacity: 100, flowEfficiency: 0.8, satisfaction: -35, investorConfidence: -20, ...end },
      victoryConditions: { businessValue: 650 },
      history: { weeklyMetrics: weeks, decisions, events: [], ledger }
    };
  }

  const game = played({
    ledger: [
      entry(1, 'feature', 'Mobile App', 144), entry(1, 'burn', 'Team running costs', -36),
      entry(2, 'burn', 'Team running costs', -36),
      entry(3, 'feature', 'Webhooks', 72), entry(3, 'event', 'Customer Churn', -50), entry(3, 'burn', 'Team running costs', -36),
      entry(4, 'event', 'Customer Churn', -50), entry(4, 'burn', 'Team running costs', -36)
    ],
    decisions: [shipped(1, 144, true), shipped(3, 72, true)]
  });

  it('adds up what was earned and what was spent, matching the score', () => {
    const { money } = debrief(game);

    expect(money.earned).toEqual({ amount: 216, features: 2 });
    expect(money.runningCosts).toBe(-144);
    expect(money.crises).toEqual([{ label: 'Customer Churn', count: 2, amount: -100 }]);
    expect(money.earned.amount + money.runningCosts + money.crises[0].amount + money.otherCosts).toBe(game.metrics.businessValue);
  });

  it('counts the weeks that shipped nothing while the team still cost money', () => {
    expect(debrief(game).quietWeeks).toEqual({ weeks: 2, runningCosts: -72 });
  });

  it('follows bugs through to customers and investors', () => {
    const { bugs, satisfaction, investorConfidence } = debrief(game);

    expect(bugs).toEqual({ buggy: 2, shipped: 2 });
    expect(satisfaction).toEqual({ start: 50, end: -35 });
    expect(investorConfidence).toEqual({ start: 50, end: -20 });
  });

  it('leaves out investor confidence in scenarios without investors', () => {
    const noInvestors = { ...game, metrics: { ...game.metrics, investorConfidence: undefined } };
    expect(debrief(noInvestors).investorConfidence).toBeNull();
  });
});
