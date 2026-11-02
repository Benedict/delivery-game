// src/tests/goldenMaster.test.js
// Characterisation test: plays scripted, seeded games through the public
// store API and snapshots every week's state. A behaviour-preserving
// refactor must leave these snapshots unchanged.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';
import {
  gameStore, startNewGame, startFeature, startImprovement, allocateCapacity, endWeek,
  acceptAcquisition, declineAcquisition
} from '../lib/stores/gameStore.js';
import { calculateWeeklyCapacity } from '../lib/simulation/GameEngine.js';
import { seededRng } from '../lib/simulation/random.js';

// Keep only game-rule state; per-week UI reports are covered by unit tests.
function rulesState({ lastWeek, lastWeekCompleted, lastWeekEfficiency, ...state }) {
  return state;
}

const SCRIPTS = {
  // Every fourth week fix bugs; otherwise keep one feature going.
  steady: state => {
    if (state.week % 4 === 0 && !state.workInProgress.some(i => i.id === 'fixBugs')) return startImprovement('fixBugs');
    if (!state.workInProgress.some(i => i.type === 'feature') && state.opportunities.length) startFeature(state.opportunities[0]);
  },
  // Features only, never invest: drives code health down into crises.
  reckless: state => {
    if (!state.workInProgress.length && state.opportunities.length) startFeature(state.opportunities[0]);
  },
  // Adopt both practices first, then ship features.
  practiced: state => {
    if (state.workInProgress.length) return;
    const done = id => state.history.decisions.some(d => d.improvement?.id === id);
    if (!done('codeReviews')) return startImprovement('codeReviews');
    if (!done('adoptTDD')) return startImprovement('adoptTDD');
    if (state.opportunities.length) startFeature(state.opportunities[0]);
  }
};

function playScriptedGame(scenarioId, seed, script) {
  vi.spyOn(Math, 'random').mockImplementation(seededRng(seed));

  startNewGame(scenarioId);
  const weeks = [rulesState(get(gameStore))];
  let offers = 0;

  while (!get(gameStore).gameOver && weeks.length < 30) {
    if (get(gameStore).pendingDecision) {
      // Decline the first acquisition offer, accept any later one.
      offers++ === 0 ? declineAcquisition() : acceptAcquisition();
      weeks.push(rulesState(get(gameStore)));
      continue;
    }
    SCRIPTS[script](get(gameStore));

    const state = get(gameStore);
    const weekly = calculateWeeklyCapacity(state.metrics.capacity, state.metrics.flowEfficiency);
    const share = Math.floor(weekly / Math.max(1, state.workInProgress.length));
    allocateCapacity(Object.fromEntries(state.workInProgress.map(i => [i.id, share])));
    endWeek();
    weeks.push(rulesState(get(gameStore)));
  }
  return weeks;
}

describe('golden master: scripted seeded games', () => {
  afterEach(() => vi.restoreAllMocks());

  const GAMES = [
    ['startup', 1, 'steady'], ['startup', 4, 'practiced'], ['startup', 8, 'practiced'], ['startup', 2, 'reckless'],
    ['enterprise', 2, 'steady'], ['enterprise', 5, 'reckless'], ['enterprise', 7, 'practiced'],
    ['greenfield', 3, 'steady'], ['greenfield', 6, 'practiced']
  ];

  for (const [scenario, seed, script] of GAMES) {
    it(`${scenario} seed ${seed} ${script}`, () => {
      expect(playScriptedGame(scenario, seed, script)).toMatchSnapshot();
    });
  }
});
