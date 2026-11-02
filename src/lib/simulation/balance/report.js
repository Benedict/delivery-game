// Prints a balance table. Run with: npm run balance
import { SCENARIOS } from '../ScenarioDefinitions.js';
import { ALL_STRATEGIES } from './strategies.js';
import { evaluate } from './simulate.js';

for (const scenario of Object.values(SCENARIOS)) {
  console.log(`\n${scenario.name} (${scenario.victoryConditions.description})`);
  for (const [name, strategy] of Object.entries(ALL_STRATEGIES)) {
    const { winRate, medianWinWeek, endings, games } = evaluate(scenario.id, strategy);
    const how = Object.entries(endings).map(([reason, n]) => `${reason} ${Math.round(100 * n / games)}%`).join(', ');
    console.log(`  ${name.padEnd(14)} win ${String(Math.round(winRate * 100)).padStart(3)}%   median winning week ${String(medianWinWeek ?? '-').padStart(2)}   (${how})`);
  }
}
