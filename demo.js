// Plays full seeded games through the real game loop and compares strategies.
// Run with: npm run demo -- [scenario] [seed]
//   e.g.    npm run demo -- enterprise 42

import { createGame, startFeature, startImprovement, allocateCapacity, advanceWeek } from './src/lib/simulation/Game.js';
import { calculateWeeklyCapacity } from './src/lib/simulation/GameEngine.js';
import { SCENARIOS } from './src/lib/simulation/ScenarioDefinitions.js';
import { seededRng } from './src/lib/simulation/random.js';

const [scenarioId = 'startup', seedArg = '1'] = process.argv.slice(2);
const seed = Number(seedArg);

if (!SCENARIOS[scenarioId]) {
  console.error(`Unknown scenario "${scenarioId}". Choose one of: ${Object.keys(SCENARIOS).join(', ')}`);
  process.exit(1);
}

/** Each strategy decides what to start this week. */
const STRATEGIES = {
  'features only': (state) => {
    if (!state.workInProgress.length && state.opportunities.length) return startFeature(state, state.opportunities[0]);
    return state;
  },
  'fix bugs every 4th week': (state) => {
    if (state.week % 4 === 0 && !state.workInProgress.some(i => i.id === 'fixBugs')) return startImprovement(state, 'fixBugs');
    if (!state.workInProgress.some(i => i.type === 'feature') && state.opportunities.length) return startFeature(state, state.opportunities[0]);
    return state;
  }
};

function splitCapacityEvenly(state) {
  const weekly = calculateWeeklyCapacity(state.metrics.capacity, state.metrics.flowEfficiency);
  const share = Math.floor(weekly / Math.max(1, state.workInProgress.length));
  return Object.fromEntries(state.workInProgress.map(item => [item.id, share]));
}

function play(strategy) {
  let state = createGame(scenarioId, { rng: seededRng(seed) });
  const rng = seededRng(seed + 1);
  const events = [];

  while (!state.gameOver) {
    state = strategy(state);
    state = allocateCapacity(state, splitCapacityEvenly(state));
    const result = advanceWeek(state, { rng });
    state = result.state;
    result.report.events.forEach(e => events.push(`w${e.week} ${e.event.name}`));
  }
  return { state, events };
}

console.log(`Scenario: ${SCENARIOS[scenarioId].name}, seed ${seed}`);
console.log(`Goal: ${SCENARIOS[scenarioId].victoryConditions.description}\n`);

for (const [name, strategy] of Object.entries(STRATEGIES)) {
  const { state, events } = play(strategy);
  const m = state.metrics;
  console.log(`${name}: ${state.victory ? 'WON' : 'lost'} in week ${state.week - 1}`);
  console.log(`  value £${m.businessValue}K, health ${m.codeHealth}, capacity ${m.capacity}, satisfaction ${m.satisfaction}, market ${m.marketPosition}`);
  console.log(`  events: ${events.join(', ') || 'none'}\n`);
}
