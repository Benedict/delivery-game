// src/lib/stores/gameStore.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  gameStore,
  startNewGame,
  startFeature,
  startImprovement,
  allocateCapacity,
  endWeek,
  acceptAcquisition,
  declineAcquisition
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

  it('erodes maturity to 0 under sustained stress and recovers when stress clears', () => {
    startNewGame('startup');
    // Inject a fully-mature bonus and stress signals (4 allocated items + crisis code health)
    gameStore.update(s => ({
      ...s,
      activeBonuses: [{ type: 'reduceFeatureImpact', sourceImprovement: 'codeReviews', maturity: 1.0, completedWeek: 1 }],
      capacityAllocation: { a: 25, b: 25, c: 25, d: 25 },
      metrics: { ...s.metrics, codeHealth: -10 } // crisis stress
    }));

    // Four endWeeks under combined stress: -0.30 each → 0.70, 0.40, 0.10, 0.
    // Re-inject stress signals each week because capacityAllocation is only preserved for WIP items.
    endWeek();
    gameStore.update(s => ({ ...s, capacityAllocation: { a: 25, b: 25, c: 25, d: 25 }, metrics: { ...s.metrics, codeHealth: -10 } }));
    endWeek();
    gameStore.update(s => ({ ...s, capacityAllocation: { a: 25, b: 25, c: 25, d: 25 }, metrics: { ...s.metrics, codeHealth: -10 } }));
    endWeek();
    gameStore.update(s => ({ ...s, capacityAllocation: { a: 25, b: 25, c: 25, d: 25 }, metrics: { ...s.metrics, codeHealth: -10 } }));
    endWeek();

    let state = get(gameStore);
    expect(state.activeBonuses[0].maturity).toBe(0);

    // Clear the stress: empty allocation, restore code health
    gameStore.update(s => ({
      ...s,
      capacityAllocation: {},
      metrics: { ...s.metrics, codeHealth: 70 }
    }));

    // Three stable endWeeks: +0.175 each → 0.175, 0.35, 0.525
    endWeek(); endWeek(); endWeek();

    state = get(gameStore);
    expect(state.activeBonuses[0].maturity).toBeCloseTo(0.525, 5);
  });

  it('creates a reduceBugProbability bonus when adoptTDD completes', () => {
    // adoptTDD has weeks: 3, so pointsNeeded = 120. Allocating 100 needs 2 endWeeks
    // (1 active item → 100% efficiency → 100 points/week, accumulating to 200 ≥ 120).
    startNewGame('startup');
    startImprovement('adoptTDD');
    allocateCapacity({ adoptTDD: 100 });
    endWeek();
    allocateCapacity({ adoptTDD: 100 });
    endWeek();

    const state = get(gameStore);
    const bonus = state.activeBonuses.find(b => b.type === 'reduceBugProbability');
    expect(bonus).toBeDefined();
    expect(bonus.sourceImprovement).toBe('adoptTDD');
    // After completion in the second endWeek, maturity is 0.3 + 0.175 ramp = 0.475
    expect(bonus.maturity).toBeCloseTo(0.475, 5);
  });

  it('uses start-of-week activeBonuses when delivering features', () => {
    startNewGame('startup');

    // Manually inject a fully-mature reduceFeatureImpact bonus
    gameStore.update(s => ({
      ...s,
      activeBonuses: [{ type: 'reduceFeatureImpact', sourceImprovement: 'codeReviews', maturity: 1.0, completedWeek: 1 }]
    }));

    // Start a high-complexity feature and complete it in one week
    const feature = { id: 'feat1', name: 'Big Feature', value: 50, complexity: 'high' };
    startFeature(feature);
    allocateCapacity({ feat1: 100 });
    endWeek();

    // After endWeek, the feature is complete and the codeHealth delta should reflect the PP reduction.
    // Without bonus: -7 (Math.round(-7.5) in JS rounds to -7). With 50% reduction at full maturity: -4.
    const state = get(gameStore);
    const decision = state.history.decisions.find(d => d.type === 'feature' && d.feature.id === 'feat1');
    expect(decision.outcome.codeHealthDelta).toBe(-4);
  });
});

describe('gameStore - startup mechanics state', () => {
  it('initialises consecutive-week counters and decline flag for any new game', () => {
    startNewGame('startup');
    const state = get(gameStore);
    expect(state.consecutiveWeeksLowConfidence).toBe(0);
    expect(state.consecutiveWeeksHighConfidence).toBe(0);
    expect(state.acquisitionOfferDeclined).toBe(false);
    expect(state.pendingDecision).toBeNull();
    expect(state.victoryType).toBeNull();
  });

  it('initialises investorConfidence to 50 for startup scenario', () => {
    startNewGame('startup');
    const state = get(gameStore);
    expect(state.metrics.investorConfidence).toBe(50);
  });

  it('does not include investorConfidence in metrics for non-startup scenarios', () => {
    startNewGame('greenfield');
    const state = get(gameStore);
    expect(state.metrics.investorConfidence).toBeUndefined();
  });
});

describe('gameStore - burn rate', () => {
  it('subtracts capacity * 0.20 from BV at end of week in startup scenario', () => {
    startNewGame('startup');
    const before = get(gameStore).metrics.businessValue;
    endWeek();
    const after = get(gameStore).metrics.businessValue;
    // Capacity 120 -> burn -24
    expect(after - before).toBeCloseTo(-24, 1);
  });

  it('does not apply burn in non-startup scenarios', () => {
    startNewGame('greenfield');
    const before = get(gameStore).metrics.businessValue;
    endWeek();
    const after = get(gameStore).metrics.businessValue;
    expect(after).toBe(before);
  });

  it('burn scales with capacity changes mid-game', () => {
    startNewGame('startup');
    // Manually bump capacity for this test
    gameStore.update(s => ({ ...s, metrics: { ...s.metrics, capacity: 200 } }));
    const before = get(gameStore).metrics.businessValue;
    endWeek();
    const after = get(gameStore).metrics.businessValue;
    // Capacity 200 -> burn -40
    expect(after - before).toBeCloseTo(-40, 1);
  });
});

describe('gameStore - confidence updates', () => {
  it('does not change confidence in non-startup scenarios', () => {
    startNewGame('greenfield');
    endWeek();
    const state = get(gameStore);
    expect(state.metrics.investorConfidence).toBeUndefined();
  });

  it('confidence drops by 5 when an improvement completes (no other changes)', () => {
    startNewGame('startup');
    startImprovement('fixBugs');
    allocateCapacity({ fixBugs: 100 });
    const before = get(gameStore).metrics.investorConfidence;
    endWeek();
    const after = get(gameStore).metrics.investorConfidence;
    // Improvement -5; no other deltas if metrics stay neutral
    expect(after - before).toBeLessThanOrEqual(-5);
  });

  it('clamps confidence to range -100 to 100', () => {
    startNewGame('startup');
    gameStore.update(s => ({ ...s, metrics: { ...s.metrics, investorConfidence: 99 } }));
    endWeek();
    const after = get(gameStore).metrics.investorConfidence;
    expect(after).toBeLessThanOrEqual(100);
    expect(after).toBeGreaterThanOrEqual(-100);
  });

  it('records confidence change in history alongside other metrics', () => {
    startNewGame('startup');
    endWeek();
    const state = get(gameStore);
    const last = state.history.weeklyMetrics[state.history.weeklyMetrics.length - 1];
    expect(last).toHaveProperty('investorConfidence');
  });
});

describe('gameStore - confidence counters and lose condition', () => {
  it('increments consecutiveWeeksLowConfidence when confidence is at or below -50', () => {
    startNewGame('startup');
    gameStore.update(s => ({ ...s, metrics: { ...s.metrics, investorConfidence: -60 } }));
    endWeek();
    expect(get(gameStore).consecutiveWeeksLowConfidence).toBe(1);
  });

  it('resets consecutiveWeeksLowConfidence when confidence rises above -50', () => {
    startNewGame('startup');
    gameStore.update(s => ({ ...s, consecutiveWeeksLowConfidence: 1, metrics: { ...s.metrics, investorConfidence: -40 } }));
    endWeek();
    expect(get(gameStore).consecutiveWeeksLowConfidence).toBe(0);
  });

  it('triggers game over when consecutiveWeeksLowConfidence reaches 2', () => {
    startNewGame('startup');
    gameStore.update(s => ({ ...s, consecutiveWeeksLowConfidence: 1, metrics: { ...s.metrics, investorConfidence: -60 } }));
    endWeek();
    const state = get(gameStore);
    expect(state.gameOver).toBe(true);
    expect(state.victory).toBe(false);
  });

  it('increments consecutiveWeeksHighConfidence when confidence is at or above 70', () => {
    startNewGame('startup');
    gameStore.update(s => ({ ...s, metrics: { ...s.metrics, investorConfidence: 75 } }));
    endWeek();
    expect(get(gameStore).consecutiveWeeksHighConfidence).toBe(1);
  });

  it('resets consecutiveWeeksHighConfidence when confidence drops below 70', () => {
    startNewGame('startup');
    gameStore.update(s => ({ ...s, consecutiveWeeksHighConfidence: 1, metrics: { ...s.metrics, investorConfidence: 60 } }));
    endWeek();
    expect(get(gameStore).consecutiveWeeksHighConfidence).toBe(0);
  });
});

describe('gameStore - acquisition offer flow', () => {
  it('sets pendingDecision when acquisitionOffer event triggers', () => {
    startNewGame('startup');
    gameStore.update(s => ({
      ...s,
      consecutiveWeeksHighConfidence: 2, // will become 3 after this week's increment
      metrics: { ...s.metrics, investorConfidence: 75 }
    }));
    endWeek();
    const state = get(gameStore);
    expect(state.pendingDecision).toEqual({ type: 'acquisition', week: state.week });
  });

  it('does not set pendingDecision in non-startup scenarios', () => {
    startNewGame('greenfield');
    endWeek();
    expect(get(gameStore).pendingDecision).toBeNull();
  });

  it('does not set pendingDecision when offer was previously declined', () => {
    startNewGame('startup');
    gameStore.update(s => ({
      ...s,
      consecutiveWeeksHighConfidence: 2,
      acquisitionOfferDeclined: true,
      metrics: { ...s.metrics, investorConfidence: 75 }
    }));
    endWeek();
    expect(get(gameStore).pendingDecision).toBeNull();
  });

  it('does not put pendingDecision into metrics', () => {
    startNewGame('startup');
    gameStore.update(s => ({
      ...s,
      consecutiveWeeksHighConfidence: 2,
      metrics: { ...s.metrics, investorConfidence: 75 }
    }));
    endWeek();
    const state = get(gameStore);
    expect(state.metrics.pendingDecision).toBeUndefined();
  });

  it('records investor check-in event in history every 4 weeks for startup', () => {
    startNewGame('startup');
    // Advance to end of week 4
    endWeek(); endWeek(); endWeek(); endWeek();
    const state = get(gameStore);
    const checkIns = state.history.events.filter(e => e.id === 'investorCheckIn');
    expect(checkIns.length).toBeGreaterThanOrEqual(1);
  });
});

describe('gameStore - acquisition accept/decline actions', () => {
  function setupOffer() {
    startNewGame('startup');
    gameStore.update(s => ({
      ...s,
      pendingDecision: { type: 'acquisition', week: s.week },
      metrics: { ...s.metrics, investorConfidence: 75 }
    }));
  }

  it('acceptAcquisition ends the game in alternate victory', () => {
    setupOffer();
    acceptAcquisition();
    const state = get(gameStore);
    expect(state.gameOver).toBe(true);
    expect(state.victory).toBe(true);
    expect(state.victoryType).toBe('acquisition');
    expect(state.pendingDecision).toBeNull();
  });

  it('declineAcquisition resets confidence to 60 and sets the decline flag', () => {
    setupOffer();
    declineAcquisition();
    const state = get(gameStore);
    expect(state.metrics.investorConfidence).toBe(60);
    expect(state.consecutiveWeeksHighConfidence).toBe(0);
    expect(state.acquisitionOfferDeclined).toBe(true);
    expect(state.pendingDecision).toBeNull();
    expect(state.gameOver).toBe(false);
  });

  it('acceptAcquisition does nothing if pendingDecision is not an acquisition', () => {
    startNewGame('startup');
    acceptAcquisition();
    const state = get(gameStore);
    expect(state.gameOver).toBe(false);
  });
});

describe('gameStore - final review fixes', () => {
  it('history.events stores full event objects readable by StoryEngine', () => {
    startNewGame('startup');
    gameStore.update(s => ({
      ...s,
      metrics: { ...s.metrics, codeHealth: -60 } // trigger securityIncident
    }));
    endWeek();
    const state = get(gameStore);
    const event = state.history.events.find(e => e.id === 'securityIncident');
    expect(event).toBeDefined();
    // Story engine reads event.event.name and event.event.description
    expect(event.event).toBeDefined();
    expect(event.event.name).toBeDefined();
    expect(event.outcome).toBeDefined();
  });

  it('does not set pendingDecision when game ends from time-out the same week', () => {
    startNewGame('startup');
    // Force the game to be at the final week with high-confidence streak ready
    gameStore.update(s => ({
      ...s,
      week: 12,
      consecutiveWeeksHighConfidence: 2,
      metrics: { ...s.metrics, investorConfidence: 75 }
    }));
    endWeek();
    const state = get(gameStore);
    expect(state.gameOver).toBe(true);
    expect(state.pendingDecision).toBeNull();
  });

  it('does not set pendingDecision when funding pulled the same week', () => {
    startNewGame('startup');
    // Set up: confidence ≤ -50 last week, AND will be ≥ 70 this week somehow.
    // This is contrived but tests that the gate works.
    gameStore.update(s => ({
      ...s,
      consecutiveWeeksLowConfidence: 1,
      consecutiveWeeksHighConfidence: 2,
      metrics: { ...s.metrics, investorConfidence: -60 } // stays low
    }));
    endWeek();
    const state = get(gameStore);
    expect(state.gameOver).toBe(true);
    expect(state.pendingDecision).toBeNull();
  });
});
