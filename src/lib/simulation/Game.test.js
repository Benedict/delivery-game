// src/lib/simulation/Game.test.js
import { describe, it, expect } from 'vitest';
import {
  createGame,
  startFeature,
  startImprovement,
  allocateCapacity,
  advanceWeek,
  isBlockedByForcedFix,
  improvementPoints,
  acceptAcquisition
} from './Game.js';
import { IMPROVEMENTS } from './BusinessRules.js';
import { SCENARIOS } from './ScenarioDefinitions.js';
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

describe('Game - why the game ended', () => {
  it('records an acquisition when the player accepts an offer', () => {
    const offered = gameWith({ pendingDecision: { type: 'acquisition', week: 6 } });

    expect(acceptAcquisition(offered)).toMatchObject({ gameOver: true, victory: true, endReason: 'acquired' });
  });

  it('records funding pulled after two weeks of very low investor confidence', () => {
    const doomed = gameWith({ consecutiveWeeksLowConfidence: 1, metrics: { investorConfidence: -80 } });

    expect(advanceWeek(doomed, { rng }).state).toMatchObject({ gameOver: true, victory: false, endReason: 'fundingPulled' });
  });

  it('records reaching the target', () => {
    const rich = gameWith({ week: 3, metrics: { businessValue: 10000 } });

    expect(advanceWeek(rich, { rng }).state).toMatchObject({ gameOver: true, victory: true, endReason: 'targetReached' });
  });

  it('records running out of time', () => {
    const late = gameWith({ week: 20, metrics: { businessValue: 0 } });

    expect(advanceWeek(late, { rng }).state).toMatchObject({ gameOver: true, victory: false, endReason: 'timeUp' });
  });

  it('has no end reason while the game is running', () => {
    expect(gameWith().endReason).toBeNull();
    expect(advanceWeek(gameWith(), { rng }).state.endReason).toBeNull();
  });
});

describe('Game - final week', () => {
  // Greenfield has no burn, so business value at the end of the week is what we set.
  const { businessValue: target, weeks } = SCENARIOS.greenfield.victoryConditions;
  const greenfieldAt = (week, businessValue) => {
    const base = createGame('greenfield', { rng });
    return { ...base, week, metrics: { ...base.metrics, businessValue } };
  };

  it('wins when the target is reached during the final week', () => {
    expect(advanceWeek(greenfieldAt(weeks, target), { rng }).state).toMatchObject({ gameOver: true, victory: true });
  });

  it('loses when the final week ends short of the target', () => {
    expect(advanceWeek(greenfieldAt(weeks, target - 1), { rng }).state).toMatchObject({ gameOver: true, victory: false });
  });

  it('keeps playing before the final week while short of the target', () => {
    expect(advanceWeek(greenfieldAt(weeks - 1, 0), { rng }).state).toMatchObject({ gameOver: false });
  });
});

describe('Game - low code health streak', () => {
  const eventIds = report => report.events.map(e => e.event.id);

  it('triggers Engineering Exodus after three consecutive weeks of code health below 10', () => {
    let game = gameWith({ metrics: { codeHealth: 0 } });
    const reports = [];
    for (let i = 0; i < 3; i++) {
      const result = advanceWeek(game, { rng });
      game = result.state;
      reports.push(result.report);
    }

    expect(eventIds(reports[0])).not.toContain('engineeringExodus');
    expect(eventIds(reports[1])).not.toContain('engineeringExodus');
    expect(eventIds(reports[2])).toContain('engineeringExodus');
    expect(game.history.weeksLowHealth).toBe(3);
  });

  it('resets the streak when code health recovers', () => {
    let game = advanceWeek(gameWith({ metrics: { codeHealth: 0 } }), { rng }).state;
    game = { ...game, metrics: { ...game.metrics, codeHealth: 40 } };

    expect(advanceWeek(game, { rng }).state.history.weeksLowHealth).toBe(0);
  });
});

describe('Game - security incident', () => {
  it('adds a single forced fix even if the incident condition persists', () => {
    let game = gameWith({ metrics: { codeHealth: -80 } });
    game = advanceWeek(game, { rng }).state;
    game = advanceWeek(game, { rng }).state;

    expect(game.workInProgress.filter(item => item.forced)).toHaveLength(1);
    expect(game.history.events.filter(e => e.event.id === 'securityIncident')).toHaveLength(1);
  });
});

describe('Game - event effects', () => {
  const finish = (game, id, points = 1000) => advanceWeek(allocateCapacity(game, { [id]: points }), { rng });

  it('adds the enterprise deal as an opportunity when a big client is interested', () => {
    const { state } = advanceWeek(gameWith({ metrics: { marketPosition: 75 } }), { rng });

    expect(state.opportunities).toContainEqual(expect.objectContaining({
      name: 'Enterprise Deal', value: 150, complexity: 'high', deadline: 3, createdWeek: 2
    }));
  });

  it('adds an urgent competitive response when a competitor launches', () => {
    // A low roll triggers the 20% competitor launch (after week 3).
    const { state, report } = advanceWeek(gameWith({ week: 4 }), { rng: fixedRng(0.1) });

    expect(report.events.map(e => e.event.id)).toContain('competitorLaunch');
    expect(state.opportunities).toContainEqual(expect.objectContaining({
      name: 'Competitive Response', value: 60, deadline: 2, createdWeek: 5
    }));
  });

  it('gives unlocked opportunities ids that are unique across weeks', () => {
    let game = gameWith({ metrics: { marketPosition: 75 } });
    for (let i = 0; i < 6; i++) game = advanceWeek(game, { rng }).state;

    const deals = game.opportunities.filter(o => o.name === 'Enterprise Deal');
    expect(new Set(deals.map(d => d.id)).size).toBe(deals.length);
  });

  it('halves the next hiring cost after talent attraction', () => {
    // Satisfaction above 60 attracts talent at the end of the week.
    const attracted = advanceWeek(gameWith({ metrics: { satisfaction: 70, businessValue: 100 } }), { rng }).state;
    expect(attracted.hiringCostMultiplier).toBe(0.5);

    const hired = finish(startImprovement(attracted, 'hireSenior'), 'hireSenior');

    expect(hired.report.decisions[0].outcome.businessValueCost).toBe(25);
    expect(hired.state.hiringCostMultiplier).toBe(1);
  });

  it('charges the full hiring cost without talent attraction', () => {
    const { report } = finish(startImprovement(gameWith(), 'hireSenior'), 'hireSenior');

    expect(report.decisions[0].outcome.businessValueCost).toBe(50);
  });
});

describe('Game - invariants over seeded games', () => {
  const unique = ids => new Set(ids).size === ids.length;

  it('keeps opportunity and work ids unique, and scores within bounds, every week', () => {
    for (const scenario of ['startup', 'enterprise', 'greenfield']) {
      for (let seed = 1; seed <= 20; seed++) {
        const step = seededRng(seed * 31);
        let game = createGame(scenario, { rng: seededRng(seed) });
        while (!game.gameOver) {
          if (game.opportunities.length && game.workInProgress.length < 2) game = startFeature(game, game.opportunities[0]);
          game = allocateCapacity(game, Object.fromEntries(game.workInProgress.map(i => [i.id, 50])));
          game = advanceWeek(game, { rng: step }).state;

          expect(unique(game.opportunities.map(o => o.id))).toBe(true);
          expect(unique(game.workInProgress.map(i => i.id))).toBe(true);
          for (const key of ['codeHealth', 'satisfaction', 'marketPosition']) {
            expect(Math.abs(game.metrics[key])).toBeLessThanOrEqual(100);
          }
        }
      }
    }
  });
});
