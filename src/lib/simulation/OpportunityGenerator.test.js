// src/lib/simulation/OpportunityGenerator.test.js
import { describe, it, expect } from 'vitest';
import {
  generateOpportunities,
  checkDeadlines,
  unlockStrategicOpportunity
} from './OpportunityGenerator.js';

describe('OpportunityGenerator', () => {
  it('should generate opportunities based on scenario', () => {
    const opportunities = generateOpportunities('startup', 1, { marketPosition: 50 });

    expect(opportunities.length).toBeGreaterThanOrEqual(3);
    expect(opportunities.length).toBeLessThanOrEqual(5);

    opportunities.forEach(opp => {
      expect(opp).toHaveProperty('id');
      expect(opp).toHaveProperty('name');
      expect(opp).toHaveProperty('value');
      expect(opp).toHaveProperty('complexity');
      expect(opp).toHaveProperty('deadline');
    });
  });

  it('should generate fewer opportunities for enterprise scenario', () => {
    const opps = generateOpportunities('enterprise', 1, { marketPosition: 40 });

    expect(opps.length).toBeGreaterThanOrEqual(1);
    expect(opps.length).toBeLessThanOrEqual(3);
  });

  it('should increase opportunities as market position grows', () => {
    // Run multiple times to account for randomness
    let totalLow = 0;
    let totalHigh = 0;
    const iterations = 10;

    for (let i = 0; i < iterations; i++) {
      const lowMarket = generateOpportunities('startup', 3, { marketPosition: 30 });
      const highMarket = generateOpportunities('startup', 3, { marketPosition: 80 });
      totalLow += lowMarket.length;
      totalHigh += highMarket.length;
    }

    // On average, high market should generate more opportunities
    expect(totalHigh).toBeGreaterThan(totalLow);
  });

  it('should check deadlines and mark expired opportunities', () => {
    const opportunities = [
      { id: '1', name: 'Feature A', deadline: 2, createdWeek: 1 },
      { id: '2', name: 'Feature B', deadline: 3, createdWeek: 1 },
      { id: '3', name: 'Feature C', deadline: 5, createdWeek: 2 }
    ];

    const result = checkDeadlines(opportunities, 4);

    expect(result.expired).toHaveLength(1);
    expect(result.expired[0].id).toBe('1');
    expect(result.active).toHaveLength(2);
  });

  it('should unlock strategic opportunities with high agility', () => {
    const metrics = {
      capacity: 110,
      codeHealth: 70,
      marketPosition: 75
    };

    const strategic = unlockStrategicOpportunity(metrics, 5);

    expect(strategic).toBeDefined();
    expect(strategic.type).toBe('strategic');
    expect(strategic.value).toBeGreaterThan(100);
  });

  it('should not unlock strategic opportunities with low agility', () => {
    const metrics = {
      capacity: 60,
      codeHealth: 20,
      marketPosition: 40
    };

    const strategic = unlockStrategicOpportunity(metrics, 5);

    expect(strategic).toBeNull();
  });
});
