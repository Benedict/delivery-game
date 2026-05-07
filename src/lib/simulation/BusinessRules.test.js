// src/lib/simulation/BusinessRules.test.js
import { describe, it, expect } from 'vitest';
import {
  calculateFeatureDelivery,
  calculateBugProbability,
  applyFeatureOutcome,
  calculateImprovementOutcome,
  applyImprovementOutcome,
  getBonusStrength,
  updateBonusMaturity,
  IMPROVEMENTS
} from './BusinessRules.js';

describe('BusinessRules - Feature Delivery', () => {
  it('should calculate feature delivery success based on capacity and health', () => {
    const feature = { value: 50, complexity: 'medium', deadline: 3 };

    // Good capacity and health: full value delivered
    const result1 = calculateFeatureDelivery(feature, 100, 80);
    expect(result1.valueDelivered).toBe(50);
    expect(result1.weeksRequired).toBe(1);

    // Low capacity: reduced delivery or more time
    const result2 = calculateFeatureDelivery(feature, 50, 80);
    expect(result2.valueDelivered).toBeLessThan(50);

    // Poor health: bugs likely, value reduced
    const result3 = calculateFeatureDelivery(feature, 100, 10);
    expect(result3.hasBugs).toBe(true);
    expect(result3.valueDelivered).toBeLessThan(50);
  });

  it('should calculate bug probability based on code health', () => {
    expect(calculateBugProbability(100)).toBe(0);     // Perfect code: no bugs
    expect(calculateBugProbability(80)).toBe(0.1);    // Good code: 10% chance
    expect(calculateBugProbability(50)).toBe(0.3);    // Medium: 30% chance
    expect(calculateBugProbability(0)).toBe(0.7);     // Poor: 70% chance
    expect(calculateBugProbability(-50)).toBe(1.0);   // Crisis: guaranteed bugs
  });

  it('should apply feature outcome to metrics', () => {
    const metrics = {
      capacity: 100,
      codeHealth: 60,
      satisfaction: 70,
      marketPosition: 60,
      businessValue: 100
    };

    const outcome = {
      valueDelivered: 50,
      hasBugs: false,
      codeHealthDelta: -8,
      satisfactionDelta: 5
    };

    const newMetrics = applyFeatureOutcome(metrics, outcome);

    expect(newMetrics.businessValue).toBe(150);
    expect(newMetrics.codeHealth).toBe(52);
    expect(newMetrics.satisfaction).toBe(75);
  });

  it('should penalize satisfaction when bugs are delivered', () => {
    const metrics = {
      capacity: 100,
      codeHealth: 60,
      satisfaction: 70,
      marketPosition: 60,
      businessValue: 100
    };

    const buggyOutcome = {
      valueDelivered: 40,
      hasBugs: true,
      codeHealthDelta: -12,
      satisfactionDelta: 0
    };

    const newMetrics = applyFeatureOutcome(metrics, buggyOutcome);

    expect(newMetrics.satisfaction).toBeLessThan(70); // Bugs reduce satisfaction
    expect(newMetrics.businessValue).toBe(140); // Still get value but...
  });
});

describe('BusinessRules - Improvements', () => {
  it('should define improvement options', () => {
    expect(IMPROVEMENTS.fixBugs).toBeDefined();
    expect(IMPROVEMENTS.fixBugs.name).toBe('Fix Critical Bugs');
    expect(IMPROVEMENTS.fixBugs.weeks).toBe(1);
    expect(IMPROVEMENTS.fixBugs.codeHealthDelta).toBe(10);
  });

  it('should calculate improvement outcome', () => {
    const improvement = IMPROVEMENTS.refactorPayment;
    const result = calculateImprovementOutcome(improvement, 100);

    expect(result.weeksRequired).toBe(3);
    expect(result.codeHealthDelta).toBe(30);
    expect(result.capacityDelta).toBe(0); // No permanent capacity change
    expect(result.capacityPenalty).toBe(-15); // But reduced during work
  });

  it('should apply improvement outcome to metrics', () => {
    const metrics = {
      capacity: 100,
      codeHealth: 40,
      satisfaction: 60,
      marketPosition: 50,
      businessValue: 200
    };

    const outcome = {
      weeksRequired: 1,
      codeHealthDelta: 10,
      capacityDelta: 0,
      satisfactionDelta: 5
    };

    const newMetrics = applyImprovementOutcome(metrics, outcome);

    expect(newMetrics.codeHealth).toBe(50);
    expect(newMetrics.satisfaction).toBe(65);
  });

  it('should handle hiring which increases permanent capacity', () => {
    const improvement = IMPROVEMENTS.hireSenior;
    const result = calculateImprovementOutcome(improvement, 100);

    expect(result.capacityDelta).toBe(20); // Permanent +20 capacity
    expect(result.businessValueCost).toBeGreaterThan(0); // Costs business value
  });
});

describe('BusinessRules - getBonusStrength', () => {
  it('returns 0 when no bonus of the given type is active', () => {
    expect(getBonusStrength([], 'reduceBugProbability', { codeHealth: 50 })).toBe(0);
    expect(getBonusStrength(
      [{ type: 'reduceFeatureImpact', maturity: 1.0 }],
      'reduceBugProbability',
      { codeHealth: 50 }
    )).toBe(0);
  });

  it('returns context-appropriate reduction for reduceBugProbability at full maturity', () => {
    const bonus = [{ type: 'reduceBugProbability', maturity: 1.0 }];
    expect(getBonusStrength(bonus, 'reduceBugProbability', { codeHealth: 80 })).toBe(0.20);
    expect(getBonusStrength(bonus, 'reduceBugProbability', { codeHealth: 50 })).toBe(0.20);
    expect(getBonusStrength(bonus, 'reduceBugProbability', { codeHealth: 49 })).toBe(0.50);
    expect(getBonusStrength(bonus, 'reduceBugProbability', { codeHealth: 0 })).toBe(0.50);
    expect(getBonusStrength(bonus, 'reduceBugProbability', { codeHealth: -1 })).toBe(0.70);
    expect(getBonusStrength(bonus, 'reduceBugProbability', { codeHealth: -50 })).toBe(0.70);
  });

  it('returns context-appropriate reduction for reduceFeatureImpact at full maturity', () => {
    const bonus = [{ type: 'reduceFeatureImpact', maturity: 1.0 }];
    expect(getBonusStrength(bonus, 'reduceFeatureImpact', { complexity: 'low' })).toBe(0.10);
    expect(getBonusStrength(bonus, 'reduceFeatureImpact', { complexity: 'medium' })).toBe(0.30);
    expect(getBonusStrength(bonus, 'reduceFeatureImpact', { complexity: 'high' })).toBe(0.50);
  });

  it('scales reduction by maturity', () => {
    const halfBonus = [{ type: 'reduceBugProbability', maturity: 0.5 }];
    expect(getBonusStrength(halfBonus, 'reduceBugProbability', { codeHealth: 0 })).toBe(0.25);

    const partialBonus = [{ type: 'reduceFeatureImpact', maturity: 0.3 }];
    expect(getBonusStrength(partialBonus, 'reduceFeatureImpact', { complexity: 'high' }))
      .toBeCloseTo(0.15, 5);
  });
});

describe('BusinessRules - updateBonusMaturity', () => {
  const stableMetrics = { codeHealth: 50 };
  const crisisMetrics = { codeHealth: -10 };

  it('ramps maturity by 0.175 under stable conditions', () => {
    const bonuses = [{ type: 'reduceBugProbability', sourceImprovement: 'adoptTDD', maturity: 0.3, completedWeek: 5 }];
    const result = updateBonusMaturity(bonuses, stableMetrics, 2);
    expect(result[0].maturity).toBeCloseTo(0.475, 5);
  });

  it('caps maturity at 1.0', () => {
    const bonuses = [{ type: 'reduceBugProbability', maturity: 0.95, completedWeek: 1 }];
    const result = updateBonusMaturity(bonuses, stableMetrics, 2);
    expect(result[0].maturity).toBe(1.0);
  });

  it('decays by 0.20 under WIP stress only', () => {
    const bonuses = [{ type: 'reduceBugProbability', maturity: 0.8, completedWeek: 1 }];
    const result = updateBonusMaturity(bonuses, stableMetrics, 4);
    expect(result[0].maturity).toBeCloseTo(0.60, 5);
  });

  it('decays by 0.20 under crisis code only', () => {
    const bonuses = [{ type: 'reduceBugProbability', maturity: 0.8, completedWeek: 1 }];
    const result = updateBonusMaturity(bonuses, crisisMetrics, 2);
    expect(result[0].maturity).toBeCloseTo(0.60, 5);
  });

  it('decays by 0.30 under both stress signals', () => {
    const bonuses = [{ type: 'reduceBugProbability', maturity: 0.8, completedWeek: 1 }];
    const result = updateBonusMaturity(bonuses, crisisMetrics, 4);
    expect(result[0].maturity).toBeCloseTo(0.50, 5);
  });

  it('floors maturity at 0', () => {
    const bonuses = [{ type: 'reduceBugProbability', maturity: 0.1, completedWeek: 1 }];
    const result = updateBonusMaturity(bonuses, crisisMetrics, 4);
    expect(result[0].maturity).toBe(0);
  });

  it('preserves all other bonus fields', () => {
    const bonuses = [{ type: 'reduceBugProbability', sourceImprovement: 'adoptTDD', maturity: 0.5, completedWeek: 3 }];
    const result = updateBonusMaturity(bonuses, stableMetrics, 2);
    expect(result[0].type).toBe('reduceBugProbability');
    expect(result[0].sourceImprovement).toBe('adoptTDD');
    expect(result[0].completedWeek).toBe(3);
  });

  it('returns a new array without mutating the input', () => {
    const bonuses = [{ type: 'reduceBugProbability', maturity: 0.5, completedWeek: 3 }];
    const result = updateBonusMaturity(bonuses, stableMetrics, 2);
    expect(result).not.toBe(bonuses);
    expect(bonuses[0].maturity).toBe(0.5);
  });

  it('updates multiple bonuses independently', () => {
    const bonuses = [
      { type: 'reduceBugProbability', maturity: 0.5, completedWeek: 3 },
      { type: 'reduceFeatureImpact', maturity: 0.8, completedWeek: 1 }
    ];
    const result = updateBonusMaturity(bonuses, stableMetrics, 2);
    expect(result[0].maturity).toBeCloseTo(0.675, 5);
    expect(result[1].maturity).toBeCloseTo(0.975, 5);
  });
});

describe('BusinessRules - calculateFeatureDelivery with PP bonus', () => {
  it('reduces codeHealthDelta when reduceFeatureImpact is active on a high-complexity feature', () => {
    const feature = { value: 50, complexity: 'high', deadline: 3 };
    const bonus = [{ type: 'reduceFeatureImpact', maturity: 1.0 }];

    // Without bonus: -5 * 1.5 * (1 + 0) = -7.5 -> -7 (JS Math.round rounds toward +Infinity)
    // With 50% reduction at full maturity: -7.5 * 0.5 = -3.75 -> -4 (rounded)
    const withoutBonus = calculateFeatureDelivery(feature, 100, 50);
    expect(withoutBonus.codeHealthDelta).toBe(-7);

    const withBonus = calculateFeatureDelivery(feature, 100, 50, bonus);
    expect(withBonus.codeHealthDelta).toBe(-4);
  });

  it('barely reduces codeHealthDelta on a low-complexity feature', () => {
    const feature = { value: 50, complexity: 'low', deadline: 3 };
    const bonus = [{ type: 'reduceFeatureImpact', maturity: 1.0 }];

    // Without bonus: -5 * 0.5 * (1 + 0) = -2.5 -> -3 (rounded)
    // With 10% reduction: -2.5 * 0.9 = -2.25 -> -2 (rounded)
    const withBonus = calculateFeatureDelivery(feature, 100, 50, bonus);
    expect(withBonus.codeHealthDelta).toBe(-2);
  });

  it('preserves existing behaviour when no bonus is provided', () => {
    const feature = { value: 50, complexity: 'medium', deadline: 3 };
    const result = calculateFeatureDelivery(feature, 100, 50);
    // Without bonus: -5 * 1.0 * (1 + 0) = -5
    expect(result.codeHealthDelta).toBe(-5);
  });
});

describe('BusinessRules - calculateBugProbability with TDD bonus', () => {
  it('returns the same probability when no bonus is active', () => {
    expect(calculateBugProbability(0)).toBe(0.7);
    expect(calculateBugProbability(0, [])).toBe(0.7);
  });

  it('reduces bug probability when reduceBugProbability is at full maturity', () => {
    // codeHealth 0 -> base 0.7, 50% reduction -> 0.35
    const bonus = [{ type: 'reduceBugProbability', maturity: 1.0 }];
    expect(calculateBugProbability(0, bonus)).toBeCloseTo(0.35, 5);
  });

  it('applies the largest reduction in crisis code', () => {
    // codeHealth -20 -> base 0.82, 70% reduction -> 0.246
    const bonus = [{ type: 'reduceBugProbability', maturity: 1.0 }];
    expect(calculateBugProbability(-20, bonus)).toBeCloseTo(0.246, 3);
  });

  it('scales the reduction by maturity', () => {
    // codeHealth 0 -> base 0.7, 50% reduction at half maturity = 25% reduction -> 0.525
    const bonus = [{ type: 'reduceBugProbability', maturity: 0.5 }];
    expect(calculateBugProbability(0, bonus)).toBeCloseTo(0.525, 5);
  });
});
