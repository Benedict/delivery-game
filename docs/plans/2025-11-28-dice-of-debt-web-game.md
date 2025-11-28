# Dice of Debt Web Game Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a web version of the Dice of Debt game - an educational tool about technical debt in software development

**Architecture:** SvelteKit single-page application with pure JavaScript game logic modules, Svelte stores for state management, and component-based UI matching the physical game's design. TDD approach throughout.

**Tech Stack:** SvelteKit, Vite, Tailwind CSS, Vitest, @testing-library/svelte, Chart.js

---

## Task 1: Project Setup

**Files:**

- Create: `package.json`
- Create: `vite.config.js`
- Create: `tailwind.config.js`
- Create: `vitest.config.js`
- Create: `svelte.config.js`

**Step 1: Initialize SvelteKit project**

Run:

```bash
npm create svelte@latest . -- --template skeleton --types checkjs --no-prettier --no-eslint --no-playwright --no-vitest
```

Expected: Creates basic SvelteKit structure

**Step 2: Install dependencies**

Run:

```bash
npm install
npm install -D tailwindcss postcss autoprefixer vitest @testing-library/svelte @testing-library/jest-dom jsdom chart.js
```

Expected: All packages installed

**Step 3: Configure Tailwind CSS**

Run:

```bash
npx tailwindcss init -p
```

Then modify `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      colors: {
        "nv-blue": "#5B9BD5",
        "td-red": "#E74C3C",
        "measure-green": "#2ECC71",
        "measure-yellow": "#F1C40F",
      },
    },
  },
  plugins: [],
};
```

**Step 4: Configure Vitest**

Create `vitest.config.js`:

```js
import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.js"],
  },
});
```

Create `src/tests/setup.js`:

```js
import "@testing-library/jest-dom";
```

**Step 5: Add Tailwind to app**

Create `src/app.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Modify `src/routes/+layout.svelte`:

```svelte
<script>
  import '../app.css';
</script>

<slot />
```

**Step 6: Update package.json scripts**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**Step 7: Verify setup**

Run:

```bash
npm run dev
```

Expected: Dev server starts at http://localhost:5173

Run:

```bash
npm test
```

Expected: "No test files found"

**Step 8: Commit**

```bash
git init
git add .
git commit -m "feat: initialize SvelteKit project with Tailwind and Vitest"
```

---

## Task 2: Core Game Logic - Dice Rolling

**Files:**

- Create: `src/lib/game/DiceRoller.js`
- Create: `src/lib/game/DiceRoller.test.js`

**Step 1: Write failing test for single die roll**

Create `src/lib/game/DiceRoller.test.js`:

```js
import { describe, it, expect, vi } from "vitest";
import { rollDice, rollSingleDie } from "./DiceRoller.js";

describe("DiceRoller", () => {
  describe("rollSingleDie", () => {
    it("should return a number between 1 and 6", () => {
      const result = rollSingleDie();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
      expect(Number.isInteger(result)).toBe(true);
    });

    it("should use Math.random for rolling", () => {
      const spy = vi.spyOn(Math, "random").mockReturnValue(0.5);
      const result = rollSingleDie();
      expect(result).toBe(4); // 0.5 * 6 = 3, floor(3) + 1 = 4
      spy.mockRestore();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm test DiceRoller.test.js
```

Expected: FAIL - "Cannot find module './DiceRoller.js'"

**Step 3: Implement rollSingleDie**

Create `src/lib/game/DiceRoller.js`:

```js
/**
 * Roll a single six-sided die
 * @returns {number} Result between 1 and 6
 */
export function rollSingleDie() {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Roll multiple dice and return individual results
 * @param {number} count - Number of dice to roll
 * @returns {number[]} Array of individual die results
 */
export function rollDice(count) {
  return Array.from({ length: count }, () => rollSingleDie());
}

/**
 * Roll dice and return the sum
 * @param {number} count - Number of dice to roll
 * @returns {number} Sum of all dice
 */
export function rollAndSum(count) {
  return rollDice(count).reduce((sum, die) => sum + die, 0);
}
```

**Step 4: Run test to verify it passes**

Run:

```bash
npm test DiceRoller.test.js
```

Expected: PASS (2 tests)

**Step 5: Write tests for rollDice**

Add to `src/lib/game/DiceRoller.test.js`:

```js
describe("rollDice", () => {
  it("should return array of correct length", () => {
    const result = rollDice(8);
    expect(result).toHaveLength(8);
  });

  it("should return all values between 1 and 6", () => {
    const result = rollDice(20);
    result.forEach((die) => {
      expect(die).toBeGreaterThanOrEqual(1);
      expect(die).toBeLessThanOrEqual(6);
    });
  });

  it("should return empty array for 0 dice", () => {
    const result = rollDice(0);
    expect(result).toEqual([]);
  });
});
```

**Step 6: Run tests**

Run:

```bash
npm test DiceRoller.test.js
```

Expected: PASS (5 tests)

**Step 7: Write tests for rollAndSum**

Add to `src/lib/game/DiceRoller.test.js`:

```js
describe("rollAndSum", () => {
  it("should return sum of all dice", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0) // 1
      .mockReturnValueOnce(0.5) // 4
      .mockReturnValueOnce(0.9); // 6

    const result = rollAndSum(3);
    expect(result).toBe(11);
    vi.restoreAllMocks();
  });

  it("should return 0 for 0 dice", () => {
    const result = rollAndSum(0);
    expect(result).toBe(0);
  });
});
```

**Step 8: Run all tests**

Run:

```bash
npm test DiceRoller.test.js
```

Expected: PASS (7 tests)

**Step 9: Commit**

```bash
git add src/lib/game/DiceRoller.js src/lib/game/DiceRoller.test.js
git commit -m "feat: add dice rolling logic with tests"
```

---

## Task 3: TD-Reducing Measures Model

**Files:**

- Create: `src/lib/game/TDMeasures.js`
- Create: `src/lib/game/TDMeasures.test.js`

**Step 1: Write failing test for measure definitions**

Create `src/lib/game/TDMeasures.test.js`:

```js
import { describe, it, expect } from "vitest";
import { MEASURES, getMeasure, getAllMeasures } from "./TDMeasures.js";

describe("TDMeasures", () => {
  describe("measure definitions", () => {
    it("should have 4 measures defined", () => {
      const measures = getAllMeasures();
      expect(measures).toHaveLength(4);
    });

    it("should define Reduced Complexity correctly", () => {
      const measure = getMeasure("reducedComplexity");
      expect(measure.name).toBe("Reduced Complexity");
      expect(measure.cost).toBe(2);
      expect(measure.costDuration).toBe(3);
      expect(measure.benefitType).toBe("moveDice");
      expect(measure.benefitValue).toBe(2);
    });

    it("should define Code Review correctly", () => {
      const measure = getMeasure("codeReview");
      expect(measure.name).toBe("Code Review");
      expect(measure.cost).toBe(3);
      expect(measure.costDuration).toBe(2);
      expect(measure.benefitType).toBe("moveDice");
      expect(measure.benefitValue).toBe(1);
    });

    it("should define Continuous Integration correctly", () => {
      const measure = getMeasure("continuousIntegration");
      expect(measure.name).toBe("Continuous Integration");
      expect(measure.cost).toBe(1);
      expect(measure.costDuration).toBe(2);
      expect(measure.benefitType).toBe("reroll");
      expect(measure.benefitValue).toBe(1);
    });

    it("should define Increased Test Coverage correctly", () => {
      const measure = getMeasure("increasedTestCoverage");
      expect(measure.name).toBe("Increased Test Coverage");
      expect(measure.cost).toBe(1);
      expect(measure.costDuration).toBe(3);
      expect(measure.benefitType).toBe("subtractFromTD");
      expect(measure.benefitValue).toBe(3);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm test TDMeasures.test.js
```

Expected: FAIL - "Cannot find module './TDMeasures.js'"

**Step 3: Implement TD measures**

Create `src/lib/game/TDMeasures.js`:

```js
/**
 * Technical Debt Reducing Measures
 * Each measure has a cost (NV dice) and duration (sprints),
 * plus a benefit that activates after investment completes
 */

export const MEASURES = {
  reducedComplexity: {
    id: "reducedComplexity",
    name: "Reduced Complexity",
    description:
      "Remove 2 dice from the TD pool, add them to the NV pool for the rest of the game.",
    cost: 2, // NV dice per turn
    costDuration: 3, // turns
    benefitType: "moveDice", // Move dice from TD to NV pool
    benefitValue: 2, // number of dice to move
    commitment: "High",
    color: "blue",
  },
  codeReview: {
    id: "codeReview",
    name: "Code Review",
    description:
      "Remove 1 die from the TD pool, add it to the NV pool for the rest of the game.",
    cost: 3,
    costDuration: 2,
    benefitType: "moveDice",
    benefitValue: 1,
    commitment: "Low",
    color: "gray",
  },
  continuousIntegration: {
    id: "continuousIntegration",
    name: "Continuous Integration",
    description: "Re-roll once any TD dice each turn.",
    cost: 1,
    costDuration: 2,
    benefitType: "reroll",
    benefitValue: 1, // number of dice that can be rerolled
    commitment: "Medium",
    color: "green",
  },
  increasedTestCoverage: {
    id: "increasedTestCoverage",
    name: "Increased Test Coverage",
    description:
      "Subtract 3 from the TD total rolled each turn for the rest of the game.",
    cost: 1,
    costDuration: 3,
    benefitType: "subtractFromTD",
    benefitValue: 3,
    commitment: "Low",
    color: "yellow",
  },
};

/**
 * Get a specific measure by ID
 * @param {string} measureId
 * @returns {object} Measure definition
 */
export function getMeasure(measureId) {
  return MEASURES[measureId];
}

/**
 * Get all measures as an array
 * @returns {object[]} Array of all measures
 */
export function getAllMeasures() {
  return Object.values(MEASURES);
}
```

**Step 4: Run tests**

Run:

```bash
npm test TDMeasures.test.js
```

Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/lib/game/TDMeasures.js src/lib/game/TDMeasures.test.js
git commit -m "feat: add TD-reducing measures definitions"
```

---

## Task 4: Game State Model

**Files:**

- Create: `src/lib/game/GameState.js`
- Create: `src/lib/game/GameState.test.js`

**Step 1: Write failing test for initial game state**

Create `src/lib/game/GameState.test.js`:

```js
import { describe, it, expect } from "vitest";
import { createInitialState, getCurrentSprint } from "./GameState.js";

describe("GameState", () => {
  describe("createInitialState", () => {
    it("should create initial state with correct values", () => {
      const state = createInitialState();

      expect(state.currentSprint).toBe(1);
      expect(state.nvDice).toBe(8);
      expect(state.tdDice).toBe(4);
      expect(state.totalDice).toBe(12);
      expect(state.sprints).toHaveLength(10);
      expect(state.activeMeasures).toEqual([]);
      expect(state.completedMeasures).toEqual([]);
      expect(state.currentInvestment).toBeNull();
    });

    it("should initialize all sprints with empty data", () => {
      const state = createInitialState();

      state.sprints.forEach((sprint, index) => {
        expect(sprint.number).toBe(index + 1);
        expect(sprint.nvDiceCount).toBe(8);
        expect(sprint.tdDiceCount).toBe(4);
        expect(sprint.investedDice).toBe(0);
        expect(sprint.nvRoll).toBeNull();
        expect(sprint.tdRoll).toBeNull();
        expect(sprint.nvTotal).toBeNull();
        expect(sprint.tdTotal).toBeNull();
        expect(sprint.netNewValue).toBeNull();
        expect(sprint.cumulativeValue).toBe(0);
      });
    });
  });

  describe("getCurrentSprint", () => {
    it("should return current sprint data", () => {
      const state = createInitialState();
      const sprint = getCurrentSprint(state);

      expect(sprint.number).toBe(1);
      expect(sprint.nvDiceCount).toBe(8);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm test GameState.test.js
```

Expected: FAIL - "Cannot find module './GameState.js'"

**Step 3: Implement initial game state**

Create `src/lib/game/GameState.js`:

```js
const TOTAL_SPRINTS = 10;
const INITIAL_NV_DICE = 8;
const INITIAL_TD_DICE = 4;
const TOTAL_DICE = 12;

/**
 * Create a sprint data object
 * @param {number} sprintNumber
 * @param {number} nvDice
 * @param {number} tdDice
 * @returns {object}
 */
function createSprint(
  sprintNumber,
  nvDice = INITIAL_NV_DICE,
  tdDice = INITIAL_TD_DICE
) {
  return {
    number: sprintNumber,
    nvDiceCount: nvDice,
    tdDiceCount: tdDice,
    investedDice: 0,
    nvRoll: null, // Array of individual die results
    tdRoll: null, // Array of individual die results
    nvTotal: null,
    tdTotal: null,
    netNewValue: null,
    cumulativeValue: 0,
  };
}

/**
 * Create initial game state
 * @returns {object} Initial game state
 */
export function createInitialState() {
  return {
    currentSprint: 1,
    nvDice: INITIAL_NV_DICE,
    tdDice: INITIAL_TD_DICE,
    totalDice: TOTAL_DICE,
    sprints: Array.from({ length: TOTAL_SPRINTS }, (_, i) =>
      createSprint(i + 1)
    ),
    activeMeasures: [], // Measures currently providing benefits
    completedMeasures: [], // All measures that have been fully invested in
    currentInvestment: null, // Current measure being invested in
    investmentProgress: 0, // Sprints invested so far
  };
}

/**
 * Get the current sprint data
 * @param {object} state
 * @returns {object} Current sprint
 */
export function getCurrentSprint(state) {
  return state.sprints[state.currentSprint - 1];
}

/**
 * Get a specific sprint by number
 * @param {object} state
 * @param {number} sprintNumber
 * @returns {object} Sprint data
 */
export function getSprint(state, sprintNumber) {
  return state.sprints[sprintNumber - 1];
}
```

**Step 4: Run tests**

Run:

```bash
npm test GameState.test.js
```

Expected: PASS (3 tests)

**Step 5: Write tests for investment management**

Add to `src/lib/game/GameState.test.js`:

```js
import {
  createInitialState,
  getCurrentSprint,
  startInvestment,
  canInvest,
} from "./GameState.js";

describe("investment management", () => {
  it("should allow starting investment when none active", () => {
    const state = createInitialState();
    expect(canInvest(state, "reducedComplexity")).toBe(true);
  });

  it("should not allow investment when one is active", () => {
    const state = createInitialState();
    const newState = startInvestment(state, "reducedComplexity");
    expect(canInvest(newState, "codeReview")).toBe(false);
  });

  it("should not allow investing in same measure twice", () => {
    const state = createInitialState();
    state.completedMeasures = ["reducedComplexity"];
    expect(canInvest(state, "reducedComplexity")).toBe(false);
  });

  it("should start investment correctly", () => {
    const state = createInitialState();
    const newState = startInvestment(state, "reducedComplexity");

    expect(newState.currentInvestment).toBe("reducedComplexity");
    expect(newState.investmentProgress).toBe(0);
    expect(newState.nvDice).toBe(6); // 8 - 2 (cost of reduced complexity)
  });
});
```

**Step 6: Run test to verify it fails**

Run:

```bash
npm test GameState.test.js
```

Expected: FAIL - "startInvestment is not a function"

**Step 7: Implement investment functions**

Add to `src/lib/game/GameState.js`:

```js
import { getMeasure } from "./TDMeasures.js";

/**
 * Check if can invest in a measure
 * @param {object} state
 * @param {string} measureId
 * @returns {boolean}
 */
export function canInvest(state, measureId) {
  // Can't invest if already have an active investment
  if (state.currentInvestment !== null) {
    return false;
  }

  // Can't invest in a measure already completed
  if (state.completedMeasures.includes(measureId)) {
    return false;
  }

  return true;
}

/**
 * Start investing in a measure
 * @param {object} state
 * @param {string} measureId
 * @returns {object} New state
 */
export function startInvestment(state, measureId) {
  if (!canInvest(state, measureId)) {
    return state;
  }

  const measure = getMeasure(measureId);

  return {
    ...state,
    currentInvestment: measureId,
    investmentProgress: 0,
    nvDice: state.nvDice - measure.cost,
  };
}
```

**Step 8: Run tests**

Run:

```bash
npm test GameState.test.js
```

Expected: PASS (7 tests)

**Step 9: Write tests for completing sprint**

Add to `src/lib/game/GameState.test.js`:

```js
import {
  createInitialState,
  getCurrentSprint,
  startInvestment,
  canInvest,
  recordSprintRolls,
  advanceSprint,
} from "./GameState.js";

describe("sprint management", () => {
  it("should record sprint rolls correctly", () => {
    const state = createInitialState();
    const nvRoll = [1, 2, 3, 4, 5, 6, 1, 2]; // sum = 24
    const tdRoll = [6, 6, 6, 6]; // sum = 24

    const newState = recordSprintRolls(state, nvRoll, tdRoll);
    const sprint = getCurrentSprint(newState);

    expect(sprint.nvRoll).toEqual(nvRoll);
    expect(sprint.tdRoll).toEqual(tdRoll);
    expect(sprint.nvTotal).toBe(24);
    expect(sprint.tdTotal).toBe(24);
    expect(sprint.netNewValue).toBe(0); // 24 - 24 = 0
    expect(sprint.cumulativeValue).toBe(0);
  });

  it("should calculate net new value correctly with positive result", () => {
    const state = createInitialState();
    const nvRoll = [6, 6, 6, 6, 6, 6, 6, 6]; // sum = 48
    const tdRoll = [1, 1, 1, 1]; // sum = 4

    const newState = recordSprintRolls(state, nvRoll, tdRoll);
    const sprint = getCurrentSprint(newState);

    expect(sprint.netNewValue).toBe(44); // 48 - 4 = 44
  });

  it("should not allow negative net new value", () => {
    const state = createInitialState();
    const nvRoll = [1, 1, 1, 1, 1, 1, 1, 1]; // sum = 8
    const tdRoll = [6, 6, 6, 6]; // sum = 24

    const newState = recordSprintRolls(state, nvRoll, tdRoll);
    const sprint = getCurrentSprint(newState);

    expect(sprint.netNewValue).toBe(0); // Can't be negative
  });

  it("should track cumulative value across sprints", () => {
    let state = createInitialState();

    // Sprint 1: NNV = 10
    state = recordSprintRolls(state, [2, 2, 2, 2, 2, 2, 2, 2], [1, 1, 1, 3]);
    expect(getCurrentSprint(state).cumulativeValue).toBe(10);

    state = advanceSprint(state);

    // Sprint 2: NNV = 15
    state = recordSprintRolls(state, [3, 3, 3, 3, 3, 3, 3, 3], [2, 2, 2, 3]);
    expect(getCurrentSprint(state).cumulativeValue).toBe(25); // 10 + 15
  });

  it("should advance to next sprint", () => {
    const state = createInitialState();
    const newState = advanceSprint(state);

    expect(newState.currentSprint).toBe(2);
  });

  it("should not advance past sprint 10", () => {
    let state = createInitialState();
    state.currentSprint = 10;

    const newState = advanceSprint(state);
    expect(newState.currentSprint).toBe(10);
  });
});
```

**Step 10: Run test to verify it fails**

Run:

```bash
npm test GameState.test.js
```

Expected: FAIL - "recordSprintRolls is not a function"

**Step 11: Implement sprint functions**

Add to `src/lib/game/GameState.js`:

```js
/**
 * Record dice rolls for current sprint
 * @param {object} state
 * @param {number[]} nvRoll - Individual NV die results
 * @param {number[]} tdRoll - Individual TD die results
 * @returns {object} New state
 */
export function recordSprintRolls(state, nvRoll, tdRoll) {
  const currentSprint = getCurrentSprint(state);
  const previousSprint =
    state.currentSprint > 1 ? getSprint(state, state.currentSprint - 1) : null;

  const nvTotal = nvRoll.reduce((sum, die) => sum + die, 0);
  const tdTotal = tdRoll.reduce((sum, die) => sum + die, 0);
  const netNewValue = Math.max(0, nvTotal - tdTotal);
  const cumulativeValue = (previousSprint?.cumulativeValue || 0) + netNewValue;

  const updatedSprint = {
    ...currentSprint,
    nvRoll,
    tdRoll,
    nvTotal,
    tdTotal,
    netNewValue,
    cumulativeValue,
  };

  const newSprints = [...state.sprints];
  newSprints[state.currentSprint - 1] = updatedSprint;

  return {
    ...state,
    sprints: newSprints,
  };
}

/**
 * Advance to next sprint
 * @param {object} state
 * @returns {object} New state
 */
export function advanceSprint(state) {
  if (state.currentSprint >= TOTAL_SPRINTS) {
    return state;
  }

  return {
    ...state,
    currentSprint: state.currentSprint + 1,
  };
}
```

**Step 12: Run tests**

Run:

```bash
npm test GameState.test.js
```

Expected: PASS (13 tests)

**Step 13: Commit**

```bash
git add src/lib/game/GameState.js src/lib/game/GameState.test.js
git commit -m "feat: add game state management with sprint tracking"
```

---

## Task 5: Investment Lifecycle

**Files:**

- Modify: `src/lib/game/GameState.js`
- Modify: `src/lib/game/GameState.test.js`

**Step 1: Write tests for investment progression**

Add to `src/lib/game/GameState.test.js`:

```js
import {
  createInitialState,
  getCurrentSprint,
  startInvestment,
  canInvest,
  recordSprintRolls,
  advanceSprint,
  progressInvestment,
  applyMeasureBenefits,
} from "./GameState.js";

describe("investment lifecycle", () => {
  it("should progress investment each sprint", () => {
    let state = createInitialState();
    state = startInvestment(state, "reducedComplexity"); // cost 2, duration 3

    expect(state.investmentProgress).toBe(0);

    state = progressInvestment(state);
    expect(state.investmentProgress).toBe(1);

    state = progressInvestment(state);
    expect(state.investmentProgress).toBe(2);
  });

  it("should complete investment after duration", () => {
    let state = createInitialState();
    state = startInvestment(state, "continuousIntegration"); // cost 1, duration 2

    state = progressInvestment(state);
    expect(state.currentInvestment).toBe("continuousIntegration");

    state = progressInvestment(state);
    expect(state.currentInvestment).toBeNull();
    expect(state.completedMeasures).toContain("continuousIntegration");
    expect(state.activeMeasures).toContain("continuousIntegration");
  });

  it("should return invested dice after completion", () => {
    let state = createInitialState();
    expect(state.nvDice).toBe(8);

    state = startInvestment(state, "reducedComplexity"); // cost 2
    expect(state.nvDice).toBe(6);

    // Complete investment
    state = progressInvestment(state);
    state = progressInvestment(state);
    state = progressInvestment(state);

    expect(state.nvDice).toBe(8); // Dice returned
  });

  it("should apply moveDice benefit correctly", () => {
    let state = createInitialState();
    expect(state.nvDice).toBe(8);
    expect(state.tdDice).toBe(4);

    state = startInvestment(state, "reducedComplexity"); // moves 2 dice
    state = progressInvestment(state);
    state = progressInvestment(state);
    state = progressInvestment(state);

    state = applyMeasureBenefits(state);

    expect(state.nvDice).toBe(10); // 8 + 2
    expect(state.tdDice).toBe(2); // 4 - 2
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm test GameState.test.js
```

Expected: FAIL - "progressInvestment is not a function"

**Step 3: Implement investment progression**

Add to `src/lib/game/GameState.js`:

```js
/**
 * Progress investment by one sprint
 * @param {object} state
 * @returns {object} New state
 */
export function progressInvestment(state) {
  if (state.currentInvestment === null) {
    return state;
  }

  const measure = getMeasure(state.currentInvestment);
  const newProgress = state.investmentProgress + 1;

  // Check if investment is complete
  if (newProgress >= measure.costDuration) {
    return {
      ...state,
      currentInvestment: null,
      investmentProgress: 0,
      nvDice: state.nvDice + measure.cost, // Return invested dice
      completedMeasures: [...state.completedMeasures, measure.id],
      activeMeasures: [...state.activeMeasures, measure.id],
    };
  }

  // Continue investment
  return {
    ...state,
    investmentProgress: newProgress,
  };
}

/**
 * Apply benefits from completed measures to dice pools
 * @param {object} state
 * @returns {object} New state
 */
export function applyMeasureBenefits(state) {
  let newState = { ...state };

  state.activeMeasures.forEach((measureId) => {
    const measure = getMeasure(measureId);

    if (measure.benefitType === "moveDice") {
      // Only apply if not already applied
      const expectedNV = INITIAL_NV_DICE + measure.benefitValue;
      if (newState.nvDice < expectedNV) {
        newState = {
          ...newState,
          nvDice: newState.nvDice + measure.benefitValue,
          tdDice: newState.tdDice - measure.benefitValue,
        };
      }
    }
  });

  return newState;
}
```

**Step 4: Run tests**

Run:

```bash
npm test GameState.test.js
```

Expected: PASS (17 tests)

**Step 5: Write tests for applying TD modifiers**

Add to `src/lib/game/GameState.test.js`:

```js
import {
  createInitialState,
  getCurrentSprint,
  startInvestment,
  canInvest,
  recordSprintRolls,
  advanceSprint,
  progressInvestment,
  applyMeasureBenefits,
  applyTDModifiers,
  canRerollTD,
} from "./GameState.js";

describe("TD modifiers from measures", () => {
  it("should allow TD reroll when continuous integration active", () => {
    let state = createInitialState();
    state.activeMeasures = ["continuousIntegration"];

    expect(canRerollTD(state)).toBe(true);
  });

  it("should not allow reroll without continuous integration", () => {
    const state = createInitialState();
    expect(canRerollTD(state)).toBe(false);
  });

  it("should subtract from TD total with increased test coverage", () => {
    let state = createInitialState();
    state.activeMeasures = ["increasedTestCoverage"];

    const tdTotal = 20;
    const modified = applyTDModifiers(state, tdTotal);

    expect(modified).toBe(17); // 20 - 3
  });

  it("should not go below 0 when subtracting", () => {
    let state = createInitialState();
    state.activeMeasures = ["increasedTestCoverage"];

    const modified = applyTDModifiers(state, 2);
    expect(modified).toBe(0); // max(0, 2 - 3)
  });

  it("should not modify TD total without measures", () => {
    const state = createInitialState();
    const modified = applyTDModifiers(state, 20);
    expect(modified).toBe(20);
  });
});
```

**Step 6: Run test to verify it fails**

Run:

```bash
npm test GameState.test.js
```

Expected: FAIL - "applyTDModifiers is not a function"

**Step 7: Implement TD modifier functions**

Add to `src/lib/game/GameState.js`:

```js
/**
 * Check if TD dice can be rerolled
 * @param {object} state
 * @returns {boolean}
 */
export function canRerollTD(state) {
  return state.activeMeasures.includes("continuousIntegration");
}

/**
 * Apply TD modifiers from active measures
 * @param {object} state
 * @param {number} tdTotal - Original TD total
 * @returns {number} Modified TD total
 */
export function applyTDModifiers(state, tdTotal) {
  let modified = tdTotal;

  state.activeMeasures.forEach((measureId) => {
    const measure = getMeasure(measureId);

    if (measure.benefitType === "subtractFromTD") {
      modified = Math.max(0, modified - measure.benefitValue);
    }
  });

  return modified;
}
```

**Step 8: Run tests**

Run:

```bash
npm test GameState.test.js
```

Expected: PASS (22 tests)

**Step 9: Commit**

```bash
git add src/lib/game/GameState.js src/lib/game/GameState.test.js
git commit -m "feat: add investment lifecycle and TD modifiers"
```

---

## Task 6: Game Controller

**Files:**

- Create: `src/lib/game/GameController.js`
- Create: `src/lib/game/GameController.test.js`

**Step 1: Write tests for game flow**

Create `src/lib/game/GameController.test.js`:

```js
import { describe, it, expect, vi } from "vitest";
import {
  createGame,
  investInMeasure,
  rollNVDice,
  rollTDDice,
  rerollTDDice,
  completeSprint,
  isGameOver,
  getFinalScore,
} from "./GameController.js";

describe("GameController", () => {
  describe("createGame", () => {
    it("should create a new game", () => {
      const game = createGame();
      expect(game.state.currentSprint).toBe(1);
      expect(game.state.nvDice).toBe(8);
    });
  });

  describe("investInMeasure", () => {
    it("should invest in a measure", () => {
      const game = createGame();
      const newGame = investInMeasure(game, "reducedComplexity");

      expect(newGame.state.currentInvestment).toBe("reducedComplexity");
      expect(newGame.state.nvDice).toBe(6);
    });

    it("should not allow duplicate investments", () => {
      let game = createGame();
      game = investInMeasure(game, "reducedComplexity");

      const result = investInMeasure(game, "codeReview");
      expect(result).toEqual(game); // No change
    });
  });

  describe("rollNVDice", () => {
    it("should roll NV dice based on current count", () => {
      const game = createGame();
      const newGame = rollNVDice(game);

      const sprint = newGame.state.sprints[0];
      expect(sprint.nvRoll).toHaveLength(8);
      expect(sprint.nvTotal).toBeGreaterThan(0);
    });

    it("should account for invested dice", () => {
      let game = createGame();
      game = investInMeasure(game, "reducedComplexity"); // -2 dice
      game = rollNVDice(game);

      const sprint = game.state.sprints[0];
      expect(sprint.nvRoll).toHaveLength(6);
    });
  });

  describe("rollTDDice", () => {
    it("should roll TD dice and apply modifiers", () => {
      const game = createGame();
      const newGame = rollTDDice(game);

      const sprint = newGame.state.sprints[0];
      expect(sprint.tdRoll).toHaveLength(4);
      expect(sprint.tdTotal).toBeGreaterThanOrEqual(0);
    });
  });

  describe("completeSprint", () => {
    it("should calculate net new value and advance sprint", () => {
      let game = createGame();
      game = rollNVDice(game);
      game = rollTDDice(game);
      game = completeSprint(game);

      expect(game.state.sprints[0].netNewValue).toBeGreaterThanOrEqual(0);
      expect(game.state.currentSprint).toBe(2);
    });

    it("should progress investment when advancing", () => {
      let game = createGame();
      game = investInMeasure(game, "continuousIntegration");
      game = rollNVDice(game);
      game = rollTDDice(game);

      expect(game.state.investmentProgress).toBe(0);

      game = completeSprint(game);
      expect(game.state.investmentProgress).toBe(1);
    });
  });

  describe("isGameOver", () => {
    it("should return false before sprint 10", () => {
      const game = createGame();
      expect(isGameOver(game)).toBe(false);
    });

    it("should return true after sprint 10 is complete", () => {
      let game = createGame();
      game.state.currentSprint = 10;
      game.state.sprints[9].netNewValue = 20; // Sprint 10 completed

      expect(isGameOver(game)).toBe(true);
    });
  });

  describe("getFinalScore", () => {
    it("should return cumulative value from sprint 10", () => {
      const game = createGame();
      game.state.sprints[9].cumulativeValue = 250;

      expect(getFinalScore(game)).toBe(250);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm test GameController.test.js
```

Expected: FAIL - "Cannot find module './GameController.js'"

**Step 3: Implement game controller**

Create `src/lib/game/GameController.js`:

```js
import {
  createInitialState,
  getCurrentSprint,
  advanceSprint,
  progressInvestment,
  applyMeasureBenefits,
  startInvestment,
  canInvest,
  applyTDModifiers,
  canRerollTD,
} from "./GameState.js";
import { rollDice } from "./DiceRoller.js";

/**
 * Create a new game
 * @returns {object} Game object
 */
export function createGame() {
  return {
    state: createInitialState(),
  };
}

/**
 * Invest in a TD-reducing measure
 * @param {object} game
 * @param {string} measureId
 * @returns {object} New game
 */
export function investInMeasure(game, measureId) {
  if (!canInvest(game.state, measureId)) {
    return game;
  }

  return {
    ...game,
    state: startInvestment(game.state, measureId),
  };
}

/**
 * Roll NV dice for current sprint
 * @param {object} game
 * @returns {object} New game
 */
export function rollNVDice(game) {
  const sprint = getCurrentSprint(game.state);
  const diceCount = game.state.nvDice;
  const rolls = rollDice(diceCount);
  const total = rolls.reduce((sum, die) => sum + die, 0);

  const updatedSprint = {
    ...sprint,
    nvDiceCount: diceCount,
    nvRoll: rolls,
    nvTotal: total,
  };

  const newSprints = [...game.state.sprints];
  newSprints[game.state.currentSprint - 1] = updatedSprint;

  return {
    ...game,
    state: {
      ...game.state,
      sprints: newSprints,
    },
  };
}

/**
 * Roll TD dice for current sprint
 * @param {object} game
 * @returns {object} New game
 */
export function rollTDDice(game) {
  const sprint = getCurrentSprint(game.state);
  const diceCount = game.state.tdDice;
  const rolls = rollDice(diceCount);
  const rawTotal = rolls.reduce((sum, die) => sum + die, 0);
  const total = applyTDModifiers(game.state, rawTotal);

  const updatedSprint = {
    ...sprint,
    tdDiceCount: diceCount,
    tdRoll: rolls,
    tdTotal: total,
  };

  const newSprints = [...game.state.sprints];
  newSprints[game.state.currentSprint - 1] = updatedSprint;

  return {
    ...game,
    state: {
      ...game.state,
      sprints: newSprints,
    },
  };
}

/**
 * Reroll TD dice (if continuous integration active)
 * @param {object} game
 * @param {number[]} diceIndices - Indices of dice to reroll
 * @returns {object} New game
 */
export function rerollTDDice(game, diceIndices) {
  if (!canRerollTD(game.state)) {
    return game;
  }

  const sprint = getCurrentSprint(game.state);
  const newRolls = [...sprint.tdRoll];

  diceIndices.forEach((index) => {
    newRolls[index] = rollDice(1)[0];
  });

  const rawTotal = newRolls.reduce((sum, die) => sum + die, 0);
  const total = applyTDModifiers(game.state, rawTotal);

  const updatedSprint = {
    ...sprint,
    tdRoll: newRolls,
    tdTotal: total,
  };

  const newSprints = [...game.state.sprints];
  newSprints[game.state.currentSprint - 1] = updatedSprint;

  return {
    ...game,
    state: {
      ...game.state,
      sprints: newSprints,
    },
  };
}

/**
 * Complete current sprint and advance to next
 * @param {object} game
 * @returns {object} New game
 */
export function completeSprint(game) {
  const sprint = getCurrentSprint(game.state);

  // Calculate net new value
  const netNewValue = Math.max(0, sprint.nvTotal - sprint.tdTotal);
  const previousSprint =
    game.state.currentSprint > 1
      ? game.state.sprints[game.state.currentSprint - 2]
      : null;
  const cumulativeValue = (previousSprint?.cumulativeValue || 0) + netNewValue;

  const updatedSprint = {
    ...sprint,
    netNewValue,
    cumulativeValue,
  };

  const newSprints = [...game.state.sprints];
  newSprints[game.state.currentSprint - 1] = updatedSprint;

  let newState = {
    ...game.state,
    sprints: newSprints,
  };

  // Progress investment
  newState = progressInvestment(newState);

  // Apply measure benefits if investment just completed
  newState = applyMeasureBenefits(newState);

  // Advance sprint
  newState = advanceSprint(newState);

  return {
    ...game,
    state: newState,
  };
}

/**
 * Check if game is over
 * @param {object} game
 * @returns {boolean}
 */
export function isGameOver(game) {
  return (
    game.state.currentSprint === 10 &&
    game.state.sprints[9].netNewValue !== null
  );
}

/**
 * Get final score
 * @param {object} game
 * @returns {number}
 */
export function getFinalScore(game) {
  return game.state.sprints[9].cumulativeValue;
}
```

**Step 4: Run tests**

Run:

```bash
npm test GameController.test.js
```

Expected: PASS (10 tests)

**Step 5: Commit**

```bash
git add src/lib/game/GameController.js src/lib/game/GameController.test.js
git commit -m "feat: add game controller for managing game flow"
```

---

## Task 7: Svelte Store for Game State

**Files:**

- Create: `src/lib/stores/gameStore.js`
- Create: `src/lib/stores/gameStore.test.js`

**Step 1: Write tests for game store**

Create `src/lib/stores/gameStore.test.js`:

```js
import { describe, it, expect, beforeEach } from "vitest";
import { get } from "svelte/store";
import {
  gameStore,
  startNewGame,
  investInMeasureAction,
  rollNVDiceAction,
  rollTDDiceAction,
  completeSprintAction,
} from "./gameStore.js";

describe("gameStore", () => {
  beforeEach(() => {
    startNewGame();
  });

  it("should initialize with a new game", () => {
    const game = get(gameStore);
    expect(game.state.currentSprint).toBe(1);
    expect(game.state.nvDice).toBe(8);
  });

  it("should invest in measure", () => {
    investInMeasureAction("reducedComplexity");
    const game = get(gameStore);
    expect(game.state.currentInvestment).toBe("reducedComplexity");
  });

  it("should roll NV dice", () => {
    rollNVDiceAction();
    const game = get(gameStore);
    const sprint = game.state.sprints[0];
    expect(sprint.nvRoll).toHaveLength(8);
  });

  it("should roll TD dice", () => {
    rollTDDiceAction();
    const game = get(gameStore);
    const sprint = game.state.sprints[0];
    expect(sprint.tdRoll).toHaveLength(4);
  });

  it("should complete sprint and advance", () => {
    rollNVDiceAction();
    rollTDDiceAction();
    completeSprintAction();

    const game = get(gameStore);
    expect(game.state.sprints[0].netNewValue).toBeGreaterThanOrEqual(0);
    expect(game.state.currentSprint).toBe(2);
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm test gameStore.test.js
```

Expected: FAIL - "Cannot find module './gameStore.js'"

**Step 3: Implement game store**

Create `src/lib/stores/gameStore.js`:

```js
import { writable } from "svelte/store";
import {
  createGame,
  investInMeasure,
  rollNVDice,
  rollTDDice,
  rerollTDDice,
  completeSprint,
} from "../game/GameController.js";

function createGameStore() {
  const { subscribe, set, update } = writable(createGame());

  return {
    subscribe,

    startNew: () => set(createGame()),

    investInMeasure: (measureId) =>
      update((game) => investInMeasure(game, measureId)),

    rollNVDice: () => update((game) => rollNVDice(game)),

    rollTDDice: () => update((game) => rollTDDice(game)),

    rerollTDDice: (indices) => update((game) => rerollTDDice(game, indices)),

    completeSprint: () => update((game) => completeSprint(game)),

    reset: () => set(createGame()),
  };
}

export const gameStore = createGameStore();

// Action helpers for easier imports
export const startNewGame = () => gameStore.startNew();
export const investInMeasureAction = (measureId) =>
  gameStore.investInMeasure(measureId);
export const rollNVDiceAction = () => gameStore.rollNVDice();
export const rollTDDiceAction = () => gameStore.rollTDDice();
export const rerollTDDiceAction = (indices) => gameStore.rerollTDDice(indices);
export const completeSprintAction = () => gameStore.completeSprint();
```

**Step 4: Run tests**

Run:

```bash
npm test gameStore.test.js
```

Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/lib/stores/gameStore.js src/lib/stores/gameStore.test.js
git commit -m "feat: add Svelte store for game state management"
```

---

## Task 8: UI Components - Dice Display

**Files:**

- Create: `src/lib/components/DiceDisplay.svelte`
- Create: `src/lib/components/DiceDisplay.test.js`

**Step 1: Write component test**

Create `src/lib/components/DiceDisplay.test.js`:

```js
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/svelte";
import DiceDisplay from "./DiceDisplay.svelte";

describe("DiceDisplay", () => {
  it("should render dice values", () => {
    render(DiceDisplay, { props: { dice: [1, 2, 3, 4, 5, 6] } });

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  it("should show total", () => {
    render(DiceDisplay, { props: { dice: [6, 6, 6], showTotal: true } });

    expect(screen.getByText(/Total: 18/i)).toBeInTheDocument();
  });

  it("should apply custom colors", () => {
    const { container } = render(DiceDisplay, {
      props: { dice: [4], color: "blue" },
    });

    const die = container.querySelector(".bg-blue-500");
    expect(die).toBeInTheDocument();
  });

  it("should render empty when no dice", () => {
    const { container } = render(DiceDisplay, { props: { dice: [] } });
    const dice = container.querySelectorAll(".die");
    expect(dice).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm test DiceDisplay.test.js
```

Expected: FAIL - "Cannot find module './DiceDisplay.svelte'"

**Step 3: Implement DiceDisplay component**

Create `src/lib/components/DiceDisplay.svelte`:

```svelte
<script>
  export let dice = [];
  export let label = '';
  export let color = 'gray';
  export let showTotal = false;

  $: total = dice.reduce((sum, die) => sum + die, 0);

  const colorClasses = {
    blue: 'bg-blue-500 border-blue-700',
    red: 'bg-red-500 border-red-700',
    gray: 'bg-gray-500 border-gray-700',
    green: 'bg-green-500 border-green-700'
  };

  $: bgColor = colorClasses[color] || colorClasses.gray;
</script>

<div class="dice-container">
  {#if label}
    <h3 class="text-sm font-semibold mb-2 text-gray-700">{label}</h3>
  {/if}

  <div class="flex flex-wrap gap-2 items-center">
    {#each dice as die}
      <div class="die w-12 h-12 {bgColor} border-2 rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-md">
        {die}
      </div>
    {/each}

    {#if showTotal && dice.length > 0}
      <div class="ml-4 text-lg font-bold text-gray-800">
        Total: {total}
      </div>
    {/if}
  </div>
</div>

<style>
  .dice-container {
    margin-bottom: 1rem;
  }
</style>
```

**Step 4: Run tests**

Run:

```bash
npm test DiceDisplay.test.js
```

Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/lib/components/DiceDisplay.svelte src/lib/components/DiceDisplay.test.js
git commit -m "feat: add DiceDisplay component"
```

---

## Task 9: UI Components - Investment Panel

**Files:**

- Create: `src/lib/components/InvestmentPanel.svelte`
- Create: `src/lib/components/InvestmentPanel.test.js`

**Step 1: Write component test**

Create `src/lib/components/InvestmentPanel.test.js`:

```js
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import InvestmentPanel from "./InvestmentPanel.svelte";
import { getAllMeasures } from "../game/TDMeasures.js";

describe("InvestmentPanel", () => {
  const measures = getAllMeasures();

  it("should render all measures", () => {
    render(InvestmentPanel, {
      props: {
        availableMeasures: measures,
        activeMeasures: [],
        currentInvestment: null,
      },
    });

    expect(screen.getByText("Reduced Complexity")).toBeInTheDocument();
    expect(screen.getByText("Code Review")).toBeInTheDocument();
    expect(screen.getByText("Continuous Integration")).toBeInTheDocument();
    expect(screen.getByText("Increased Test Coverage")).toBeInTheDocument();
  });

  it("should show cost and duration", () => {
    render(InvestmentPanel, {
      props: {
        availableMeasures: [measures[0]],
        activeMeasures: [],
        currentInvestment: null,
      },
    });

    expect(screen.getByText(/2 NV dice for 3 turns/i)).toBeInTheDocument();
  });

  it("should disable completed measures", () => {
    render(InvestmentPanel, {
      props: {
        availableMeasures: measures,
        activeMeasures: [],
        currentInvestment: null,
        completedMeasures: ["reducedComplexity"],
      },
    });

    const buttons = screen.getAllByRole("button");
    const completedButton = buttons.find((btn) =>
      btn.textContent.includes("Reduced Complexity")
    );

    expect(completedButton).toBeDisabled();
  });

  it("should emit invest event when clicked", async () => {
    const { component } = render(InvestmentPanel, {
      props: {
        availableMeasures: [measures[0]],
        activeMeasures: [],
        currentInvestment: null,
      },
    });

    let investedId = null;
    component.$on("invest", (event) => {
      investedId = event.detail;
    });

    const button = screen.getByText("Invest");
    await fireEvent.click(button);

    expect(investedId).toBe("reducedComplexity");
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm test InvestmentPanel.test.js
```

Expected: FAIL - "Cannot find module './InvestmentPanel.svelte'"

**Step 3: Implement InvestmentPanel component**

Create `src/lib/components/InvestmentPanel.svelte`:

```svelte
<script>
  import { createEventDispatcher } from 'svelte';
  import { getAllMeasures } from '../game/TDMeasures.js';

  export let currentInvestment = null;
  export let completedMeasures = [];
  export let activeMeasures = [];

  const dispatch = createEventDispatcher();
  const measures = getAllMeasures();

  function handleInvest(measureId) {
    dispatch('invest', measureId);
  }

  function isDisabled(measureId) {
    return currentInvestment !== null || completedMeasures.includes(measureId);
  }

  function getStatusText(measure) {
    if (completedMeasures.includes(measure.id)) {
      return 'Completed';
    }
    if (currentInvestment === measure.id) {
      return 'Investing...';
    }
    return 'Available';
  }

  const colorMap = {
    blue: 'border-blue-500 bg-blue-50',
    gray: 'border-gray-500 bg-gray-50',
    green: 'border-green-500 bg-green-50',
    yellow: 'border-yellow-500 bg-yellow-50'
  };
</script>

<div class="investment-panel p-4 bg-white rounded-lg shadow-md">
  <h2 class="text-xl font-bold mb-4">TD-Reducing Measures</h2>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#each measures as measure}
      <div class="measure-card border-2 {colorMap[measure.color]} rounded-lg p-4">
        <h3 class="font-bold text-lg mb-2">{measure.name}</h3>
        <p class="text-sm text-gray-600 mb-3">{measure.description}</p>

        <div class="text-sm mb-2">
          <strong>Cost:</strong> {measure.cost} NV dice for {measure.costDuration} turns
        </div>

        <div class="text-sm mb-3">
          <strong>Commitment:</strong> {measure.commitment}
        </div>

        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold {
            completedMeasures.includes(measure.id) ? 'text-green-600' :
            currentInvestment === measure.id ? 'text-blue-600' :
            'text-gray-600'
          }">
            {getStatusText(measure)}
          </span>

          <button
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={isDisabled(measure.id)}
            on:click={() => handleInvest(measure.id)}
          >
            Invest
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>
```

**Step 4: Run tests**

Run:

```bash
npm test InvestmentPanel.test.js
```

Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/lib/components/InvestmentPanel.svelte src/lib/components/InvestmentPanel.test.js
git commit -m "feat: add InvestmentPanel component"
```

---

## Task 10: UI Components - Score Sheet

**Files:**

- Create: `src/lib/components/ScoreSheet.svelte`
- Create: `src/lib/components/ScoreSheet.test.js`

**Step 1: Write component test**

Create `src/lib/components/ScoreSheet.test.js`:

```js
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/svelte";
import ScoreSheet from "./ScoreSheet.svelte";

describe("ScoreSheet", () => {
  const mockSprints = Array.from({ length: 10 }, (_, i) => ({
    number: i + 1,
    nvDiceCount: 8,
    tdDiceCount: 4,
    nvTotal: i === 0 ? 28 : null,
    tdTotal: i === 0 ? 14 : null,
    netNewValue: i === 0 ? 14 : null,
    cumulativeValue: i === 0 ? 14 : 0,
  }));

  it("should render all 10 sprints", () => {
    render(ScoreSheet, { props: { sprints: mockSprints, currentSprint: 1 } });

    for (let i = 1; i <= 10; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument();
    }
  });

  it("should display sprint values", () => {
    render(ScoreSheet, { props: { sprints: mockSprints, currentSprint: 1 } });

    expect(screen.getByText("28")).toBeInTheDocument(); // NV Total
    expect(screen.getByText("14")).toBeInTheDocument(); // TD Total and NNV
  });

  it("should highlight current sprint", () => {
    const { container } = render(ScoreSheet, {
      props: { sprints: mockSprints, currentSprint: 3 },
    });

    const sprintCells = container.querySelectorAll('[data-sprint="3"]');
    expect(sprintCells.length).toBeGreaterThan(0);
  });

  it("should show final score", () => {
    const completedSprints = mockSprints.map((s, i) => ({
      ...s,
      cumulativeValue: (i + 1) * 10,
    }));

    render(ScoreSheet, {
      props: { sprints: completedSprints, currentSprint: 10 },
    });

    expect(screen.getByText(/Final Score/i)).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm test ScoreSheet.test.js
```

Expected: FAIL - "Cannot find module './ScoreSheet.svelte'"

**Step 3: Implement ScoreSheet component**

Create `src/lib/components/ScoreSheet.svelte`:

```svelte
<script>
  export let sprints = [];
  export let currentSprint = 1;

  $: finalScore = sprints[9]?.cumulativeValue || 0;
  $: isComplete = currentSprint === 10 && sprints[9].netNewValue !== null;
</script>

<div class="score-sheet bg-white rounded-lg shadow-md p-4 overflow-x-auto">
  <h2 class="text-xl font-bold mb-4">Scoring Sheet</h2>

  <table class="w-full border-collapse text-sm">
    <thead>
      <tr class="bg-gray-200">
        <th class="border border-gray-400 px-2 py-1">Sprint</th>
        {#each sprints as sprint}
          <th
            class="border border-gray-400 px-2 py-1 {sprint.number === currentSprint ? 'bg-blue-200' : ''}"
            data-sprint={sprint.number}
          >
            {sprint.number}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="border border-gray-400 px-2 py-1 font-semibold bg-gray-100">NV Dice</td>
        {#each sprints as sprint}
          <td class="border border-gray-400 px-2 py-1 text-center" data-sprint={sprint.number}>
            {sprint.nvDiceCount}
          </td>
        {/each}
      </tr>
      <tr>
        <td class="border border-gray-400 px-2 py-1 font-semibold bg-gray-100">TD Dice</td>
        {#each sprints as sprint}
          <td class="border border-gray-400 px-2 py-1 text-center" data-sprint={sprint.number}>
            {sprint.tdDiceCount}
          </td>
        {/each}
      </tr>
      <tr class="bg-blue-50">
        <td class="border border-gray-400 px-2 py-1 font-semibold">NV Created</td>
        {#each sprints as sprint}
          <td class="border border-gray-400 px-2 py-1 text-center" data-sprint={sprint.number}>
            {sprint.nvTotal ?? '—'}
          </td>
        {/each}
      </tr>
      <tr class="bg-red-50">
        <td class="border border-gray-400 px-2 py-1 font-semibold">TD Created</td>
        {#each sprints as sprint}
          <td class="border border-gray-400 px-2 py-1 text-center" data-sprint={sprint.number}>
            {sprint.tdTotal ?? '—'}
          </td>
        {/each}
      </tr>
      <tr class="bg-green-50">
        <td class="border border-gray-400 px-2 py-1 font-semibold">Net New Value</td>
        {#each sprints as sprint}
          <td class="border border-gray-400 px-2 py-1 text-center font-bold" data-sprint={sprint.number}>
            {sprint.netNewValue ?? '—'}
          </td>
        {/each}
      </tr>
      <tr class="bg-yellow-50">
        <td class="border border-gray-400 px-2 py-1 font-semibold">Cumulative</td>
        {#each sprints as sprint}
          <td class="border border-gray-400 px-2 py-1 text-center font-bold" data-sprint={sprint.number}>
            {sprint.cumulativeValue}
          </td>
        {/each}
      </tr>
    </tbody>
  </table>

  {#if isComplete}
    <div class="mt-4 p-4 bg-green-100 border-2 border-green-500 rounded-lg">
      <h3 class="text-2xl font-bold text-green-800">Game Complete!</h3>
      <p class="text-xl mt-2">Final Score: <span class="font-bold">{finalScore}</span></p>
    </div>
  {/if}
</div>
```

**Step 4: Run tests**

Run:

```bash
npm test ScoreSheet.test.js
```

Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/lib/components/ScoreSheet.svelte src/lib/components/ScoreSheet.test.js
git commit -m "feat: add ScoreSheet component"
```

---

## Task 11: Main Game Page

**Files:**

- Modify: `src/routes/+page.svelte`

**Step 1: Implement main game page**

Create/Replace `src/routes/+page.svelte`:

```svelte
<script>
  import { gameStore } from '../lib/stores/gameStore.js';
  import DiceDisplay from '../lib/components/DiceDisplay.svelte';
  import InvestmentPanel from '../lib/components/InvestmentPanel.svelte';
  import ScoreSheet from '../lib/components/ScoreSheet.svelte';
  import { getCurrentSprint } from '../lib/game/GameState.js';

  $: game = $gameStore;
  $: state = game.state;
  $: currentSprint = getCurrentSprint(state);
  $: hasRolledNV = currentSprint.nvRoll !== null;
  $: hasRolledTD = currentSprint.tdRoll !== null;
  $: canComplete = hasRolledNV && hasRolledTD;
  $: isGameOver = state.currentSprint === 10 && state.sprints[9].netNewValue !== null;

  function handleInvest(event) {
    gameStore.investInMeasure(event.detail);
  }

  function rollNV() {
    gameStore.rollNVDice();
  }

  function rollTD() {
    gameStore.rollTDDice();
  }

  function completeSprint() {
    if (canComplete) {
      gameStore.completeSprint();
    }
  }

  function restartGame() {
    gameStore.reset();
  }
</script>

<svelte:head>
  <title>Dice of Debt - Technical Debt Game</title>
</svelte:head>

<div class="min-h-screen bg-gray-100 p-4">
  <div class="max-w-7xl mx-auto">
    <header class="mb-6 text-center">
      <h1 class="text-4xl font-bold text-gray-800 mb-2">Dice of Debt</h1>
      <p class="text-gray-600">An Educational Game About Technical Debt</p>
      <p class="text-sm text-gray-500 mt-1">
        By Tom Grant | GameChange LLC | Agile Alliance
      </p>
    </header>

    {#if isGameOver}
      <div class="mb-6 p-6 bg-green-50 border-2 border-green-500 rounded-lg text-center">
        <h2 class="text-3xl font-bold text-green-800 mb-2">Game Complete!</h2>
        <p class="text-2xl mb-4">Final Score: <span class="font-bold">{state.sprints[9].cumulativeValue}</span></p>
        <button
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          on:click={restartGame}
        >
          Play Again
        </button>
      </div>
    {:else}
      <div class="mb-6 bg-white rounded-lg shadow-md p-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold">Sprint {state.currentSprint} of 10</h2>
            {#if state.currentInvestment}
              <p class="text-sm text-blue-600 mt-1">
                Investing in {state.currentInvestment} (Progress: {state.investmentProgress + 1}/{state.sprints[state.currentSprint - 1].investedDice || 0})
              </p>
            {/if}
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-600">NV Dice: <span class="font-bold text-blue-600">{state.nvDice}</span></p>
            <p class="text-sm text-gray-600">TD Dice: <span class="font-bold text-red-600">{state.tdDice}</span></p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow-md p-4">
          <h3 class="text-xl font-bold mb-4">New Value Dice</h3>

          {#if hasRolledNV}
            <DiceDisplay dice={currentSprint.nvRoll} color="blue" showTotal={true} />
          {:else}
            <button
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              on:click={rollNV}
            >
              Roll NV Dice ({state.nvDice} dice)
            </button>
          {/if}
        </div>

        <div class="bg-white rounded-lg shadow-md p-4">
          <h3 class="text-xl font-bold mb-4">Technical Debt Dice</h3>

          {#if hasRolledTD}
            <DiceDisplay dice={currentSprint.tdRoll} color="red" showTotal={true} />
            {#if state.activeMeasures.includes('continuousIntegration')}
              <p class="text-sm text-green-600 mt-2">✓ Can reroll TD dice (Continuous Integration)</p>
            {/if}
          {:else}
            <button
              class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
              on:click={rollTD}
              disabled={!hasRolledNV}
            >
              Roll TD Dice ({state.tdDice} dice)
            </button>
          {/if}
        </div>
      </div>

      {#if canComplete}
        <div class="mb-6 text-center">
          <button
            class="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-lg"
            on:click={completeSprint}
          >
            Complete Sprint {state.currentSprint}
          </button>
        </div>
      {/if}

      <div class="mb-6">
        <InvestmentPanel
          currentInvestment={state.currentInvestment}
          completedMeasures={state.completedMeasures}
          activeMeasures={state.activeMeasures}
          on:invest={handleInvest}
        />
      </div>
    {/if}

    <div class="mb-6">
      <ScoreSheet sprints={state.sprints} currentSprint={state.currentSprint} />
    </div>
  </div>
</div>
```

**Step 2: Test manually**

Run:

```bash
npm run dev
```

Visit http://localhost:5173 and verify:

- Game loads
- Can roll NV dice
- Can roll TD dice
- Can invest in measures
- Can complete sprints
- Score sheet updates

**Step 3: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: add main game page with all components"
```

---

## Task 12: Uncertain Outcomes Variant - Card System

**Files:**

- Create: `src/lib/game/UncertainOutcomes.js`
- Create: `src/lib/game/UncertainOutcomes.test.js`

**Step 1: Write tests for card generation**

Create `src/lib/game/UncertainOutcomes.test.js`:

```js
import { describe, it, expect, vi } from "vitest";
import {
  generateMeasureCards,
  selectRandomCard,
  createUncertainGame,
} from "./UncertainOutcomes.js";

describe("UncertainOutcomes", () => {
  describe("generateMeasureCards", () => {
    it("should generate 4 cards per measure", () => {
      const cards = generateMeasureCards("reducedComplexity");
      expect(cards).toHaveLength(4);
    });

    it("should have 2 identical cards (common outcome)", () => {
      const cards = generateMeasureCards("reducedComplexity");
      const card1 = JSON.stringify(cards[0]);
      const card2 = JSON.stringify(cards[1]);
      expect(card1).toBe(card2);
    });

    it("should include varied costs and benefits", () => {
      const cards = generateMeasureCards("reducedComplexity");
      const costs = cards.map((c) => c.cost);
      const uniqueCosts = new Set(costs);
      expect(uniqueCosts.size).toBeGreaterThan(1);
    });
  });

  describe("selectRandomCard", () => {
    it("should select one card from the set", () => {
      const cards = generateMeasureCards("codeReview");
      const selected = selectRandomCard(cards);

      expect(selected).toBeDefined();
      expect(cards).toContainEqual(selected);
    });

    it("should use randomness", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.75);
      const cards = generateMeasureCards("codeReview");
      const selected = selectRandomCard(cards);

      expect(selected).toEqual(cards[3]);
      vi.restoreAllMocks();
    });
  });

  describe("createUncertainGame", () => {
    it("should create game with selected cards", () => {
      const game = createUncertainGame();

      expect(game.uncertainMode).toBe(true);
      expect(game.selectedCards).toBeDefined();
      expect(Object.keys(game.selectedCards)).toHaveLength(4);
    });

    it("should not reveal cards initially", () => {
      const game = createUncertainGame();

      expect(game.revealedCards).toEqual([]);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm test UncertainOutcomes.test.js
```

Expected: FAIL - "Cannot find module './UncertainOutcomes.js'"

**Step 3: Implement Uncertain Outcomes system**

Create `src/lib/game/UncertainOutcomes.js`:

```js
/**
 * Uncertain Outcomes Variant
 * Each TD-reducing measure has 4 possible cost/benefit cards
 * Players select cards randomly before the game starts
 */

const CARD_VARIANTS = {
  reducedComplexity: [
    { cost: 2, costDuration: 3, benefitType: "moveDice", benefitValue: 2 }, // Standard (2x)
    { cost: 2, costDuration: 3, benefitType: "moveDice", benefitValue: 2 },
    { cost: 4, costDuration: 2, benefitType: "moveDice", benefitValue: 3 }, // High cost, high benefit
    { cost: 3, costDuration: 3, benefitType: "moveDice", benefitValue: 2 }, // Medium variation
  ],
  codeReview: [
    { cost: 3, costDuration: 2, benefitType: "moveDice", benefitValue: 1 }, // Standard (2x)
    { cost: 3, costDuration: 2, benefitType: "moveDice", benefitValue: 1 },
    { cost: 2, costDuration: 2, benefitType: "moveDice", benefitValue: 1 }, // Lower cost
    { cost: 1, costDuration: 2, benefitType: "moveDice", benefitValue: 1 }, // Lowest cost
  ],
  continuousIntegration: [
    { cost: 1, costDuration: 2, benefitType: "reroll", benefitValue: 1 }, // Standard (2x)
    { cost: 1, costDuration: 2, benefitType: "reroll", benefitValue: 1 },
    { cost: 1, costDuration: 3, benefitType: "reroll", benefitValue: 2 }, // More rerolls, longer investment
    { cost: 1, costDuration: 3, benefitType: "moveDice", benefitValue: 1 }, // Different benefit
  ],
  increasedTestCoverage: [
    {
      cost: 1,
      costDuration: 3,
      benefitType: "subtractFromTD",
      benefitValue: 3,
    }, // Standard (2x)
    {
      cost: 1,
      costDuration: 3,
      benefitType: "subtractFromTD",
      benefitValue: 3,
    },
    { cost: 3, costDuration: 2, benefitType: "reroll", benefitValue: 2 }, // High cost, different benefit
    {
      cost: 2,
      costDuration: 2,
      benefitType: "subtractFromTD",
      benefitValue: 2,
    }, // Medium
  ],
};

/**
 * Generate all card variants for a measure
 * @param {string} measureId
 * @returns {object[]} Array of 4 card variants
 */
export function generateMeasureCards(measureId) {
  return CARD_VARIANTS[measureId] || [];
}

/**
 * Select a random card from a set
 * @param {object[]} cards
 * @returns {object} Selected card
 */
export function selectRandomCard(cards) {
  const index = Math.floor(Math.random() * cards.length);
  return cards[index];
}

/**
 * Create a game with Uncertain Outcomes variant
 * @returns {object} Game with selected cards
 */
export function createUncertainGame() {
  const measureIds = [
    "reducedComplexity",
    "codeReview",
    "continuousIntegration",
    "increasedTestCoverage",
  ];

  const selectedCards = {};
  measureIds.forEach((measureId) => {
    const cards = generateMeasureCards(measureId);
    selectedCards[measureId] = selectRandomCard(cards);
  });

  return {
    uncertainMode: true,
    selectedCards,
    revealedCards: [],
  };
}

/**
 * Reveal a card when measure is invested in
 * @param {object} game
 * @param {string} measureId
 * @returns {object} Card details
 */
export function revealCard(game, measureId) {
  if (!game.uncertainMode) {
    return null;
  }

  return game.selectedCards[measureId];
}
```

**Step 4: Run tests**

Run:

```bash
npm test UncertainOutcomes.test.js
```

Expected: PASS (7 tests)

**Step 5: Commit**

```bash
git add src/lib/game/UncertainOutcomes.js src/lib/game/UncertainOutcomes.test.js
git commit -m "feat: add Uncertain Outcomes variant with card system"
```

---

## Task 13: Integration - Add Variant Toggle

**Files:**

- Modify: `src/lib/stores/gameStore.js`
- Modify: `src/routes/+page.svelte`
- Create: `src/lib/components/GameSetup.svelte`

**Step 1: Update game store to support variants**

Modify `src/lib/stores/gameStore.js`:

```js
import { writable } from "svelte/store";
import {
  createGame,
  investInMeasure,
  rollNVDice,
  rollTDDice,
  rerollTDDice,
  completeSprint,
} from "../game/GameController.js";
import { createUncertainGame } from "../game/UncertainOutcomes.js";

function createGameStore() {
  const { subscribe, set, update } = writable(createGame());

  return {
    subscribe,

    startNew: (useUncertainMode = false) => {
      const game = createGame();
      if (useUncertainMode) {
        const uncertainData = createUncertainGame();
        game.uncertainMode = true;
        game.selectedCards = uncertainData.selectedCards;
        game.revealedCards = [];
      }
      set(game);
    },

    investInMeasure: (measureId) =>
      update((game) => investInMeasure(game, measureId)),

    rollNVDice: () => update((game) => rollNVDice(game)),

    rollTDDice: () => update((game) => rollTDDice(game)),

    rerollTDDice: (indices) => update((game) => rerollTDDice(game, indices)),

    completeSprint: () => update((game) => completeSprint(game)),

    reset: (useUncertainMode = false) => {
      const game = createGame();
      if (useUncertainMode) {
        const uncertainData = createUncertainGame();
        game.uncertainMode = true;
        game.selectedCards = uncertainData.selectedCards;
        game.revealedCards = [];
      }
      set(game);
    },
  };
}

export const gameStore = createGameStore();

// Action helpers
export const startNewGame = (useUncertainMode = false) =>
  gameStore.startNew(useUncertainMode);
export const investInMeasureAction = (measureId) =>
  gameStore.investInMeasure(measureId);
export const rollNVDiceAction = () => gameStore.rollNVDice();
export const rollTDDiceAction = () => gameStore.rollTDDice();
export const rerollTDDiceAction = (indices) => gameStore.rerollTDDice(indices);
export const completeSprintAction = () => gameStore.completeSprint();
```

**Step 2: Create game setup component**

Create `src/lib/components/GameSetup.svelte`:

```svelte
<script>
  import { createEventDispatcher } from 'svelte';

  export let uncertainMode = false;

  const dispatch = createEventDispatcher();

  function startGame() {
    dispatch('start', { uncertainMode });
  }
</script>

<div class="game-setup bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
  <h2 class="text-2xl font-bold mb-4">Game Setup</h2>

  <div class="mb-6">
    <h3 class="font-semibold mb-2">Game Mode</h3>
    <label class="flex items-center space-x-3 cursor-pointer">
      <input type="radio" bind:group={uncertainMode} value={false} class="w-4 h-4" />
      <div>
        <div class="font-semibold">Standard Mode</div>
        <div class="text-sm text-gray-600">Fixed costs and benefits for all TD-reducing measures</div>
      </div>
    </label>

    <label class="flex items-center space-x-3 cursor-pointer mt-3">
      <input type="radio" bind:group={uncertainMode} value={true} class="w-4 h-4" />
      <div>
        <div class="font-semibold">Uncertain Outcomes Variant</div>
        <div class="text-sm text-gray-600">Randomized costs and benefits - discover them as you invest</div>
      </div>
    </label>
  </div>

  <button
    class="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
    on:click={startGame}
  >
    Start Game
  </button>
</div>
```

**Step 3: Add setup to main page**

Modify `src/routes/+page.svelte` - add at top of script:

```svelte
<script>
  import { gameStore } from '../lib/stores/gameStore.js';
  import DiceDisplay from '../lib/components/DiceDisplay.svelte';
  import InvestmentPanel from '../lib/components/InvestmentPanel.svelte';
  import ScoreSheet from '../lib/components/ScoreSheet.svelte';
  import GameSetup from '../lib/components/GameSetup.svelte';
  import { getCurrentSprint } from '../lib/game/GameState.js';

  let showSetup = true;
  let uncertainMode = false;

  $: game = $gameStore;
  $: state = game.state;
  $: currentSprint = getCurrentSprint(state);
  $: hasRolledNV = currentSprint.nvRoll !== null;
  $: hasRolledTD = currentSprint.tdRoll !== null;
  $: canComplete = hasRolledNV && hasRolledTD;
  $: isGameOver = state.currentSprint === 10 && state.sprints[9].netNewValue !== null;

  function handleGameStart(event) {
    uncertainMode = event.detail.uncertainMode;
    gameStore.startNew(uncertainMode);
    showSetup = false;
  }

  function handleInvest(event) {
    gameStore.investInMeasure(event.detail);
  }

  function rollNV() {
    gameStore.rollNVDice();
  }

  function rollTD() {
    gameStore.rollTDDice();
  }

  function completeSprint() {
    if (canComplete) {
      gameStore.completeSprint();
    }
  }

  function restartGame() {
    showSetup = true;
  }
</script>
```

And update the template to show setup:

```svelte
<div class="min-h-screen bg-gray-100 p-4">
  <div class="max-w-7xl mx-auto">
    <header class="mb-6 text-center">
      <h1 class="text-4xl font-bold text-gray-800 mb-2">Dice of Debt</h1>
      <p class="text-gray-600">An Educational Game About Technical Debt</p>
      <p class="text-sm text-gray-500 mt-1">
        By Tom Grant | GameChange LLC | Agile Alliance
      </p>
    </header>

    {#if showSetup}
      <GameSetup on:start={handleGameStart} />
    {:else}
      <!-- Rest of game UI -->
      {#if isGameOver}
        <!-- Game over section -->
      {:else}
        <!-- Active game section -->
      {/if}
    {/if}
  </div>
</div>
```

**Step 4: Test manually**

Run:

```bash
npm run dev
```

Verify:

- Game setup screen shows
- Can select standard or uncertain mode
- Game starts with selected mode

**Step 5: Commit**

```bash
git add src/lib/stores/gameStore.js src/lib/components/GameSetup.svelte src/routes/+page.svelte
git commit -m "feat: add game setup with variant selection"
```

---

## Task 14: Final Testing & Documentation

**Files:**

- Create: `README.md`
- Create: `.gitignore`

**Step 1: Run all tests**

Run:

```bash
npm test
```

Expected: All tests pass

**Step 2: Create README**

Create `README.md`:

````markdown
# Dice of Debt - Web Version

A web-based implementation of the Dice of Debt game by Tom Grant (GameChange LLC) for the Agile Alliance.

## About the Game

Dice of Debt is an educational game about technical debt in software development. Players work as a software development team over 10 sprints, balancing creating new value against managing technical debt.

## Features

- **Standard Game Mode**: Classic rules with fixed costs and benefits
- **Uncertain Outcomes Variant**: Randomized measure effectiveness for added realism
- **Interactive Score Sheet**: Track progress across all 10 sprints
- **Visual Dice Rolling**: See your NV and TD dice results
- **Investment Management**: Decide when to invest in TD-reducing measures

## Getting Started

### Installation

```bash
npm install
```
````

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

1. Choose your game mode (Standard or Uncertain Outcomes)
2. Each sprint:
   - Optionally invest in a TD-reducing measure
   - Roll New Value (NV) dice
   - Roll Technical Debt (TD) dice
   - Complete the sprint to calculate Net New Value
3. Continue for 10 sprints
4. Your final score is the cumulative value created

## TD-Reducing Measures

- **Reduced Complexity**: Move dice from TD to NV pool
- **Code Review**: Move dice from TD to NV pool
- **Continuous Integration**: Reroll TD dice
- **Increased Test Coverage**: Subtract from TD total

## Credits

- **Original Game**: Tom Grant, GameChange LLC
- **Publisher**: Agile Alliance
- **Web Implementation**: [Your Name]

## License

This is an educational implementation of the Dice of Debt game. Original game materials © 2015 GameChange LLC.

```

**Step 3: Create .gitignore**

Create `.gitignore`:
```

# Dependencies

node_modules/

# Build output

.svelte-kit/
build/
dist/

# Environment

.env
.env.local
.env.\*.local

# IDE

.vscode/
.idea/
_.swp
_.swo

# OS

.DS_Store
Thumbs.db

# Testing

coverage/

# Logs

_.log
npm-debug.log_

````

**Step 4: Final manual test**

Run through complete game:
1. Start new game (both modes)
2. Invest in all 4 measures across different games
3. Complete all 10 sprints
4. Verify scoring is correct
5. Test restart

**Step 5: Commit**

```bash
git add README.md .gitignore
git commit -m "docs: add README and gitignore"
````

---

## Summary

This plan implements a complete web version of the Dice of Debt game with:

✅ **Core Game Logic** (TDD)

- Dice rolling mechanics
- Game state management
- Investment lifecycle
- Sprint tracking

✅ **UI Components** (Svelte)

- Dice display
- Investment panel
- Score sheet
- Game setup

✅ **Features**

- Standard game mode
- Uncertain Outcomes variant
- Full 10-sprint gameplay
- Responsive design

✅ **Testing**

- Unit tests for all game logic
- Component tests
- 40+ tests total

**Next Steps After Implementation:**

1. Deploy to hosting (Vercel, Netlify, etc.)
2. Add tracking chart visualization (optional)
3. Add accessibility features
4. Mobile optimization
5. Add save/load functionality (localStorage)
6. Add game statistics/analytics

**Estimated Implementation Time:** 6-8 hours following this plan task-by-task
