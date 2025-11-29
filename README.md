# Dice of Debt - Web Version

A web-based implementation of the Dice of Debt game by Tom Grant (GameChange LLC) for the Agile Alliance.

## About the Game

Dice of Debt is an educational game about technical debt in software development. Players work as a software development team over 10 sprints, balancing creating new value against managing technical debt.

The game demonstrates how technical debt accumulates, how it impacts productivity, and how investing in quality practices can help teams deliver more value over time.

## Features

- **Standard Game Mode**: Classic rules with fixed costs and benefits
- **Uncertain Outcomes Variant**: Randomized measure effectiveness for added realism
- **Interactive Score Sheet**: Track progress across all 10 sprints
- **Visual Dice Rolling**: See your NV and TD dice results
- **Investment Management**: Decide when to invest in TD-reducing measures
- **Responsive Design**: Play on desktop or mobile devices

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:5173

### Build

```bash
npm run build
npm run preview
```

### Testing

```bash
npm test          # Run tests once
npm run test:watch # Watch mode
```

## How to Play

1. **Choose your game mode** (Standard or Uncertain Outcomes)
2. **Each sprint:**
   - Optionally invest in a TD-reducing measure
   - Roll New Value (NV) dice
   - Roll Technical Debt (TD) dice
   - Complete the sprint to calculate Net New Value
3. **Continue for 10 sprints**
4. **Your final score** is the cumulative value created

### Game Mechanics

- **New Value (NV) Dice**: Blue dice representing productive work
- **Technical Debt (TD) Dice**: Red dice representing accumulated debt
- **Net New Value**: NV Total - TD Total (minimum 0)
- **Cumulative Value**: Running total of Net New Value across all sprints

### Starting Configuration

- 8 NV dice
- 4 TD dice
- 12 total dice (dice can move between pools with certain measures)

## TD-Reducing Measures

### Reduced Complexity
- **Cost**: 2 NV dice for 3 turns
- **Benefit**: Move 2 dice from TD to NV pool permanently
- **Commitment**: High

### Code Review
- **Cost**: 3 NV dice for 2 turns
- **Benefit**: Move 1 die from TD to NV pool permanently
- **Commitment**: Low

### Continuous Integration
- **Cost**: 1 NV die for 2 turns
- **Benefit**: Re-roll any TD dice once per turn
- **Commitment**: Medium

### Increased Test Coverage
- **Cost**: 1 NV die for 3 turns
- **Benefit**: Subtract 3 from TD total each turn
- **Commitment**: Low

## Game Modes

### Standard Mode

Fixed costs and benefits as described above. Predictable outcomes allow players to strategize investments.

### Uncertain Outcomes Variant

Each measure has 4 possible cost/benefit cards. At the start of the game, one card is randomly selected for each measure. Players discover the actual costs and benefits only when they invest in a measure, simulating real-world uncertainty in improvement initiatives.

## Tech Stack

- **Framework**: SvelteKit
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Testing**: Vitest + @testing-library/svelte
- **Language**: JavaScript with JSDoc

## Project Structure

```
src/
├── lib/
│   ├── game/                    # Core game logic (pure JS)
│   │   ├── DiceRoller.js        # Dice rolling mechanics
│   │   ├── TDMeasures.js        # Measure definitions
│   │   ├── GameState.js         # State management
│   │   ├── GameController.js    # Game flow control
│   │   └── UncertainOutcomes.js # Variant implementation
│   ├── stores/                  # Svelte stores
│   │   └── gameStore.js         # Reactive game state
│   └── components/              # UI components
│       ├── DiceDisplay.svelte
│       ├── InvestmentPanel.svelte
│       ├── ScoreSheet.svelte
│       └── GameSetup.svelte
└── routes/
    └── +page.svelte             # Main game page
```

## Development

The project follows Test-Driven Development (TDD) principles:

- All game logic has comprehensive unit tests
- Components have integration tests
- 82+ tests ensure correctness

### Running Tests

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch
```

### Building for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

## Credits

- **Original Game**: Tom Grant, GameChange LLC
- **Publisher**: Agile Alliance
- **Original Game Materials**: © 2015 GameChange LLC
- **Web Implementation**: Built with Claude Code

## Links

- [Original Dice of Debt](https://www.agilealliance.org/resources/experience-reports/dice-of-debt-a-hands-on-activity-to-introduce-technical-debt/)
- [Agile Alliance](https://www.agilealliance.org/)

## License

This is an educational implementation of the Dice of Debt game. Original game materials © 2015 GameChange LLC.

## Contributing

This project was created as an educational implementation. If you find issues or have suggestions, please feel free to open an issue or submit a pull request.
