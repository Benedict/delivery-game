// src/lib/simulation/balance/simulate.js
import { createGame, allocateCapacity, advanceWeek, acceptAcquisition } from '../Game.js';
import { calculateWeeklyCapacity } from '../GameEngine.js';
import { seededRng } from '../random.js';

/**
 * Play one complete seeded game with a strategy.
 * @param {string} scenarioId
 * @param {(state: object, rng: () => number) => object} strategy
 * @param {number} seed
 */
export function playGame(scenarioId, strategy, seed) {
  let state = createGame(scenarioId, { rng: seededRng(seed) });
  const worldRng = seededRng(seed + 1000);
  const choiceRng = seededRng(seed + 2000);

  while (!state.gameOver) {
    // Every bot takes an acquisition offer: the game presents it as a win.
    if (state.pendingDecision?.type === 'acquisition') {
      state = acceptAcquisition(state);
      continue;
    }
    state = strategy(state, choiceRng);
    const weekly = calculateWeeklyCapacity(state.metrics.capacity, state.metrics.flowEfficiency);
    const share = Math.floor(weekly / Math.max(1, state.workInProgress.length));
    state = allocateCapacity(state, Object.fromEntries(state.workInProgress.map(item => [item.id, share])));
    state = advanceWeek(state, { rng: worldRng }).state;
  }

  return {
    victory: state.victory,
    endReason: state.endReason,
    weeksPlayed: state.week - 1,
    businessValue: state.metrics.businessValue,
    codeHealth: state.metrics.codeHealth
  };
}

/**
 * Win rate and pacing for a strategy over many seeds.
 * @returns {{ winRate: number, medianWinWeek: number|null, games: number }}
 */
export function evaluate(scenarioId, strategy, { games = 200, firstSeed = 1 } = {}) {
  const results = Array.from({ length: games }, (_, i) => playGame(scenarioId, strategy, firstSeed + i));
  const winWeeks = results.filter(r => r.victory).map(r => r.weeksPlayed).sort((a, b) => a - b);
  const endings = {};
  for (const r of results) endings[r.endReason] = (endings[r.endReason] || 0) + 1;
  return {
    games,
    endings,
    winRate: winWeeks.length / games,
    medianWinWeek: winWeeks.length ? winWeeks[Math.floor(winWeeks.length / 2)] : null
  };
}
