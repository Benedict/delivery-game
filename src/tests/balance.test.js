// src/tests/balance.test.js
//
// Design target: "fail a few times, then master".
// Bots stand in for kinds of play over 200 seeded games per scenario:
// - First attempts (naive bots) should usually lose.
// - A player who has learned the system (adaptive bot) should usually win.
// - No fixed recipe should win everywhere: mastery means reading the scenario.
// - Wins should come late, so pressure lasts the whole game.
// Bots are a proxy, not a substitute, for playtesting with people.
import { describe, it, expect } from 'vitest';
import { SCENARIOS } from '../lib/simulation/ScenarioDefinitions.js';
import { NAIVE, RECIPES, MASTERY } from '../lib/simulation/balance/strategies.js';
import { evaluate } from '../lib/simulation/balance/simulate.js';

const NAIVE_MAX_WIN_RATE = 0.25;
const MASTERY_MIN_WIN_RATE = 0.7;
const RECIPE_MUST_FAIL_SOMEWHERE_BELOW = 0.5;
const MIN_WIN_WEEK_SHARE = 0.75; // of the scenario's time limit

const scenarios = Object.values(SCENARIOS);
const results = {};
const resultFor = (scenarioId, name, strategy) => {
  const key = `${scenarioId}/${name}`;
  results[key] ??= evaluate(scenarioId, strategy);
  return results[key];
};

describe('balance: fail a few times, then master', () => {
  for (const scenario of scenarios) {
    describe(scenario.name, () => {
      for (const [name, strategy] of Object.entries(NAIVE)) {
        it(`naive "${name}" usually loses (win rate <= ${NAIVE_MAX_WIN_RATE * 100}%)`, () => {
          expect(resultFor(scenario.id, name, strategy).winRate).toBeLessThanOrEqual(NAIVE_MAX_WIN_RATE);
        });
      }

      for (const [name, strategy] of Object.entries(MASTERY)) {
        it(`mastery "${name}" usually wins (win rate >= ${MASTERY_MIN_WIN_RATE * 100}%)`, () => {
          expect(resultFor(scenario.id, name, strategy).winRate).toBeGreaterThanOrEqual(MASTERY_MIN_WIN_RATE);
        });

        it(`mastery "${name}" wins late, not early (median win week >= ${MIN_WIN_WEEK_SHARE * 100}% of the limit)`, () => {
          const { medianWinWeek } = resultFor(scenario.id, name, strategy);
          expect(medianWinWeek).toBeGreaterThanOrEqual(Math.ceil(scenario.victoryConditions.weeks * MIN_WIN_WEEK_SHARE));
        });
      }
    });
  }

  for (const [name, strategy] of Object.entries(RECIPES)) {
    it(`fixed recipe "${name}" fails in at least one scenario (win rate < ${RECIPE_MUST_FAIL_SOMEWHERE_BELOW * 100}%)`, () => {
      const worst = Math.min(...scenarios.map(s => resultFor(s.id, name, strategy).winRate));
      expect(worst).toBeLessThan(RECIPE_MUST_FAIL_SOMEWHERE_BELOW);
    });
  }
});
