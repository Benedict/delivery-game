// src/lib/stores/gameStore.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  gameStore,
  startNewGame,
  startFeature,
  startImprovement,
  allocateCapacity,
  endWeek
} from './gameStore.js';

describe('GameStore', () => {
  beforeEach(() => {
    // Reset store before each test
    startNewGame('startup');
  });

  it('should initialize game with startup scenario', () => {
    const state = get(gameStore);

    expect(state.scenario).toBe('startup');
    expect(state.week).toBe(1);
    expect(state.metrics.capacity).toBe(120);
    expect(state.metrics.codeHealth).toBe(70);
    expect(state.opportunities).toBeDefined();
    expect(state.opportunities.length).toBeGreaterThan(0);
  });

  it('should initialize with different scenarios', () => {
    startNewGame('enterprise');
    const state = get(gameStore);

    expect(state.scenario).toBe('enterprise');
    expect(state.metrics.capacity).toBe(80);
    expect(state.metrics.codeHealth).toBe(-20);
  });

  it('should track game history', () => {
    const state = get(gameStore);

    expect(state.history).toBeDefined();
    expect(state.history.events).toEqual([]);
    expect(state.history.decisions).toEqual([]);
  });

  it('should deliver features and update metrics', () => {
    const initialState = get(gameStore);
    const feature = initialState.opportunities[0];

    // Start the feature (adds to WIP)
    startFeature(feature);

    let state = get(gameStore);
    expect(state.workInProgress.length).toBe(1);
    expect(state.workInProgress[0].type).toBe('feature');

    // Allocate capacity and complete it
    const pointsNeeded = state.workInProgress[0].pointsNeeded;
    allocateCapacity({ [state.workInProgress[0].id]: pointsNeeded });
    endWeek();

    const newState = get(gameStore);
    expect(newState.metrics.businessValue).toBeGreaterThan(0);
    expect(newState.history.decisions.length).toBe(1);
    expect(newState.history.decisions[0].type).toBe('feature');
  });

  it('should invest in improvements', () => {
    const initialHealth = get(gameStore).metrics.codeHealth;

    // Start the improvement (adds to WIP)
    startImprovement('fixBugs');

    let state = get(gameStore);
    expect(state.workInProgress.length).toBe(1);
    expect(state.workInProgress[0].type).toBe('improvement');

    // Allocate capacity and complete it
    const pointsNeeded = state.workInProgress[0].pointsNeeded;
    allocateCapacity({ [state.workInProgress[0].id]: pointsNeeded });
    endWeek();

    const newState = get(gameStore);
    expect(newState.metrics.codeHealth).toBeGreaterThan(initialHealth);
    expect(newState.history.decisions.length).toBe(1);
    expect(newState.history.decisions[0].type).toBe('improvement');
  });

  it('should advance week and generate new opportunities', () => {
    endWeek();

    const state = get(gameStore);
    expect(state.week).toBe(2);
    expect(state.opportunities.length).toBeGreaterThan(0);
  });

  it('should track victory conditions', () => {
    const state = get(gameStore);

    expect(state.victoryConditions).toBeDefined();
    expect(state.victoryConditions.businessValue).toBeDefined();
    expect(state.gameOver).toBe(false);
  });

  it('should detect game over when victory achieved', () => {
    startNewGame('startup');

    // Get current state
    let state = get(gameStore);

    // Start and complete multiple features to build up business value
    for (let i = 0; i < 10; i++) {
      state = get(gameStore);
      if (state.opportunities.length > 0 && state.metrics.businessValue < 500) {
        const feature = state.opportunities[0];
        startFeature(feature);

        state = get(gameStore);
        const pointsNeeded = state.workInProgress[0].pointsNeeded;
        allocateCapacity({ [state.workInProgress[0].id]: pointsNeeded });
        endWeek();
      }
    }

    const finalState = get(gameStore);

    // Check if we achieved victory
    if (finalState.metrics.businessValue >= 500 && finalState.week <= 15) {
      expect(finalState.victory).toBe(true);
      expect(finalState.gameOver).toBe(true);
    }
  });
});

describe('gameStore - activeBonuses lifecycle', () => {
  it('initialises activeBonuses to an empty array on new game', () => {
    startNewGame('startup');
    const state = get(gameStore);
    expect(state.activeBonuses).toEqual([]);
  });

  it('adds an active bonus when an improvement with ongoingBonus completes', () => {
    // codeReviews has weeks: 2, so pointsNeeded = 80. Allocating 100 with no other WIP
    // completes it in a single endWeek (effectivePoints = 100 * 1.0 efficiency = 100 >= 80).
    startNewGame('startup');
    startImprovement('codeReviews');
    allocateCapacity({ codeReviews: 100 });
    endWeek();

    const state = get(gameStore);
    const bonus = state.activeBonuses.find(b => b.type === 'reduceFeatureImpact');
    expect(bonus).toBeDefined();
    expect(bonus.sourceImprovement).toBe('codeReviews');
    expect(bonus.maturity).toBeCloseTo(0.475, 5);
  });

  it('does not add a bonus when an improvement without ongoingBonus completes', () => {
    startNewGame('startup');
    startImprovement('fixBugs'); // 1-week, no ongoingBonus
    allocateCapacity({ fixBugs: 100 });
    endWeek();

    const state = get(gameStore);
    expect(state.activeBonuses).toEqual([]);
  });

  it('ramps bonus maturity each stable week after completion', () => {
    // codeReviews completes in one endWeek with allocation 100 (see Task 6 test).
    // After completion, the bonus is added at 0.3 and then immediately ramped by
    // updateBonusMaturity to 0.475 in the same endWeek.
    startNewGame('startup');
    startImprovement('codeReviews');
    allocateCapacity({ codeReviews: 100 });
    endWeek();

    let state = get(gameStore);
    expect(state.activeBonuses[0].maturity).toBeCloseTo(0.475, 5);

    // Two more stable weeks: ramp to 0.65, then 0.825
    allocateCapacity({});
    endWeek();
    endWeek();

    state = get(gameStore);
    expect(state.activeBonuses[0].maturity).toBeCloseTo(0.825, 5);
  });

  it('decays maturity when WIP allocation count is 4 or more', () => {
    startNewGame('startup');
    // Fast-track an active bonus by manually setting state
    gameStore.update(s => ({
      ...s,
      activeBonuses: [{ type: 'reduceFeatureImpact', sourceImprovement: 'codeReviews', maturity: 0.8, completedWeek: 1 }]
    }));

    // Add 4 dummy items to capacityAllocation so allocatedItemCount === 4
    gameStore.update(s => ({
      ...s,
      capacityAllocation: { a: 25, b: 25, c: 25, d: 25 }
    }));

    endWeek();

    const state = get(gameStore);
    expect(state.activeBonuses[0].maturity).toBeCloseTo(0.60, 5);
  });
});
