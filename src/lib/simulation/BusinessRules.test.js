// src/lib/simulation/BusinessRules.test.js
import { describe, it, expect } from 'vitest';
import {
  calculateFeatureDelivery,
  calculateBugProbability,
  applyFeatureOutcome,
  calculateImprovementOutcome,
  applyImprovementOutcome,
  applyPractices,
  IMPROVEMENTS
} from './BusinessRules.js';
import { fixedRng } from './random.js';

describe('BusinessRules - Feature Delivery', () => {
  it('should calculate feature delivery success based on capacity and health', () => {
    const feature = { value: 50, complexity: 'medium', deadline: 3 };
    // Mid-range roll: no market variance, and below the bug threshold only when health is poor
    const rng = fixedRng(0.5);

    // Good capacity and health: full value delivered
    const result1 = calculateFeatureDelivery(feature, 100, 80, rng);
    expect(result1.valueDelivered).toBe(50);
    expect(result1.weeksRequired).toBe(1);

    // Low capacity: reduced delivery or more time
    const result2 = calculateFeatureDelivery(feature, 50, 80, rng);
    expect(result2.valueDelivered).toBeLessThan(50);

    // Poor health: bugs likely, value reduced
    const result3 = calculateFeatureDelivery(feature, 100, 10, rng);
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
    const result = calculateImprovementOutcome(improvement);

    expect(result.weeksRequired).toBe(3);
    expect(result.codeHealthDelta).toBe(30);
    expect(result.capacityDelta).toBe(0); // No permanent capacity change
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
    const result = calculateImprovementOutcome(improvement);

    expect(result.capacityDelta).toBe(20); // Permanent +20 capacity
    expect(result.businessValueCost).toBe(50); // Costs business value
  });

  it('discounts hiring, and only hiring, by the hiring cost multiplier', () => {
    expect(calculateImprovementOutcome(IMPROVEMENTS.hireSenior, 0.5).businessValueCost).toBe(25);
    expect(calculateImprovementOutcome({ ...IMPROVEMENTS.fixBugs, businessValueCost: 10 }, 0.5).businessValueCost).toBe(10);
  });

  it('halves feature code health damage with pair programming', () => {
    const outcome = { codeHealthDelta: -9, valueDelivered: 50 };

    expect(applyPractices(outcome, ['reduceFeatureImpact']).codeHealthDelta).toBe(-4);
    expect(applyPractices(outcome, [])).toBe(outcome);
  });
});

describe('BusinessRules - score bounds', () => {
  const metrics = { capacity: 100, codeHealth: -95, satisfaction: 98, marketPosition: 0, businessValue: 0 };

  it('keeps code health at or above -100 after a damaging feature', () => {
    const next = applyFeatureOutcome(metrics, { valueDelivered: 10, hasBugs: false, codeHealthDelta: -20, satisfactionDelta: 5 });

    expect(next.codeHealth).toBe(-100);
    expect(next.satisfaction).toBe(100);
  });

  it('keeps code health at or below 100 after an improvement', () => {
    const next = applyImprovementOutcome({ ...metrics, codeHealth: 95 }, { codeHealthDelta: 30, capacityDelta: 0, satisfactionDelta: 0 });

    expect(next.codeHealth).toBe(100);
  });
});
