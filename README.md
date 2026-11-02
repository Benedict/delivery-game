# The Delivery Game

A business simulation that teaches systems thinking about software delivery.

## What it is

You manage a software team for fifteen to twenty weeks, depending on the scenario. Each week you choose what work to start, allocate your team's capacity, and balance shipping features against improving the codebase. The game scores you against the scenario's victory conditions.

Three scenarios — startup, legacy, and greenfield — set distinct starting conditions and victory criteria.

## The point

Most games about technical debt teach a single insight: debt steals capacity. The Delivery Game teaches a different one: flow, code quality, capacity, work-in-progress, customer satisfaction, market position, and opportunity timing all interact, and no single strategy wins across scenarios.

The model is tuned so that:

- Pure feature delivery erodes code health, which cuts flow efficiency, which triggers crisis events.
- Pure improvement starves the business of value and lets opportunities expire.
- Too much concurrent work triggers context-switching penalties.
- Crisis events — security incidents, customer churn, engineering exodus — shift the game state in ways the player must absorb, not avoid.

The complexity is the lesson. Players learn to read a system, not to find an optimal recipe.

## Mechanics in tension

The simulation models seven interacting factors:

- **Code health** drives flow efficiency: 50% at code health 0, rising 0.5 percentage points per point of health to 100% at 100, and falling to a floor of 25% at -50 or below — a 4× capacity gap between perfect and crisis code.
- **Capacity** is base team output, scaled by flow efficiency.
- **Customer satisfaction** moves with feature quality and bug rates. Low satisfaction triggers churn.
- **Market position** moves with consistent delivery and high satisfaction. Strong position unlocks enterprise opportunities.
- **Business value** accumulates in pounds and forms the score.
- **Work-in-progress** penalises efficiency above one active item (1: 100%, 2: 85%, 3: 70%, 4+: 50%).
- **Opportunity deadlines** force urgency. Late features lose their value entirely.

Improvements include fixing critical bugs, pair programming (which halves the code health damage of every later feature), refactoring, and hiring. A security incident forces an emergency fix, sized at two weeks of work, that takes all capacity and blocks all other work until it is done.

Events have cooldowns, so the same event cannot hit every week. Engineering Exodus triggers after three weeks of code health below 10 that is not improving (weeks where low health improves don't count), and costs a quarter of the team. Big Client and Competitor Launch add new opportunities; Talent Attraction halves the cost of the next hire.

## Scenarios

- **The Startup** — Capacity 120, code health 70. Fifteen weeks to deliver £1,150K in business value. High delivery pressure throughout.
- **The Legacy System** — Capacity 110, code health -20. Twenty weeks to deliver £250K and recover code health to 50. Modernisation under load.
- **The Greenfield Project** — Capacity 100, code health 80. Fifteen weeks to deliver £900K while keeping code health above 70. Sustainable growth from day one.

### Balance target: fail a few times, then master

`src/tests/balance.test.js` plays 200 seeded games per scenario with bot strategies and checks that:

- naive play (features only, first offered, random) wins at most 25% of games;
- an adaptive strategy that reads the scenario wins at least 70%, and not before the last quarter of the game;
- no fixed recipe ("pair programming first", "keep health above 60") succeeds in every scenario.

`npm run balance` prints the current table. Bots are a proxy for players, not a substitute for playtesting with people.

## Getting started

```bash
npm install
npm run dev
```

The game has an in-product help modal that explains the rules in detail. This README focuses on what the game is and why.

### Build and preview

```bash
npm run build
npm run preview
```

### Tests

```bash
npm test           # run once
npm run test:watch # watch mode
npm run demo -- enterprise 42   # play seeded games and compare strategies
```

`src/tests/goldenMaster.test.js` snapshots complete seeded games. A refactor should leave those snapshots unchanged; a deliberate rule change updates them (`npx vitest run -u`), and the diff shows what the change did to play.

## How it is built

- **Framework**: SvelteKit, static adapter, deploys to GitHub Pages
- **Styling**: Tailwind CSS v4, neobrutalist palette
- **Tests**: Vitest with @testing-library/svelte
- **Language**: JavaScript with JSDoc

```
src/
├── lib/
│   ├── simulation/              # Core game model, pure JS
│   │   ├── Game.js              # The game loop: createGame, startFeature, advanceWeek…
│   │   ├── GameEngine.js        # Capacity, flow efficiency, complexity
│   │   ├── BusinessRules.js     # Feature delivery and improvements
│   │   ├── EventSystem.js       # Crisis and opportunity events
│   │   ├── OpportunityGenerator.js
│   │   ├── ScenarioDefinitions.js
│   │   ├── StoryEngine.js       # Narrative text generation
│   │   ├── metrics.js           # Score bounds
│   │   └── random.js            # Injectable and seeded randomness
│   ├── stores/
│   │   └── gameStore.js         # Thin Svelte adapter over Game.js
│   └── components/simulation/   # UI components
└── routes/
    └── +page.svelte             # Main game page
```

The simulation layer has no UI dependencies, and every random roll goes through an injectable `rng`. You can drive it from tests or scripts with a seed to validate balance changes reproducibly, without rendering anything.

## Credits

Inspired in part by Tom Grant's *Dice of Debt* (GameChange LLC, 2015), published by the Agile Alliance.

Built with SvelteKit, Tailwind, and Vitest.
