# The Delivery Game

A business simulation that teaches systems thinking about software delivery.

## What it is

You manage a software team for twelve to twenty weeks, depending on the scenario. Each week you choose what work to start, allocate your team's capacity, and balance shipping features against improving the codebase. The game scores you against the scenario's victory conditions.

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

- **Code health** drives flow efficiency: 50% at code health 0, rising half a percentage point per point of health to 100% at 100, and falling to a floor of 25% at -50 or below — a 4× capacity gap between perfect and crisis code.
- **Capacity** is base team output, scaled by flow efficiency. Work completes in whole weeks, and capacity left unallocated does nothing.
- **Customer satisfaction** moves with feature quality and bug rates. Low satisfaction triggers churn. Poor code makes bugs more likely.
- **Market position** moves with consistent delivery and high satisfaction: +3 for each bug-free feature, -2 for each buggy one, -1 in a week when nothing ships, +2 a week while satisfaction is above 70 and -2 while it is below 30. Above 70 it attracts a big client and more opportunities.
- **Business value** accumulates in pounds and forms the score. A delivered feature is worth the value on its card, ±20% for the market; team size and code health change how fast and how cleanly you deliver, not what a feature is worth. Poor code also makes each new feature do more damage: debt compounds.
- **Work-in-progress** penalises efficiency above one active item (1: 100%, 2: 85%, 3: 70%, 4+: 50%).
- **Opportunity deadlines** force urgency. Late features lose their value entirely.

Improvements include fixing critical bugs, pair programming, refactoring, hiring, and adopting TDD. A security incident forces an emergency fix, sized at two weeks of work, that takes all capacity and blocks all other work until it is done.

Events have cooldowns, so the same event cannot hit every week. Engineering Exodus triggers after three weeks of code health below 10 that is not improving (weeks where low health improves don't count), and costs a quarter of the team. Big Client and Competitor Launch add new opportunities; Talent Attraction halves the cost of the next hire.

## The debrief

The score rewards pounds, and the system quietly erodes the capacity that produces them. The end screen shows what that cost, as data rather than a verdict: weekly capacity from first week to last, code health at the start and end, the capacity lost as flow efficiency fell below its week-1 level (counting only capacity you were using), priced at your own average return per point, and what you would have finished on at week-1 efficiency.

## Ongoing practices

Two improvements — **Pair Programming** and **Adopt TDD** — produce ongoing effects after they complete, not just one-shot deltas. The strength of those effects depends on game state and erodes under stress.

- **Pair Programming** reduces the code-health cost of features. The reduction scales with feature complexity — small effect on simple features, larger on complex ones.
- **Adopt TDD** reduces bug probability on shipped features. The reduction scales with code health — small effect on healthy code, larger on crisis code.

Both practices ramp from 30% to 100% maturity over four stable weeks. Both decay under stress: high WIP allocation or crisis-level code health drains maturity by 20% per week (30% if both signals are active). Once stress clears, maturity recovers at the same rate.

The lesson: practices have contextual fit, and the team must hold them to keep their benefit. The active bonuses and their current strength surface in the game header so players can read what their investment is doing for them right now.

## Scenarios

- **The Startup** — Capacity 120, code health 70. Twelve weeks to deliver £650K in business value while the team burns £0.3K per capacity point every week. Investor confidence rises with clean deliveries and falls with bugs, crises and improvement work; two weeks at -50 or below and investors pull funding. Three weeks at 70+ with customer satisfaction above 80 brings an acquisition offer — accept it to win outright.
- **The Legacy System** — Capacity 110, code health -20. Twenty weeks to deliver £300K and recover code health to 50. Modernisation under load.
- **The Greenfield Project** — Capacity 100, code health 80. Fifteen weeks to deliver £750K while keeping code health above 70. Sustainable growth from day one.

### Balance target: fail a few times, then master

`src/tests/balance.test.js` plays 200 seeded games per scenario with bot strategies and checks that:

- naive play (features only, first offered, random) wins at most 25% of games;
- an adaptive strategy that reads the scenario wins at least 70%, and not before the last quarter of the game;
- no fixed recipe ("pair programming first", "both practices first", "keep health above 60") succeeds in every scenario.

`npm run balance` prints the current table, including how games end. Bots are a proxy for players, not a substitute for playtesting with people: they allocate capacity for themselves, so `src/routes/journeys.test.js` also plays through the real page the way first-time players do.

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
```

## How it is built

- **Framework**: SvelteKit, static adapter, deploys to GitHub Pages
- **Styling**: Tailwind CSS v4, neobrutalist palette
- **Tests**: Vitest with @testing-library/svelte
- **Language**: JavaScript with JSDoc

```
src/
├── lib/
│   ├── simulation/              # Core game model, pure JS
│   │   ├── GameEngine.js        # Capacity, flow efficiency, complexity
│   │   ├── BusinessRules.js     # Feature delivery and improvements
│   │   ├── EventSystem.js       # Crisis and opportunity events
│   │   ├── OpportunityGenerator.js
│   │   ├── ScenarioDefinitions.js
│   │   └── StoryEngine.js       # Narrative text generation
│   ├── stores/
│   │   └── gameStore.js         # Svelte store, single source of truth
│   └── components/simulation/   # UI components
└── routes/
    └── +page.svelte             # Main game page
```

The simulation layer has no UI dependencies, and every random roll goes through an injectable `rng`. `src/lib/simulation/Game.js` holds the game loop as pure functions; `gameStore.js` is a thin Svelte adapter over it. You can drive the simulation from tests or scripts with a seed to validate balance changes reproducibly.

`src/tests/goldenMaster.test.js` snapshots complete seeded games. A refactor should leave those snapshots unchanged; a deliberate rule change updates them (`npx vitest run -u`), and the diff shows what the change did to play.

## Credits

Inspired in part by Tom Grant's *Dice of Debt* (GameChange LLC, 2015), published by the Agile Alliance.

Built with SvelteKit, Tailwind, and Vitest.
