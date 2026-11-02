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

describe('Game - end of game', () => {
  // Startup: £500K within 15 weeks
  it('wins when the target is reached during the final week', () => {
    const game = gameWith({ week: 15, metrics: { businessValue: 500 } });

    const { state } = advanceWeek(game, { rng });

    expect(state).toMatchObject({ gameOver: true, victory: true });
  });

  it('loses when the final week ends short of the target', () => {
    const game = gameWith({ week: 15, metrics: { businessValue: 499 } });

    expect(advanceWeek(game, { rng }).state).toMatchObject({ gameOver: true, victory: false });
  });

  it('wins early as soon as the target is reached', () => {
    const game = gameWith({ week: 6, metrics: { businessValue: 500 } });

    expect(advanceWeek(game, { rng }).state).toMatchObject({ gameOver: true, victory: true });
  });

  it('keeps playing before the deadline while short of the target', () => {
    const game = gameWith({ week: 14, metrics: { businessValue: 100 } });

    expect(advanceWeek(game, { rng }).state).toMatchObject({ gameOver: false, victory: false });
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

describe('Game - event and practice effects', () => {
  const finish = (game, id, points = 1000) => advanceWeek(allocateCapacity(game, { [id]: points }), { rng });

  it('adds the enterprise deal as an opportunity when a big client is interested', () => {
    const game = gameWith({ metrics: { marketPosition: 75 } });

    const { state } = advanceWeek(game, { rng });

    expect(state.opportunities).toContainEqual(expect.objectContaining({
      name: 'Enterprise Deal', value: 150, complexity: 'high', deadline: 3, createdWeek: 2
    }));
  });

  it('adds an urgent competitive response when a competitor launches', () => {
    // A low roll triggers the 20% competitor launch (after week 3).
    const game = gameWith({ week: 4 });

    const { state, report } = advanceWeek(game, { rng: fixedRng(0.1) });

    expect(report.events.map(e => e.event.id)).toContain('competitorLaunch');
    expect(state.opportunities).toContainEqual(expect.objectContaining({
      name: 'Competitive Response', value: 60, deadline: 2, createdWeek: 5
    }));
  });

  it('gives unlocked opportunities ids that are unique across weeks', () => {
    let game = gameWith({ metrics: { marketPosition: 75 } });
    game = advanceWeek(game, { rng }).state;
    for (let i = 0; i < 4; i++) game = advanceWeek(game, { rng }).state;

    const deals = game.opportunities.filter(o => o.name === 'Enterprise Deal');
    expect(new Set(deals.map(d => d.id)).size).toBe(deals.length);
  });

  it('halves code health damage from features once pair programming is in place', () => {
    const feature = { id: 'f1', name: 'Search Functionality', value: 70, complexity: 'medium', deadline: 4, createdWeek: 1 };
    const deliverFeature = (game) => {
      const { report } = finish(startFeature(game, feature), 'f1');
      return report.decisions[0].outcome.codeHealthDelta;
    };

    const withoutPairing = deliverFeature(gameWith());
    const paired = finish(startImprovement(gameWith(), 'codeReviews'), 'codeReviews').state;

    expect(paired.practices).toContain('reduceFeatureImpact');
    expect(deliverFeature({ ...paired, metrics: gameWith().metrics })).toBe(Math.round(withoutPairing / 2));
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
