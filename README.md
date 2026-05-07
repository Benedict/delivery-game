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

- **Code health** drives flow efficiency. At healthy code the team runs at 90% efficiency. At crisis quality it drops to 40% — a 2.25× capacity gap.
- **Capacity** is base team output, scaled by flow efficiency.
- **Customer satisfaction** moves with feature quality and bug rates. Low satisfaction triggers churn.
- **Market position** moves with consistent delivery and high satisfaction. Strong position unlocks enterprise opportunities.
- **Business value** accumulates in pounds and forms the score.
- **Work-in-progress** penalises efficiency above one active item (1: 100%, 2: 95%, 3: 85%, 4+: 70%).
- **Opportunity deadlines** force urgency. Late features lose their value entirely.

Improvements include fixing critical bugs, pair programming, refactoring, hiring, and adopting TDD. A security incident forces a two-week emergency fix that blocks all other work.

## Scenarios

- **The Startup** — Capacity 120, code health 70. Fifteen weeks to deliver £500K in business value. High delivery pressure throughout.
- **The Legacy System** — Capacity 80, code health -20. Twenty weeks to deliver £400K and recover code health to 50. Modernisation under load.
- **The Greenfield Project** — Capacity 100, code health 80. Fifteen weeks to deliver £600K while keeping code health above 70. Sustainable growth from day one.

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

The simulation layer has no UI dependencies. You can drive it from tests or scripts to validate balance changes without rendering anything.

## Credits

Inspired in part by Tom Grant's *Dice of Debt* (GameChange LLC, 2015), published by the Agile Alliance.

Built with SvelteKit, Tailwind, and Vitest.
