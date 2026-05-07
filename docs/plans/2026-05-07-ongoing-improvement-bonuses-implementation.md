# Ongoing Improvement Bonuses Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up the `ongoingBonus` field on `IMPROVEMENTS` so completing Pair Programming or TDD produces a context-dependent, time-evolving effect on subsequent feature delivery.

**Architecture:** Two new pure functions in `BusinessRules.js` (`getBonusStrength`, `updateBonusMaturity`) and modified signatures on `calculateBugProbability` and `calculateFeatureDelivery`. State changes in `gameStore.js` to track active bonuses, populate them on improvement completion, and update them at end of week. UI surfaced in `GameHeader.svelte`.

**Tech Stack:** SvelteKit, Vitest, Tailwind CSS v4. Pure JavaScript with JSDoc.

**Spec:** `docs/plans/2026-05-07-ongoing-improvement-bonuses-design.md`

---

## File Map

- `src/lib/simulation/BusinessRules.js` — add two pure functions, modify two existing functions
- `src/lib/simulation/BusinessRules.test.js` — add unit tests for new and modified functions
- `src/lib/stores/gameStore.js` — initialise `activeBonuses`, populate on completion, update at end of week, thread bonuses into delivery calc
- `src/lib/stores/gameStore.test.js` — add lifecycle tests
- `src/lib/components/simulation/GameHeader.svelte` — render active bonus list
- `src/routes/+page.svelte` — pass `activeBonuses` prop to `GameHeader`

---

## Task 1: Add `getBonusStrength` pure function

**Files:**
- Modify: `src/lib/simulation/BusinessRules.js`
- Modify: `src/lib/simulation/BusinessRules.test.js`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/simulation/BusinessRules.test.js` after the existing `describe` blocks:

```javascript
describe('BusinessRules - getBonusStrength', () => {
  it('returns 0 when no bonus of the given type is active', () => {
    expect(getBonusStrength([], 'reduceBugProbability', { codeHealth: 50 })).toBe(0);
    expect(getBonusStrength(
      [{ type: 'reduceFeatureImpact', maturity: 1.0 }],
      'reduceBugProbability',
      { codeHealth: 50 }
    )).toBe(0);
  });

  it('returns context-appropriate reduction for reduceBugProbability at full maturity', () => {
    const bonus = [{ type: 'reduceBugProbability', maturity: 1.0 }];
    expect(getBonusStrength(bonus, 'reduceBugProbability', { codeHealth: 80 })).toBe(0.20);
    expect(getBonusStrength(bonus, 'reduceBugProbability', { codeHealth: 50 })).toBe(0.20);
    expect(getBonusStrength(bonus, 'reduceBugProbability', { codeHealth: 49 })).toBe(0.50);
    expect(getBonusStrength(bonus, 'reduceBugProbability', { codeHealth: 0 })).toBe(0.50);
    expect(getBonusStrength(bonus, 'reduceBugProbability', { codeHealth: -1 })).toBe(0.70);
    expect(getBonusStrength(bonus, 'reduceBugProbability', { codeHealth: -50 })).toBe(0.70);
  });

  it('returns context-appropriate reduction for reduceFeatureImpact at full maturity', () => {
    const bonus = [{ type: 'reduceFeatureImpact', maturity: 1.0 }];
    expect(getBonusStrength(bonus, 'reduceFeatureImpact', { complexity: 'low' })).toBe(0.10);
    expect(getBonusStrength(bonus, 'reduceFeatureImpact', { complexity: 'medium' })).toBe(0.30);
    expect(getBonusStrength(bonus, 'reduceFeatureImpact', { complexity: 'high' })).toBe(0.50);
  });

  it('scales reduction by maturity', () => {
    const halfBonus = [{ type: 'reduceBugProbability', maturity: 0.5 }];
    expect(getBonusStrength(halfBonus, 'reduceBugProbability', { codeHealth: 0 })).toBe(0.25);

    const partialBonus = [{ type: 'reduceFeatureImpact', maturity: 0.3 }];
    expect(getBonusStrength(partialBonus, 'reduceFeatureImpact', { complexity: 'high' }))
      .toBeCloseTo(0.15, 5);
  });
});
```

Update the import at the top of the file to include `getBonusStrength`:

```javascript
import {
  calculateFeatureDelivery,
  calculateBugProbability,
  applyFeatureOutcome,
  calculateImprovementOutcome,
  applyImprovementOutcome,
  getBonusStrength,
  IMPROVEMENTS
} from './BusinessRules.js';
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- BusinessRules.test.js`
Expected: All four new tests fail with "getBonusStrength is not a function" or similar.

- [ ] **Step 3: Implement `getBonusStrength`**

Append to `src/lib/simulation/BusinessRules.js` after the `calculateBugProbability` function (around line 54):

```javascript
/**
 * Look up the strength of an active ongoing bonus, scaled by its current maturity.
 * @param {Array<object>} activeBonuses - Active bonuses from game state
 * @param {string} type - Bonus type (e.g., 'reduceBugProbability')
 * @param {object} context - Context for magnitude lookup. For 'reduceBugProbability',
 *   include `codeHealth`. For 'reduceFeatureImpact', include `complexity`.
 * @returns {number} Reduction strength from 0.0 to 1.0
 */
export function getBonusStrength(activeBonuses, type, context) {
  const bonus = activeBonuses.find(b => b.type === type);
  if (!bonus) return 0;

  let baseReduction = 0;
  if (type === 'reduceBugProbability') {
    if (context.codeHealth >= 50) baseReduction = 0.20;
    else if (context.codeHealth >= 0) baseReduction = 0.50;
    else baseReduction = 0.70;
  } else if (type === 'reduceFeatureImpact') {
    if (context.complexity === 'low') baseReduction = 0.10;
    else if (context.complexity === 'medium') baseReduction = 0.30;
    else if (context.complexity === 'high') baseReduction = 0.50;
  }

  return baseReduction * bonus.maturity;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- BusinessRules.test.js`
Expected: All tests pass, including the original BusinessRules tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/simulation/BusinessRules.js src/lib/simulation/BusinessRules.test.js
git commit -m "feat: add getBonusStrength for context-scaled bonus lookup

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Add `updateBonusMaturity` pure function

**Files:**
- Modify: `src/lib/simulation/BusinessRules.js`
- Modify: `src/lib/simulation/BusinessRules.test.js`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/simulation/BusinessRules.test.js`:

```javascript
describe('BusinessRules - updateBonusMaturity', () => {
  const stableMetrics = { codeHealth: 50 };
  const crisisMetrics = { codeHealth: -10 };

  it('ramps maturity by 0.175 under stable conditions', () => {
    const bonuses = [{ type: 'reduceBugProbability', sourceImprovement: 'adoptTDD', maturity: 0.3, completedWeek: 5 }];
    const result = updateBonusMaturity(bonuses, stableMetrics, 2);
    expect(result[0].maturity).toBeCloseTo(0.475, 5);
  });

  it('caps maturity at 1.0', () => {
    const bonuses = [{ type: 'reduceBugProbability', maturity: 0.95, completedWeek: 1 }];
    const result = updateBonusMaturity(bonuses, stableMetrics, 2);
    expect(result[0].maturity).toBe(1.0);
  });

  it('decays by 0.20 under WIP stress only', () => {
    const bonuses = [{ type: 'reduceBugProbability', maturity: 0.8, completedWeek: 1 }];
    const result = updateBonusMaturity(bonuses, stableMetrics, 4);
    expect(result[0].maturity).toBeCloseTo(0.60, 5);
  });

  it('decays by 0.20 under crisis code only', () => {
    const bonuses = [{ type: 'reduceBugProbability', maturity: 0.8, completedWeek: 1 }];
    const result = updateBonusMaturity(bonuses, crisisMetrics, 2);
    expect(result[0].maturity).toBeCloseTo(0.60, 5);
  });

  it('decays by 0.30 under both stress signals', () => {
    const bonuses = [{ type: 'reduceBugProbability', maturity: 0.8, completedWeek: 1 }];
    const result = updateBonusMaturity(bonuses, crisisMetrics, 4);
    expect(result[0].maturity).toBeCloseTo(0.50, 5);
  });

  it('floors maturity at 0', () => {
    const bonuses = [{ type: 'reduceBugProbability', maturity: 0.1, completedWeek: 1 }];
    const result = updateBonusMaturity(bonuses, crisisMetrics, 4);
    expect(result[0].maturity).toBe(0);
  });

  it('preserves all other bonus fields', () => {
    const bonuses = [{ type: 'reduceBugProbability', sourceImprovement: 'adoptTDD', maturity: 0.5, completedWeek: 3 }];
    const result = updateBonusMaturity(bonuses, stableMetrics, 2);
    expect(result[0].type).toBe('reduceBugProbability');
    expect(result[0].sourceImprovement).toBe('adoptTDD');
    expect(result[0].completedWeek).toBe(3);
  });

  it('returns a new array without mutating the input', () => {
    const bonuses = [{ type: 'reduceBugProbability', maturity: 0.5, completedWeek: 3 }];
    const result = updateBonusMaturity(bonuses, stableMetrics, 2);
    expect(result).not.toBe(bonuses);
    expect(bonuses[0].maturity).toBe(0.5);
  });

  it('updates multiple bonuses independently', () => {
    const bonuses = [
      { type: 'reduceBugProbability', maturity: 0.5, completedWeek: 3 },
      { type: 'reduceFeatureImpact', maturity: 0.8, completedWeek: 1 }
    ];
    const result = updateBonusMaturity(bonuses, stableMetrics, 2);
    expect(result[0].maturity).toBeCloseTo(0.675, 5);
    expect(result[1].maturity).toBeCloseTo(0.975, 5);
  });
});
```

Update the test file imports to include `updateBonusMaturity`:

```javascript
import {
  calculateFeatureDelivery,
  calculateBugProbability,
  applyFeatureOutcome,
  calculateImprovementOutcome,
  applyImprovementOutcome,
  getBonusStrength,
  updateBonusMaturity,
  IMPROVEMENTS
} from './BusinessRules.js';
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- BusinessRules.test.js`
Expected: New tests fail with "updateBonusMaturity is not a function".

- [ ] **Step 3: Implement `updateBonusMaturity`**

Append to `src/lib/simulation/BusinessRules.js` after `getBonusStrength`:

```javascript
/**
 * Advance every active bonus by one week's ramp or decay, based on stress signals.
 * @param {Array<object>} activeBonuses - Active bonuses from game state
 * @param {object} metrics - Current metrics, must include codeHealth
 * @param {number} allocatedItemCount - Number of items in capacityAllocation
 * @returns {Array<object>} New array of bonuses with updated maturity
 */
export function updateBonusMaturity(activeBonuses, metrics, allocatedItemCount) {
  const wipStress = allocatedItemCount >= 4;
  const crisisStress = metrics.codeHealth < 0;

  let delta;
  if (wipStress && crisisStress) delta = -0.30;
  else if (wipStress || crisisStress) delta = -0.20;
  else delta = 0.175;

  return activeBonuses.map(bonus => ({
    ...bonus,
    maturity: Math.max(0, Math.min(1.0, bonus.maturity + delta))
  }));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- BusinessRules.test.js`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/simulation/BusinessRules.js src/lib/simulation/BusinessRules.test.js
git commit -m "feat: add updateBonusMaturity for ramp and decay over time

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Modify `calculateBugProbability` to apply TDD reduction

**Files:**
- Modify: `src/lib/simulation/BusinessRules.js`
- Modify: `src/lib/simulation/BusinessRules.test.js`

- [ ] **Step 1: Write the failing test**

Append to `src/lib/simulation/BusinessRules.test.js`:

```javascript
describe('BusinessRules - calculateBugProbability with TDD bonus', () => {
  it('returns the same probability when no bonus is active', () => {
    expect(calculateBugProbability(0)).toBe(0.7);
    expect(calculateBugProbability(0, [])).toBe(0.7);
  });

  it('reduces bug probability when reduceBugProbability is at full maturity', () => {
    // codeHealth 0 -> base 0.7, 50% reduction -> 0.35
    const bonus = [{ type: 'reduceBugProbability', maturity: 1.0 }];
    expect(calculateBugProbability(0, bonus)).toBeCloseTo(0.35, 5);
  });

  it('applies the largest reduction in crisis code', () => {
    // codeHealth -20 -> base 0.82, 70% reduction -> 0.246
    const bonus = [{ type: 'reduceBugProbability', maturity: 1.0 }];
    expect(calculateBugProbability(-20, bonus)).toBeCloseTo(0.246, 3);
  });

  it('scales the reduction by maturity', () => {
    // codeHealth 0 -> base 0.7, 50% reduction at half maturity = 25% reduction -> 0.525
    const bonus = [{ type: 'reduceBugProbability', maturity: 0.5 }];
    expect(calculateBugProbability(0, bonus)).toBeCloseTo(0.525, 5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- BusinessRules.test.js`
Expected: The new tests using a second argument fail because `calculateBugProbability` ignores it. The first test (no bonus) passes.

- [ ] **Step 3: Modify `calculateBugProbability`**

Replace the existing `calculateBugProbability` function in `src/lib/simulation/BusinessRules.js` with:

```javascript
/**
 * Calculate probability of bugs based on code health, with optional bonus reduction.
 * @param {number} codeHealth - Current code health (-100 to 100)
 * @param {Array<object>} [activeBonuses] - Active bonuses; reduceBugProbability lowers the result
 * @returns {number} Bug probability (0.0 to 1.0)
 */
export function calculateBugProbability(codeHealth, activeBonuses = []) {
  let baseProbability;
  if (codeHealth >= 100) baseProbability = 0;
  else if (codeHealth >= 80) baseProbability = 0.1;
  else if (codeHealth >= 50) baseProbability = Math.round((0.1 + (80 - codeHealth) * 0.0067) * 100) / 100;
  else if (codeHealth >= 0) baseProbability = Math.round((0.3 + (50 - codeHealth) * 0.008) * 100) / 100;
  else baseProbability = Math.min(1.0, Math.round((0.7 + Math.abs(codeHealth) * 0.006) * 100) / 100);

  const reduction = getBonusStrength(activeBonuses, 'reduceBugProbability', { codeHealth });
  return baseProbability * (1 - reduction);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- BusinessRules.test.js`
Expected: All tests pass, including the original calculateBugProbability tests (which don't pass a second argument and rely on the default `[]`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/simulation/BusinessRules.js src/lib/simulation/BusinessRules.test.js
git commit -m "feat: apply TDD bonus reduction in calculateBugProbability

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Modify `calculateFeatureDelivery` to apply Pair Programming reduction

**Files:**
- Modify: `src/lib/simulation/BusinessRules.js`
- Modify: `src/lib/simulation/BusinessRules.test.js`

- [ ] **Step 1: Write the failing test**

Append to `src/lib/simulation/BusinessRules.test.js`:

```javascript
describe('BusinessRules - calculateFeatureDelivery with PP bonus', () => {
  it('reduces codeHealthDelta when reduceFeatureImpact is active on a high-complexity feature', () => {
    const feature = { value: 50, complexity: 'high', deadline: 3 };
    const bonus = [{ type: 'reduceFeatureImpact', maturity: 1.0 }];

    // Without bonus: -5 * 1.5 * (1 + 0) = -7.5 -> -8 (rounded)
    // With 50% reduction at full maturity: -7.5 * 0.5 = -3.75 -> -4 (rounded)
    const withoutBonus = calculateFeatureDelivery(feature, 100, 50);
    expect(withoutBonus.codeHealthDelta).toBe(-8);

    const withBonus = calculateFeatureDelivery(feature, 100, 50, bonus);
    expect(withBonus.codeHealthDelta).toBe(-4);
  });

  it('barely reduces codeHealthDelta on a low-complexity feature', () => {
    const feature = { value: 50, complexity: 'low', deadline: 3 };
    const bonus = [{ type: 'reduceFeatureImpact', maturity: 1.0 }];

    // Without bonus: -5 * 0.5 * (1 + 0) = -2.5 -> -3 (rounded)
    // With 10% reduction: -2.5 * 0.9 = -2.25 -> -2 (rounded)
    const withBonus = calculateFeatureDelivery(feature, 100, 50, bonus);
    expect(withBonus.codeHealthDelta).toBe(-2);
  });

  it('preserves existing behaviour when no bonus is provided', () => {
    const feature = { value: 50, complexity: 'medium', deadline: 3 };
    const result = calculateFeatureDelivery(feature, 100, 50);
    // Without bonus: -5 * 1.0 * (1 + 0) = -5
    expect(result.codeHealthDelta).toBe(-5);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- BusinessRules.test.js`
Expected: New tests asserting reduced `codeHealthDelta` fail because the function ignores `activeBonuses`.

- [ ] **Step 3: Modify `calculateFeatureDelivery`**

Replace the existing `calculateFeatureDelivery` function in `src/lib/simulation/BusinessRules.js` with:

```javascript
/**
 * Calculate the outcome of delivering a feature.
 * @param {object} feature - Feature to deliver
 * @param {number} capacity - Team capacity
 * @param {number} codeHealth - Current code health
 * @param {Array<object>} [activeBonuses] - Active bonuses from game state
 * @returns {object} Delivery outcome
 */
export function calculateFeatureDelivery(feature, capacity, codeHealth, activeBonuses = []) {
  const baseValue = feature.value;
  const complexityFactors = { low: 0.5, medium: 1.0, high: 1.5 };
  const complexityFactor = complexityFactors[feature.complexity] || 1.0;

  const capacityRatio = capacity / 100;
  const effectiveCapacity = Math.max(0.3, capacityRatio);

  const healthPenalty = codeHealth < 50 ? (50 - codeHealth) * 0.01 : 0;
  const deliveryEfficiency = Math.max(0.5, 1 - healthPenalty);

  const marketVariability = 0.8 + (Math.random() * 0.4);

  const valueDelivered = Math.round(baseValue * effectiveCapacity * deliveryEfficiency * marketVariability);
  const hasBugs = Math.random() < calculateBugProbability(codeHealth, activeBonuses);
  const weeksRequired = 1;

  const satisfactionDelta = hasBugs ? 0 : Math.min(5, Math.round(baseValue / 10));

  const ppReduction = getBonusStrength(activeBonuses, 'reduceFeatureImpact', { complexity: feature.complexity });
  const baseCodeHealthDelta = -5 * complexityFactor * (1 + healthPenalty);
  const codeHealthDelta = Math.round(baseCodeHealthDelta * (1 - ppReduction));

  return {
    valueDelivered,
    hasBugs,
    weeksRequired,
    satisfactionDelta,
    codeHealthDelta
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- BusinessRules.test.js`
Expected: All tests pass, including the original `calculateFeatureDelivery` tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/simulation/BusinessRules.js src/lib/simulation/BusinessRules.test.js
git commit -m "feat: apply PP bonus reduction in calculateFeatureDelivery

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Initialise `activeBonuses` on new game

**Files:**
- Modify: `src/lib/stores/gameStore.js`
- Modify: `src/lib/stores/gameStore.test.js`

- [ ] **Step 1: Write the failing test**

Append to `src/lib/stores/gameStore.test.js` inside an appropriate describe block (or add a new one):

```javascript
describe('gameStore - activeBonuses lifecycle', () => {
  it('initialises activeBonuses to an empty array on new game', () => {
    startNewGame('startup');
    const state = get(gameStore);
    expect(state.activeBonuses).toEqual([]);
  });
});
```

If `get`, `gameStore`, and `startNewGame` are not already imported in the test file, add them.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- gameStore.test.js`
Expected: New test fails because `activeBonuses` is `undefined` on the initial state.

- [ ] **Step 3: Add `activeBonuses` to initial state**

In `src/lib/stores/gameStore.js`, find the `startNew` action (around line 16) and add `activeBonuses: []` to the `initialState` object:

```javascript
const initialState = {
  scenario: scenarioId,
  week: 1,
  metrics,
  opportunities: generateOpportunities(scenarioId, 1, metrics, [], []),
  workInProgress: [],
  capacityAllocation: {},
  history: {
    events: [],
    decisions: [],
    weeklyMetrics: []
  },
  activeBonuses: [],
  victoryConditions: scenario.victoryConditions,
  gameOver: false,
  victory: false
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- gameStore.test.js`
Expected: Test passes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stores/gameStore.js src/lib/stores/gameStore.test.js
git commit -m "feat: initialise activeBonuses array on new game

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Populate `activeBonuses` when an improvement with `ongoingBonus` completes

**Files:**
- Modify: `src/lib/stores/gameStore.js`
- Modify: `src/lib/stores/gameStore.test.js`

- [ ] **Step 1: Write the failing test**

Append to `gameStore.test.js`:

```javascript
it('adds an active bonus when an improvement with ongoingBonus completes', () => {
  // codeReviews has weeks: 2, so pointsNeeded = 80. Allocating 100 with no other WIP
  // completes it in a single endWeek (effectivePoints = 100 * 1.0 efficiency = 100 >= 80).
  startNewGame('startup');
  startImprovement('codeReviews');
  allocateCapacity({ codeReviews: 100 });
  endWeek();

  const state = get(gameStore);
  const bonus = state.activeBonuses.find(b => b.type === 'reduceFeatureImpact');
  expect(bonus).toBeDefined();
  expect(bonus.sourceImprovement).toBe('codeReviews');
  expect(bonus.maturity).toBe(0.3); // Will be updated to 0.475 in Task 7 once maturity update is wired
});

it('does not add a bonus when an improvement without ongoingBonus completes', () => {
  startNewGame('startup');
  startImprovement('fixBugs'); // 1-week, no ongoingBonus
  allocateCapacity({ fixBugs: 100 });
  endWeek();

  const state = get(gameStore);
  expect(state.activeBonuses).toEqual([]);
});
```

If any of `startImprovement`, `allocateCapacity`, `endWeek` are not already imported, add them. Verify the relevant `IMPROVEMENTS` keys (`codeReviews`, `fixBugs`) match those in `BusinessRules.js`.

Note: The Pair Programming completion test starts the improvement at maturity 0.3 because `updateBonusMaturity` is not yet wired into the store (Task 7). At that point this test's expected maturity will need to update — keep it at 0.3 for now and re-run after Task 7.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- gameStore.test.js`
Expected: First test fails — `state.activeBonuses` is empty after the improvement completes.

- [ ] **Step 3: Append bonus on completion**

In `src/lib/stores/gameStore.js`, find the `endWeek` action where completed improvement items are processed (around line 148-156). Modify the improvement branch:

Replace:
```javascript
} else if (item.type === 'improvement') {
  const outcome = calculateImprovementOutcome(item, newMetrics.capacity);
  newMetrics = applyImprovementOutcome(newMetrics, outcome);
  newDecisions.push({
    type: 'improvement',
    week: newWeek,
    improvement: item,
    outcome
  });
}
```

With:
```javascript
} else if (item.type === 'improvement') {
  const outcome = calculateImprovementOutcome(item, newMetrics.capacity);
  newMetrics = applyImprovementOutcome(newMetrics, outcome);
  newDecisions.push({
    type: 'improvement',
    week: newWeek,
    improvement: item,
    outcome
  });
  if (item.ongoingBonus) {
    newActiveBonuses.push({
      type: item.ongoingBonus,
      sourceImprovement: item.id,
      maturity: 0.3,
      completedWeek: newWeek
    });
  }
}
```

Earlier in `endWeek`, before the WIP loop, declare `newActiveBonuses`:

After the line `let newWIP = [...state.workInProgress];` (around line 110), add:

```javascript
let newActiveBonuses = [...state.activeBonuses];
```

At the end of `endWeek`, in the `update` return statement, include the new array. Find where the state is reconstructed (around line 240-247) and add `activeBonuses: newActiveBonuses` alongside the other fields:

```javascript
return {
  ...state,
  // ...existing fields...
  activeBonuses: newActiveBonuses,
  // ...rest...
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- gameStore.test.js`
Expected: Both new tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stores/gameStore.js src/lib/stores/gameStore.test.js
git commit -m "feat: populate activeBonuses when improvement with ongoingBonus completes

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Update bonus maturity at end of week

**Files:**
- Modify: `src/lib/stores/gameStore.js`
- Modify: `src/lib/stores/gameStore.test.js`

- [ ] **Step 1: Write the failing tests**

Append to `gameStore.test.js`:

```javascript
it('ramps bonus maturity each stable week after completion', () => {
  // codeReviews completes in one endWeek with allocation 100 (see Task 6 test).
  // After completion, the bonus is added at 0.3 and then immediately ramped by
  // updateBonusMaturity to 0.475 in the same endWeek.
  startNewGame('startup');
  startImprovement('codeReviews');
  allocateCapacity({ codeReviews: 100 });
  endWeek();

  let state = get(gameStore);
  expect(state.activeBonuses[0].maturity).toBeCloseTo(0.475, 5);

  // Two more stable weeks: ramp to 0.65, then 0.825
  allocateCapacity({});
  endWeek();
  endWeek();

  state = get(gameStore);
  expect(state.activeBonuses[0].maturity).toBeCloseTo(0.825, 5);
});

it('decays maturity when WIP allocation count is 4 or more', () => {
  startNewGame('startup');
  // Fast-track an active bonus by manually setting state
  gameStore.update(s => ({
    ...s,
    activeBonuses: [{ type: 'reduceFeatureImpact', sourceImprovement: 'codeReviews', maturity: 0.8, completedWeek: 1 }]
  }));

  // Add 4 dummy items to capacityAllocation so allocatedItemCount === 4
  gameStore.update(s => ({
    ...s,
    capacityAllocation: { a: 25, b: 25, c: 25, d: 25 }
  }));

  endWeek();

  const state = get(gameStore);
  expect(state.activeBonuses[0].maturity).toBeCloseTo(0.60, 5);
});
```

Notes for the engineer:
- The first test asserts the new ordering: when an improvement completes, the bonus is added at 0.3 then immediately ramped by `updateBonusMaturity` in the same `endWeek`. This is the design: bonuses are appended to `newActiveBonuses` BEFORE the maturity update runs, so a bonus completed in week N starts week N+1 at maturity 0.475.
- The second test directly mutates state via `gameStore.update` to skip the multi-week setup. This is a pragmatic test shortcut; the real lifecycle is exercised in the first test.

**Update the Task 6 test:** find the line `expect(bonus.maturity).toBe(0.3);` (with the comment about Task 7 updating it) and replace with `expect(bonus.maturity).toBeCloseTo(0.475, 5);`. After Task 7, the maturity update fires inside the same `endWeek` as completion, so the bonus enters the next week at 0.475 rather than 0.3.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- gameStore.test.js`
Expected: New tests fail (maturity stays at 0.3 because `updateBonusMaturity` is not yet wired in). The Task 6 ramp test now expects 0.475 instead of 0.3 and also fails.

- [ ] **Step 3: Wire `updateBonusMaturity` into `endWeek`**

In `src/lib/stores/gameStore.js`, update the imports at the top to include the new function:

```javascript
import { calculateFeatureDelivery, applyFeatureOutcome, IMPROVEMENTS, calculateImprovementOutcome, applyImprovementOutcome, updateBonusMaturity } from '../simulation/BusinessRules.js';
```

After the WIP completion loop (after the events block, around line 200, before computing `flowEfficiency` finalisation but after metrics have settled), add:

```javascript
const allocatedItemCount = Object.keys(state.capacityAllocation).length;
newActiveBonuses = updateBonusMaturity(newActiveBonuses, newMetrics, allocatedItemCount);
```

Place this AFTER all events have been applied and metrics finalised, so the stress signals (codeHealth, WIP count) reflect end-of-week state.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- gameStore.test.js`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stores/gameStore.js src/lib/stores/gameStore.test.js
git commit -m "feat: update bonus maturity at end of each week

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Thread `activeBonuses` into feature delivery calculation

**Files:**
- Modify: `src/lib/stores/gameStore.js`

- [ ] **Step 1: Write the failing test**

Append to `gameStore.test.js`:

```javascript
it('uses start-of-week activeBonuses when delivering features', () => {
  startNewGame('startup');

  // Manually inject a fully-mature reduceFeatureImpact bonus
  gameStore.update(s => ({
    ...s,
    activeBonuses: [{ type: 'reduceFeatureImpact', sourceImprovement: 'codeReviews', maturity: 1.0, completedWeek: 1 }]
  }));

  // Start a high-complexity feature and complete it in one week
  const feature = { id: 'feat1', name: 'Big Feature', value: 50, complexity: 'high' };
  startFeature(feature);
  allocateCapacity({ feat1: 100 });
  endWeek();

  // After endWeek, the feature is complete and the codeHealth delta should reflect the PP reduction.
  // Without bonus: -8. With 50% reduction at full maturity: -4.
  const state = get(gameStore);
  const decision = state.history.decisions.find(d => d.type === 'feature' && d.feature.id === 'feat1');
  expect(decision.outcome.codeHealthDelta).toBe(-4);
});
```

If `startFeature` is not already imported in the test file, add it.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- gameStore.test.js`
Expected: New test fails — `codeHealthDelta` is -8 because `calculateFeatureDelivery` is called without the bonuses.

- [ ] **Step 3: Pass `activeBonuses` to `calculateFeatureDelivery`**

In `src/lib/stores/gameStore.js`, find the feature-delivery call in the `endWeek` completion loop (around line 140):

Replace:
```javascript
const outcome = calculateFeatureDelivery(item, newMetrics.capacity, newMetrics.codeHealth);
```

With:
```javascript
const outcome = calculateFeatureDelivery(item, newMetrics.capacity, newMetrics.codeHealth, state.activeBonuses);
```

Note: `state.activeBonuses` is the start-of-week value (the original from `state`). This is intentional — the week's outcomes should use start-of-week maturity, while updates happen at week boundary.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- gameStore.test.js`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stores/gameStore.js src/lib/stores/gameStore.test.js
git commit -m "feat: thread activeBonuses into feature delivery

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Display active bonuses in `GameHeader`

**Files:**
- Modify: `src/lib/components/simulation/GameHeader.svelte`
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Add `activeBonuses` prop and IMPROVEMENTS lookup to `GameHeader.svelte`**

In `src/lib/components/simulation/GameHeader.svelte`, add to the `<script>` block:

```javascript
import { IMPROVEMENTS } from '$lib/simulation/BusinessRules.js';

export let activeBonuses = [];

function statusFor(maturity) {
  if (maturity >= 1.0) return 'mature';
  if (maturity > 0) return 'building';
  return 'dormant';
}

function effectLabelFor(bonus) {
  const improvement = IMPROVEMENTS[bonus.sourceImprovement];
  return improvement ? improvement.name : bonus.sourceImprovement;
}
```

- [ ] **Step 2: Render the bonus list**

In `GameHeader.svelte`, after the metrics grid (after the closing `</div>` of `grid-cols-2 md:grid-cols-3 lg:grid-cols-6`, around line 76), add:

```svelte
{#if activeBonuses.length > 0}
  <div class="mt-4 border-t-2 border-black pt-4">
    <h3 class="text-xs font-black text-black uppercase mb-2">Active Practices</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      {#each activeBonuses as bonus}
        <div class="bg-white border-2 border-black p-3">
          <div class="flex justify-between items-baseline mb-2">
            <span class="text-sm font-black uppercase">{effectLabelFor(bonus)}</span>
            <span class="text-xs font-bold text-gray-700">{Math.round(bonus.maturity * 100)}% — {statusFor(bonus.maturity)}</span>
          </div>
          <div class="w-full bg-gray-200 border border-black h-3">
            <div
              class="bg-gradient-to-r from-emerald-400 to-teal-500 h-full transition-all duration-500"
              style="width: {bonus.maturity * 100}%"
            ></div>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
```

- [ ] **Step 3: Pass `activeBonuses` from the page**

In `src/routes/+page.svelte`, find the `<GameHeader>` usage and add the prop:

```svelte
<GameHeader
  week={game.week}
  metrics={game.metrics}
  victoryConditions={game.victoryConditions}
  activeBonuses={game.activeBonuses}
/>
```

The existing usage at `src/routes/+page.svelte:256-260` already passes `week`, `metrics`, and `victoryConditions` as named props. Add `activeBonuses={game.activeBonuses}` as a fourth prop in the same style.

- [ ] **Step 4: Run dev server and verify visually**

Run: `npm run dev`
Open the URL it prints. Start a new Startup game. Begin Pair Programming and finish it. Verify the "Active Practices" section appears below the metrics grid showing "Implement Pair Programming" with a maturity bar.

- [ ] **Step 5: Run all tests to confirm no regression**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/simulation/GameHeader.svelte src/routes/+page.svelte
git commit -m "feat: display active practice bonuses in GameHeader

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Manual balance verification

**Files:** None — verification only.

- [ ] **Step 1: Run a Greenfield playthrough with TDD adopted early**

Run: `npm run dev`

Start a Greenfield game. In weeks 1–3, ship 1–2 small features only. Begin TDD in week 3. Continue shipping features and observe:

- TDD bonus appears in GameHeader after week 5 (3-week duration)
- Maturity climbs over the next four weeks
- Bug rate noticeably lower from week ~7 onwards compared to early-game features
- No crisis triggered

**Expected outcome:** Reach victory (£600K + code health ≥ 70) without major crisis events. Bug rate in mid-late game should feel meaningfully lower than early game.

- [ ] **Step 2: Run a Legacy playthrough with Pair Programming**

Restart and pick Legacy. In weeks 1–3 begin Pair Programming. Once it lands, ship a mix of medium and high complexity features. Observe:

- High-complexity features impose noticeably less code-health cost
- Low-complexity features see negligible benefit
- Stress decay triggers if WIP creeps above 4 or code health drops below 0

**Expected outcome:** Pair Programming should feel substantially more useful on hard features, marginal on easy ones. The contextual fit should be visible in the metrics.

- [ ] **Step 3: Stress-test the decay**

Restart and pick any scenario. Get a bonus to full maturity, then deliberately push WIP to 5 items. Watch maturity drop by 20% per week in GameHeader. Bring WIP back to 1–2 and watch it recover.

**Expected outcome:** Decay and recovery feel smooth and observable. Not punishing.

- [ ] **Step 4: Confirm no dominant strategy emerged**

After three or four runs, ask: did TDD or Pair Programming feel like an obvious must-pick in every scenario? If yes, magnitudes are too strong and the constant in `getBonusStrength` should drop. If no investment ever felt worth the cost, magnitudes are too weak.

If tuning is needed, change the constants in `getBonusStrength` (e.g., 0.20/0.50/0.70 → 0.15/0.40/0.55), re-run tests, and repeat verification.

- [ ] **Step 5: Final commit if any tuning happened**

```bash
git add src/lib/simulation/BusinessRules.js src/lib/simulation/BusinessRules.test.js
git commit -m "tune: adjust ongoing bonus magnitudes after balance verification

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

If no tuning was needed, skip this step.

---

## Summary

After all tasks:

- TDD reduces bug rate, more so in messy code, less so in clean code
- Pair Programming reduces feature-induced code-health cost, more so on complex features
- Both bonuses ramp from 30% to 100% over four weeks of stable conditions
- Both decay under WIP-driven or crisis-driven stress, by 20% per week (30% under both)
- Both surface in the GameHeader with visible maturity bars
- Existing tests continue to pass (default empty arrays preserve compatibility)

**Estimated implementation time:** 2–3 hours for tasks 1–9, plus 30–60 minutes of manual balance verification in task 10.
