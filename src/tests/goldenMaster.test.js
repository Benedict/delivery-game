// src/tests/goldenMaster.test.js
// Characterisation test: plays scripted, seeded games through the public
// store API and snapshots every week's state. A behaviour-preserving
// refactor must leave these snapshots unchanged.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { gameStore, startNewGame, startFeature, startImprovement, allocateCapacity, endWeek } from '../lib/stores/gameStore.js';
import { calculateWeeklyCapacity } from '../lib/simulation/GameEngine.js';
import { seededRng } from '../lib/simulation/random.js';

// Keep only game-rule state; per-week UI reports are covered by unit tests.
function rulesState({ lastWeek, lastWeekCompleted, lastWeekEfficiency, ...state }) {
  return state;
}

function playScriptedGame(scenarioId, seed, { reckless = false } = {}) {
  const rng = seededRng(seed);
  vi.spyOn(Math, 'random').mockImplementation(rng);

  startNewGame(scenarioId);
  const weeks = [rulesState(get(gameStore))];

  while (!get(gameStore).gameOver && weeks.length < 30) {
    let state = get(gameStore);

    // Every fourth week, invest in fixing bugs; otherwise keep a feature going.
    if (!reckless && state.week % 4 === 0 && !state.workInProgress.some(i => i.id === 'fixBugs')) {
      startImprovement('fixBugs');
    } else if (state.workInProgress.filter(i => i.type === 'feature').length === 0 && state.opportunities.length > 0) {
      startFeature(state.opportunities[0]);
    }

    state = get(gameStore);
    const weekly = calculateWeeklyCapacity(state.metrics.capacity, state.metrics.flowEfficiency);
    const share = Math.floor(weekly / Math.max(1, state.workInProgress.length));
    const allocation = Object.fromEntries(state.workInProgress.map(i => [i.id, share]));
    allocateCapacity(allocation);
    endWeek();
    weeks.push(rulesState(get(gameStore)));
  }
  return weeks;
}

describe('golden master: scripted seeded games', () => {
  afterEach(() => vi.restoreAllMocks());

  for (const [scenario, seed] of [['startup', 1], ['enterprise', 2], ['greenfield', 3], ['enterprise', 99]]) {
    it(`${scenario} seed ${seed}`, () => {
      expect(playScriptedGame(scenario, seed)).toMatchSnapshot();
    });
  }

  for (const seed of [5, 7]) {
    it(`reckless feature-only enterprise seed ${seed}`, () => {
      expect(playScriptedGame('enterprise', seed, { reckless: true })).toMatchSnapshot();
    });
  }
});
