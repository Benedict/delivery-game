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
import { SCENARIOS } from '../simulation/ScenarioDefinitions.js';

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
    expect(state.metrics.capacity).toBe(SCENARIOS.enterprise.initialMetrics.capacity);
    expect(state.metrics.codeHealth).toBe(SCENARIOS.enterprise.initialMetrics.codeHealth);
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

  it('should end the game at the time limit and ignore further weeks', () => {
    startNewGame('startup');
    const { weeks } = get(gameStore).victoryConditions;

    for (let i = 0; i < weeks; i++) endWeek();
    const finished = get(gameStore);
    endWeek();

    expect(finished.gameOver).toBe(true);
    expect(get(gameStore)).toBe(finished);
  });
});
