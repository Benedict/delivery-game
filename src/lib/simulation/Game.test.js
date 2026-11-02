// src/lib/simulation/Game.test.js
import { describe, it, expect } from 'vitest';
import {
  createGame,
  startFeature,
  startImprovement,
  allocateCapacity,
  advanceWeek,
  isBlockedByForcedFix,
  improvementPoints
} from './Game.js';
import { IMPROVEMENTS } from './BusinessRules.js';
import { fixedRng, seededRng } from './random.js';

const rng = fixedRng(0.5);

function gameWith(overrides = {}) {
  const base = createGame('startup', { rng });
  return { ...base, ...overrides, metrics: { ...base.metrics, ...(overrides.metrics || {}) } };
}

describe('Game - starting work', () => {
  it('moves a started feature from opportunities into work in progress', () => {
    const game = gameWith();
    const feature = game.opportunities[0];

    const next = startFeature(game, feature);

    expect(next.opportunities.find(o => o.id === feature.id)).toBeUndefined();
    expect(next.workInProgress).toEqual([
      expect.objectContaining({ id: feature.id, type: 'feature', pointsCompleted: 0, startedWeek: 1 })
    ]);
  });

  it('sizes improvements by their length in weeks', () => {
    const next = startImprovement(gameWith(), 'refactorPayment');

    expect(next.workInProgress[0].pointsNeeded).toBe(improvementPoints(IMPROVEMENTS.refactorPayment));
    expect(improvementPoints(IMPROVEMENTS.refactorPayment)).toBe(120);
  });

  it('refuses new work while a forced fix is in progress', () => {
    const game = gameWith({ workInProgress: [{ id: 'securityFix', forced: true }] });

    expect(isBlockedByForcedFix(game)).toBe(true);
    expect(startFeature(game, game.opportunities[0])).toBe(game);
    expect(startImprovement(game, 'fixBugs')).toBe(game);
  });

  it('ignores every action once the game is over', () => {
    const game = gameWith({ gameOver: true });

    expect(startFeature(game, game.opportunities[0])).toBe(game);
    expect(allocateCapacity(game, { x: 1 })).toBe(game);
    expect(advanceWeek(game, { rng }).state).toBe(game);
  });
});

describe('Game - advancing a week', () => {
  it('reports the items completed this week with their outcomes', () => {
    let game = startImprovement(gameWith(), 'fixBugs');
    game = allocateCapacity(game, { fixBugs: 40 });

    const { state, report } = advanceWeek(game, { rng });

    expect(state.week).toBe(2);
    expect(report.completed.map(i => i.id)).toEqual(['fixBugs']);
    expect(report.decisions[0]).toMatchObject({ type: 'improvement', week: 2 });
    expect(state.metrics.codeHealth).toBe(game.metrics.codeHealth + 10);
    expect(state.workInProgress).toEqual([]);
  });

  it('applies the context-switching penalty to progress', () => {
    let game = startImprovement(gameWith(), 'refactorPayment');
    game = startImprovement(game, 'codeReviews');
    game = allocateCapacity(game, { refactorPayment: 40, codeReviews: 40 });

    const { state, report } = advanceWeek(game, { rng });

    expect(report.efficiency).toBe(0.85);
    expect(state.workInProgress.map(i => i.pointsCompleted)).toEqual([34, 34]);
  });

  it('keeps last week\'s allocation for unfinished work', () => {
    let game = startImprovement(gameWith(), 'refactorPayment');
    game = allocateCapacity(game, { refactorPayment: 50 });

    const { state } = advanceWeek(game, { rng });

    expect(state.capacityAllocation).toEqual({ refactorPayment: 50 });
  });

  it('is deterministic for a given seed', () => {
    const play = () => {
      let game = createGame('greenfield', { rng: seededRng(11) });
      const step = seededRng(12);
      for (let i = 0; i < 5; i++) game = advanceWeek(game, { rng: step }).state;
      return game;
    };

    expect(play()).toEqual(play());
  });
});
