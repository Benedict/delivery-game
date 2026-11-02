// src/lib/simulation/GameEngine.test.js
import { describe, it, expect } from 'vitest';
import {
  calculateFlowEfficiency
} from './GameEngine.js';

describe('GameEngine - Metrics', () => {
  it('should calculate flow efficiency from code health', () => {
    expect(calculateFlowEfficiency(100)).toBe(1.0);   // Perfect: 100% to new work
    expect(calculateFlowEfficiency(50)).toBe(0.75);   // Medium: 75% to new work
    expect(calculateFlowEfficiency(0)).toBe(0.5);     // Poor: 50% to new work
    expect(calculateFlowEfficiency(-50)).toBe(0.25);  // Crisis: 25% to new work
  });
});
