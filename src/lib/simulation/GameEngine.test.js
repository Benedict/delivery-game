// src/lib/simulation/GameEngine.test.js
import { describe, it, expect } from 'vitest';
import {
  calculateCapacity,
  calculateFlowEfficiency,
  createInitialMetrics
} from './GameEngine.js';

describe('GameEngine - Metrics', () => {
  it('should create initial metrics with correct defaults', () => {
    const metrics = createInitialMetrics('startup');

    expect(metrics).toEqual({
      capacity: 120,
      codeHealth: 70,
      satisfaction: 50,
      marketPosition: 50,
      businessValue: 0,
      flowEfficiency: 0.85
    });
  });

  it('should calculate capacity based on code health', () => {
    // Base capacity 100, code health affects it
    expect(calculateCapacity(100, 100)).toBe(130); // Excellent health: +30%
    expect(calculateCapacity(100, 50)).toBe(100);  // Medium health: no change
    expect(calculateCapacity(100, 0)).toBe(70);    // Poor health: -30%
    expect(calculateCapacity(100, -50)).toBe(40);  // Crisis: -60%
  });

  it('should calculate flow efficiency from code health', () => {
    expect(calculateFlowEfficiency(100)).toBe(1.0);   // Perfect: 100% to new work
    expect(calculateFlowEfficiency(50)).toBe(0.75);   // Medium: 75% to new work
    expect(calculateFlowEfficiency(0)).toBe(0.5);     // Poor: 50% to new work
    expect(calculateFlowEfficiency(-50)).toBe(0.25);  // Crisis: 25% to new work
  });
});
