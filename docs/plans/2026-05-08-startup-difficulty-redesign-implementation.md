# Startup Difficulty Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add capacity-tied burn rate, investor-confidence metric, three Startup-only events, and an Acquisition alternate-win path so the Startup scenario carries pedagogically meaningful pressure.

**Architecture:** Two new pure functions in `BusinessRules.js`, three new events in `EventSystem.js`, scenario flag block in `ScenarioDefinitions.js`, and several new endWeek operations plus two new store actions in `gameStore.js`. UI gains a conditional confidence tile in `GameHeader.svelte` and an acquisition-offer modal in `+page.svelte`.

**Tech Stack:** SvelteKit, Vitest, Tailwind CSS v4. Pure JavaScript with JSDoc.

**Spec:** `docs/plans/2026-05-08-startup-difficulty-redesign-design.md`

---

## File Map

- `src/lib/simulation/ScenarioDefinitions.js` — add `investorConfidence` to startup's initialMetrics, set time limit to 12, add `mechanics` flag block
- `src/lib/simulation/BusinessRules.js` — add `calculateWeeklyBurn` and `calculateConfidenceDelta` pure functions
- `src/lib/simulation/EventSystem.js` — add three new event definitions (investorCheckIn, downRoundThreat, acquisitionOffer)
- `src/lib/stores/gameStore.js` — initialise new state fields, apply burn and confidence in endWeek, update counters, check new lose conditions, fire startup events, handle acquisition pending-decision and accept/decline actions
- `src/lib/components/simulation/GameHeader.svelte` — render investor confidence tile when `scenario.mechanics.investorConfidence` is true
- `src/routes/+page.svelte` — render acquisition-offer modal when `pendingDecision.type === 'acquisition'`
- Tests added in BusinessRules.test.js, EventSystem.test.js, gameStore.test.js, ScenarioDefinitions.test.js

---

## Task 1: Add `calculateWeeklyBurn` pure function

**Files:**
- Modify: `src/lib/simulation/BusinessRules.js`
- Modify: `src/lib/simulation/BusinessRules.test.js`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/simulation/BusinessRules.test.js`:

```javascript
describe('BusinessRules - calculateWeeklyBurn', () => {
  it('returns 24 for capacity 120', () => {
    expect(calculateWeeklyBurn(120)).toBe(24);
  });

  it('scales linearly with capacity', () => {
    expect(calculateWeeklyBurn(80)).toBe(16);
    expect(calculateWeeklyBurn(140)).toBe(28);
    expect(calculateWeeklyBurn(200)).toBe(40);
  });

  it('returns 0 for capacity 0', () => {
    expect(calculateWeeklyBurn(0)).toBe(0);
  });

  it('handles negative capacity by returning 0 (no negative burn)', () => {
    expect(calculateWeeklyBurn(-50)).toBe(0);
  });
});
```

Update the import at the top of `BusinessRules.test.js` to include `calculateWeeklyBurn`:

```javascript
import {
  calculateFeatureDelivery,
  calculateBugProbability,
  applyFeatureOutcome,
  calculateImprovementOutcome,
  applyImprovementOutcome,
  getBonusStrength,
  updateBonusMaturity,
  calculateWeeklyBurn,
  IMPROVEMENTS
} from './BusinessRules.js';
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- BusinessRules.test.js`
Expected: New tests fail with "calculateWeeklyBurn is not a function".

- [ ] **Step 3: Implement `calculateWeeklyBurn`**

Append to `src/lib/simulation/BusinessRules.js`:

```javascript
/**
 * Calculate weekly burn rate in pounds based on team capacity.
 * Burn scales at £0.20K per capacity point, so a team of 120 burns £24K per week.
 * @param {number} capacity - Current team capacity
 * @returns {number} Weekly burn in pounds (always non-negative)
 */
export function calculateWeeklyBurn(capacity) {
  return Math.max(0, capacity * 0.20);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- BusinessRules.test.js`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/simulation/BusinessRules.js src/lib/simulation/BusinessRules.test.js
git commit -m "feat: add calculateWeeklyBurn for capacity-tied burn rate

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Add `calculateConfidenceDelta` pure function

**Files:**
- Modify: `src/lib/simulation/BusinessRules.js`
- Modify: `src/lib/simulation/BusinessRules.test.js`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/simulation/BusinessRules.test.js`:

```javascript
describe('BusinessRules - calculateConfidenceDelta', () => {
  const baseMetrics = {
    capacity: 120,
    codeHealth: 70,
    satisfaction: 50,
    marketPosition: 50,
    businessValue: 0,
    investorConfidence: 50
  };

  it('returns 0 with no completions, no events, neutral metrics', () => {
    const delta = calculateConfidenceDelta(baseMetrics, [], []);
    expect(delta).toBe(0);
  });

  it('rewards a feature ship without bugs', () => {
    const delta = calculateConfidenceDelta(baseMetrics, [{ type: 'feature', hasBugs: false }], []);
    expect(delta).toBe(5);
  });

  it('penalises a feature ship with bugs', () => {
    const delta = calculateConfidenceDelta(baseMetrics, [{ type: 'feature', hasBugs: true }], []);
    expect(delta).toBe(-10);
  });

  it('penalises an improvement completion', () => {
    const delta = calculateConfidenceDelta(baseMetrics, [{ type: 'improvement' }], []);
    expect(delta).toBe(-5);
  });

  it('sums multiple completions correctly', () => {
    const delta = calculateConfidenceDelta(baseMetrics, [
      { type: 'feature', hasBugs: false },
      { type: 'feature', hasBugs: false },
      { type: 'improvement' }
    ], []);
    expect(delta).toBe(5 + 5 - 5); // 5
  });

  it('applies penalty for security incident event', () => {
    const delta = calculateConfidenceDelta(baseMetrics, [], [{ id: 'securityIncident' }]);
    expect(delta).toBe(-25);
  });

  it('applies penalty for customer churn event', () => {
    const delta = calculateConfidenceDelta(baseMetrics, [], [{ id: 'customerChurn' }]);
    expect(delta).toBe(-15);
  });

  it('applies penalty for engineering exodus event', () => {
    const delta = calculateConfidenceDelta(baseMetrics, [], [{ id: 'engineeringExodus' }]);
    expect(delta).toBe(-20);
  });

  it('applies bonus for big client event', () => {
    const delta = calculateConfidenceDelta(baseMetrics, [], [{ id: 'bigClient' }]);
    expect(delta).toBe(15);
  });

  it('rewards sustained high satisfaction', () => {
    const metrics = { ...baseMetrics, satisfaction: 65 };
    const delta = calculateConfidenceDelta(metrics, [], []);
    expect(delta).toBe(2);
  });

  it('penalises sustained low satisfaction', () => {
    const metrics = { ...baseMetrics, satisfaction: 15 };
    const delta = calculateConfidenceDelta(metrics, [], []);
    expect(delta).toBe(-3);
  });

  it('penalises sustained negative code health', () => {
    const metrics = { ...baseMetrics, codeHealth: -5 };
    const delta = calculateConfidenceDelta(metrics, [], []);
    expect(delta).toBe(-3);
  });

  it('rewards sustained high market position', () => {
    const metrics = { ...baseMetrics, marketPosition: 65 };
    const delta = calculateConfidenceDelta(metrics, [], []);
    expect(delta).toBe(2);
  });

  it('combines completions, events, and sustained signals', () => {
    const metrics = { ...baseMetrics, satisfaction: 65, marketPosition: 65 };
    const delta = calculateConfidenceDelta(
      metrics,
      [{ type: 'feature', hasBugs: false }],
      [{ id: 'bigClient' }]
    );
    expect(delta).toBe(5 + 15 + 2 + 2); // 24
  });
});
```

Update import to include `calculateConfidenceDelta`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- BusinessRules.test.js`
Expected: New tests fail with "calculateConfidenceDelta is not a function".

- [ ] **Step 3: Implement `calculateConfidenceDelta`**

Append to `src/lib/simulation/BusinessRules.js`:

```javascript
/**
 * Calculate the total investor confidence delta for a single end-of-week tick.
 * Sums per-completion contributions, per-event contributions, and per-week sustained signals.
 *
 * @param {object} metrics - End-of-week metrics, must include satisfaction, codeHealth, marketPosition
 * @param {Array<object>} completionEvents - Completed WIP items as { type: 'feature'|'improvement', hasBugs?: boolean }
 * @param {Array<object>} triggeredEvents - Triggered events with { id: string }
 * @returns {number} Total confidence delta for this week
 */
export function calculateConfidenceDelta(metrics, completionEvents, triggeredEvents) {
  let delta = 0;

  // Per-completion deltas
  for (const event of completionEvents) {
    if (event.type === 'feature') {
      delta += event.hasBugs ? -10 : 5;
    } else if (event.type === 'improvement') {
      delta += -5;
    }
  }

  // Per-event deltas
  for (const event of triggeredEvents) {
    if (event.id === 'securityIncident') delta += -25;
    else if (event.id === 'customerChurn') delta += -15;
    else if (event.id === 'engineeringExodus') delta += -20;
    else if (event.id === 'bigClient') delta += 15;
  }

  // Per-week sustained signals
  if (metrics.satisfaction > 60) delta += 2;
  if (metrics.satisfaction < 20) delta += -3;
  if (metrics.codeHealth < 0) delta += -3;
  if (metrics.marketPosition > 60) delta += 2;

  return delta;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- BusinessRules.test.js`
Expected: All new tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/simulation/BusinessRules.js src/lib/simulation/BusinessRules.test.js
git commit -m "feat: add calculateConfidenceDelta for investor confidence dynamics

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Update Startup scenario definition

**Files:**
- Modify: `src/lib/simulation/ScenarioDefinitions.js`
- Modify: `src/lib/simulation/ScenarioDefinitions.test.js`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/simulation/ScenarioDefinitions.test.js`:

```javascript
describe('ScenarioDefinitions - startup updates', () => {
  it('startup includes investorConfidence: 50 in initialMetrics', () => {
    const scenario = getScenario('startup');
    expect(scenario.initialMetrics.investorConfidence).toBe(50);
  });

  it('startup time limit is 12 weeks', () => {
    const scenario = getScenario('startup');
    expect(scenario.victoryConditions.weeks).toBe(12);
  });

  it('startup has mechanics block with burnRate and investorConfidence flags', () => {
    const scenario = getScenario('startup');
    expect(scenario.mechanics).toEqual({
      burnRate: true,
      investorConfidence: true
    });
  });

  it('legacy and greenfield do not have mechanics flags set', () => {
    const legacy = getScenario('enterprise');
    const greenfield = getScenario('greenfield');
    expect(legacy.mechanics?.burnRate).toBeFalsy();
    expect(legacy.mechanics?.investorConfidence).toBeFalsy();
    expect(greenfield.mechanics?.burnRate).toBeFalsy();
    expect(greenfield.mechanics?.investorConfidence).toBeFalsy();
  });

  it('legacy and greenfield do not include investorConfidence in initialMetrics', () => {
    const legacy = getScenario('enterprise');
    const greenfield = getScenario('greenfield');
    expect(legacy.initialMetrics.investorConfidence).toBeUndefined();
    expect(greenfield.initialMetrics.investorConfidence).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- ScenarioDefinitions.test.js`
Expected: First three new tests fail (investorConfidence missing, weeks still 15, mechanics missing). Last two pass.

- [ ] **Step 3: Update `ScenarioDefinitions.js`**

In `src/lib/simulation/ScenarioDefinitions.js`, modify the `startup` entry:

- Add `investorConfidence: 50` to the `initialMetrics` object alongside the other metrics
- Change `victoryConditions.weeks` from `15` to `12`
- Update `victoryConditions.description` from the current text to `'Reach £500K in business value within 12 weeks'`
- Add a new `mechanics` block at the same level as `victoryConditions` and `story`:

```javascript
mechanics: {
  burnRate: true,
  investorConfidence: true
}
```

The `enterprise` and `greenfield` entries remain untouched.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- ScenarioDefinitions.test.js`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/simulation/ScenarioDefinitions.js src/lib/simulation/ScenarioDefinitions.test.js
git commit -m "feat: tighten startup scenario and opt into burn and confidence mechanics

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Initialise new state fields in `startNew`

**Files:**
- Modify: `src/lib/stores/gameStore.js`
- Modify: `src/lib/stores/gameStore.test.js`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/stores/gameStore.test.js`:

```javascript
describe('gameStore - startup mechanics state', () => {
  it('initialises consecutive-week counters and decline flag for any new game', () => {
    startNewGame('startup');
    const state = get(gameStore);
    expect(state.consecutiveWeeksLowConfidence).toBe(0);
    expect(state.consecutiveWeeksHighConfidence).toBe(0);
    expect(state.acquisitionOfferDeclined).toBe(false);
    expect(state.pendingDecision).toBeNull();
    expect(state.victoryType).toBeNull();
  });

  it('initialises investorConfidence to 50 for startup scenario', () => {
    startNewGame('startup');
    const state = get(gameStore);
    expect(state.metrics.investorConfidence).toBe(50);
  });

  it('does not include investorConfidence in metrics for non-startup scenarios', () => {
    startNewGame('greenfield');
    const state = get(gameStore);
    expect(state.metrics.investorConfidence).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- gameStore.test.js`
Expected: New tests fail because the new state fields are undefined.

- [ ] **Step 3: Add new fields to `initialState`**

In `src/lib/stores/gameStore.js`, locate the `startNew` action and the `initialState` object inside it. Add the four new top-level fields, after `activeBonuses` and before `victoryConditions`:

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
  consecutiveWeeksLowConfidence: 0,
  consecutiveWeeksHighConfidence: 0,
  acquisitionOfferDeclined: false,
  pendingDecision: null,
  victoryType: null,
  victoryConditions: scenario.victoryConditions,
  gameOver: false,
  victory: false
};
```

The `metrics` variable is already a shallow spread of `scenario.initialMetrics`, so when the startup scenario adds `investorConfidence: 50`, it flows into `state.metrics.investorConfidence` automatically. No further changes needed here for that field.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- gameStore.test.js`
Expected: All new tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stores/gameStore.js src/lib/stores/gameStore.test.js
git commit -m "feat: initialise startup-mechanic counters and decision state

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Apply burn rate in `endWeek`

**Files:**
- Modify: `src/lib/stores/gameStore.js`
- Modify: `src/lib/stores/gameStore.test.js`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/stores/gameStore.test.js`:

```javascript
describe('gameStore - burn rate', () => {
  it('subtracts capacity * 0.20 from BV at end of week in startup scenario', () => {
    startNewGame('startup');
    const before = get(gameStore).metrics.businessValue;
    endWeek();
    const after = get(gameStore).metrics.businessValue;
    // Capacity 120 -> burn -24
    expect(after - before).toBeCloseTo(-24, 1);
  });

  it('does not apply burn in non-startup scenarios', () => {
    startNewGame('greenfield');
    const before = get(gameStore).metrics.businessValue;
    endWeek();
    const after = get(gameStore).metrics.businessValue;
    expect(after).toBe(before);
  });

  it('burn scales with capacity changes mid-game', () => {
    startNewGame('startup');
    // Manually bump capacity for this test
    gameStore.update(s => ({ ...s, metrics: { ...s.metrics, capacity: 200 } }));
    const before = get(gameStore).metrics.businessValue;
    endWeek();
    const after = get(gameStore).metrics.businessValue;
    // Capacity 200 -> burn -40
    expect(after - before).toBeCloseTo(-40, 1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- gameStore.test.js`
Expected: First and third tests fail because burn is not yet applied.

- [ ] **Step 3: Update imports and apply burn in `endWeek`**

In `src/lib/stores/gameStore.js`:

Update the imports at the top to include `calculateWeeklyBurn`:

```javascript
import {
  calculateFeatureDelivery,
  applyFeatureOutcome,
  IMPROVEMENTS,
  calculateImprovementOutcome,
  applyImprovementOutcome,
  updateBonusMaturity,
  calculateWeeklyBurn
} from '../simulation/BusinessRules.js';
```

Also import `getScenario` if not already:

```javascript
import { getScenario } from '../simulation/ScenarioDefinitions.js';
```

Inside `endWeek`, after the existing `updateBonusMaturity` call and after `checkForEvents` and event-outcome application, but BEFORE the final `return` block, add the burn step. Locate the section right after the maturity update line:

```javascript
const allocatedItemCount = Object.keys(state.capacityAllocation).length;
newActiveBonuses = updateBonusMaturity(newActiveBonuses, newMetrics, allocatedItemCount);
```

After all events have been applied (so `newMetrics` is already adjusted), add:

```javascript
const scenario = getScenario(state.scenario);
if (scenario.mechanics?.burnRate) {
  const burn = calculateWeeklyBurn(newMetrics.capacity);
  newMetrics = { ...newMetrics, businessValue: newMetrics.businessValue - burn };
}
```

Place this AFTER event outcomes are applied so capacity reflects any event-driven changes (engineering exodus reducing capacity, hire events adding capacity). Place this BEFORE confidence delta computation so burn does not affect confidence delta directly.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- gameStore.test.js`
Expected: All burn-rate tests pass. Existing tests still pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stores/gameStore.js src/lib/stores/gameStore.test.js
git commit -m "feat: apply weekly burn rate to BV in startup scenarios

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Apply confidence delta in `endWeek`

**Files:**
- Modify: `src/lib/stores/gameStore.js`
- Modify: `src/lib/stores/gameStore.test.js`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/stores/gameStore.test.js`:

```javascript
describe('gameStore - confidence updates', () => {
  it('does not change confidence in non-startup scenarios', () => {
    startNewGame('greenfield');
    endWeek();
    const state = get(gameStore);
    expect(state.metrics.investorConfidence).toBeUndefined();
  });

  it('confidence drops by 5 when an improvement completes (no other changes)', () => {
    startNewGame('startup');
    startImprovement('fixBugs');
    allocateCapacity({ fixBugs: 100 });
    const before = get(gameStore).metrics.investorConfidence;
    endWeek();
    const after = get(gameStore).metrics.investorConfidence;
    // Improvement -5; no other deltas if metrics stay neutral
    expect(after - before).toBeLessThanOrEqual(-5);
  });

  it('clamps confidence to range -100 to 100', () => {
    startNewGame('startup');
    gameStore.update(s => ({ ...s, metrics: { ...s.metrics, investorConfidence: 99 } }));
    // Force a strong positive delta via state mutation; with default metrics + idle
    // week, sustained signals contribute 0, so confidence should hold near 99.
    endWeek();
    const after = get(gameStore).metrics.investorConfidence;
    expect(after).toBeLessThanOrEqual(100);
    expect(after).toBeGreaterThanOrEqual(-100);
  });

  it('records confidence change in history alongside other metrics', () => {
    startNewGame('startup');
    endWeek();
    const state = get(gameStore);
    const last = state.history.weeklyMetrics[state.history.weeklyMetrics.length - 1];
    expect(last).toHaveProperty('investorConfidence');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- gameStore.test.js`
Expected: New tests fail because confidence delta is not yet applied.

- [ ] **Step 3: Apply confidence delta in `endWeek`**

In `src/lib/stores/gameStore.js`, update the imports to include `calculateConfidenceDelta`:

```javascript
import {
  calculateFeatureDelivery,
  applyFeatureOutcome,
  IMPROVEMENTS,
  calculateImprovementOutcome,
  applyImprovementOutcome,
  updateBonusMaturity,
  calculateWeeklyBurn,
  calculateConfidenceDelta
} from '../simulation/BusinessRules.js';
```

Inside `endWeek`, you need to track which completions and which events occurred this week so they can be passed to `calculateConfidenceDelta`. The completion processing already iterates `completedItems`. Build a `completionEvents` array as you go:

In the WIP completion loop, where features and improvements are processed, also push to a new `completionEvents` array. Find the block:

```javascript
completedItems.forEach(item => {
  if (item.type === 'feature') {
    const outcome = calculateFeatureDelivery(item, newMetrics.capacity, newMetrics.codeHealth, state.activeBonuses);
    newMetrics = applyFeatureOutcome(newMetrics, outcome);
    newDecisions.push(...);
  } else if (item.type === 'improvement') {
    ...
  }
});
```

Add a `completionEvents` declaration just before this loop:

```javascript
const completionEvents = [];
```

Inside each branch, push to it:

```javascript
// inside feature branch, after applyFeatureOutcome:
completionEvents.push({ type: 'feature', hasBugs: outcome.hasBugs });

// inside improvement branch, after applyImprovementOutcome:
completionEvents.push({ type: 'improvement' });
```

After the burn-rate step (added in Task 5), add the confidence step. The `triggeredEvents` array already exists from the existing `checkForEvents` call. Apply the delta only when the scenario uses confidence:

```javascript
if (scenario.mechanics?.investorConfidence) {
  const confidenceDelta = calculateConfidenceDelta(newMetrics, completionEvents, triggeredEvents);
  const newConfidence = Math.max(-100, Math.min(100, newMetrics.investorConfidence + confidenceDelta));
  newMetrics = { ...newMetrics, investorConfidence: newConfidence };
}
```

Keep the existing line that records weekly metrics in history. The history snapshot will pick up `investorConfidence` automatically because it spreads `newMetrics`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- gameStore.test.js`
Expected: All confidence-update tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stores/gameStore.js src/lib/stores/gameStore.test.js
git commit -m "feat: apply investor confidence delta in startup endWeek

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Update consecutive-week counters and check lose condition

**Files:**
- Modify: `src/lib/stores/gameStore.js`
- Modify: `src/lib/stores/gameStore.test.js`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/stores/gameStore.test.js`:

```javascript
describe('gameStore - confidence counters and lose condition', () => {
  it('increments consecutiveWeeksLowConfidence when confidence is at or below -50', () => {
    startNewGame('startup');
    gameStore.update(s => ({ ...s, metrics: { ...s.metrics, investorConfidence: -60 } }));
    endWeek();
    expect(get(gameStore).consecutiveWeeksLowConfidence).toBe(1);
  });

  it('resets consecutiveWeeksLowConfidence when confidence rises above -50', () => {
    startNewGame('startup');
    gameStore.update(s => ({ ...s, consecutiveWeeksLowConfidence: 1, metrics: { ...s.metrics, investorConfidence: -40 } }));
    endWeek();
    expect(get(gameStore).consecutiveWeeksLowConfidence).toBe(0);
  });

  it('triggers game over when consecutiveWeeksLowConfidence reaches 2', () => {
    startNewGame('startup');
    gameStore.update(s => ({ ...s, consecutiveWeeksLowConfidence: 1, metrics: { ...s.metrics, investorConfidence: -60 } }));
    endWeek();
    const state = get(gameStore);
    expect(state.gameOver).toBe(true);
    expect(state.victory).toBe(false);
  });

  it('increments consecutiveWeeksHighConfidence when confidence is at or above 70', () => {
    startNewGame('startup');
    gameStore.update(s => ({ ...s, metrics: { ...s.metrics, investorConfidence: 75 } }));
    endWeek();
    expect(get(gameStore).consecutiveWeeksHighConfidence).toBe(1);
  });

  it('resets consecutiveWeeksHighConfidence when confidence drops below 70', () => {
    startNewGame('startup');
    gameStore.update(s => ({ ...s, consecutiveWeeksHighConfidence: 1, metrics: { ...s.metrics, investorConfidence: 60 } }));
    endWeek();
    expect(get(gameStore).consecutiveWeeksHighConfidence).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- gameStore.test.js`
Expected: All new tests fail (counters do not yet update).

- [ ] **Step 3: Update counters and check lose condition**

In `src/lib/stores/gameStore.js`, after the confidence delta block, add counter updates and lose-condition checking. The block should look like:

```javascript
let newLowCounter = state.consecutiveWeeksLowConfidence;
let newHighCounter = state.consecutiveWeeksHighConfidence;

if (scenario.mechanics?.investorConfidence) {
  if (newMetrics.investorConfidence <= -50) {
    newLowCounter = newLowCounter + 1;
  } else {
    newLowCounter = 0;
  }

  if (newMetrics.investorConfidence >= 70) {
    newHighCounter = newHighCounter + 1;
  } else {
    newHighCounter = 0;
  }
}
```

In the final `return` block of `endWeek`, include the new fields:

```javascript
return {
  ...state,
  // ... existing fields ...
  metrics: newMetrics,
  consecutiveWeeksLowConfidence: newLowCounter,
  consecutiveWeeksHighConfidence: newHighCounter,
  // ...
};
```

For the lose condition: at the existing point in `endWeek` where `gameOver` is set (look for time-runs-out logic that already exists in the function), extend the condition. The simplest way is to add a separate check after the counter update, BEFORE the existing time-out check:

```javascript
if (scenario.mechanics?.investorConfidence && newLowCounter >= 2) {
  // Funding pulled — game over, no victory
  return {
    ...state,
    metrics: newMetrics,
    consecutiveWeeksLowConfidence: newLowCounter,
    consecutiveWeeksHighConfidence: newHighCounter,
    gameOver: true,
    victory: false,
    week: newWeek,
    workInProgress: newWIP,
    activeBonuses: newActiveBonuses,
    history: { ...state.history, /* finalised history including last metrics snapshot */ }
  };
}
```

The exact return shape must match the existing `endWeek` return so all expected state fields are preserved. Inspect the file before adding to ensure parity.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- gameStore.test.js`
Expected: All counter and lose-condition tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stores/gameStore.js src/lib/stores/gameStore.test.js
git commit -m "feat: track confidence counters and trigger funding-pulled game over

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Add three new events to `EventSystem`

**Files:**
- Modify: `src/lib/simulation/EventSystem.js`
- Modify: `src/lib/simulation/EventSystem.test.js`

### Phase split (read first)

The new events must fire AFTER confidence and counters are updated, but the existing events must fire BEFORE — because the existing triggered events feed into `calculateConfidenceDelta`. To keep one event registry, each event gains an optional `phase` field (`'pre'` for default, `'post'` for confidence-dependent events). `checkForEvents` takes a phase argument and filters accordingly.

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/simulation/EventSystem.test.js`:

```javascript
describe('EventSystem - startup events', () => {
  const startupHistory = { events: [], decisions: [], weeklyMetrics: [] };
  const startupMetrics = {
    capacity: 120,
    codeHealth: 70,
    satisfaction: 50,
    marketPosition: 50,
    businessValue: 0,
    investorConfidence: 50
  };
  const startupState = {
    scenario: 'startup',
    consecutiveWeeksHighConfidence: 0,
    acquisitionOfferDeclined: false
  };

  it('investorCheckIn fires every 4 weeks in startup, post-phase', () => {
    const events = checkForEvents(startupMetrics, startupHistory, 4, startupState, 'post');
    expect(events.find(e => e.id === 'investorCheckIn')).toBeDefined();

    const events8 = checkForEvents(startupMetrics, startupHistory, 8, startupState, 'post');
    expect(events8.find(e => e.id === 'investorCheckIn')).toBeDefined();
  });

  it('investorCheckIn does not fire in non-startup scenarios', () => {
    const greenfieldState = { scenario: 'greenfield' };
    const events = checkForEvents(startupMetrics, startupHistory, 4, greenfieldState, 'post');
    expect(events.find(e => e.id === 'investorCheckIn')).toBeUndefined();
  });

  it('investorCheckIn does not fire on non-multiple-of-4 weeks', () => {
    const events = checkForEvents(startupMetrics, startupHistory, 3, startupState, 'post');
    expect(events.find(e => e.id === 'investorCheckIn')).toBeUndefined();
  });

  it('investorCheckIn does not fire in pre-phase', () => {
    const events = checkForEvents(startupMetrics, startupHistory, 4, startupState, 'pre');
    expect(events.find(e => e.id === 'investorCheckIn')).toBeUndefined();
  });

  it('downRoundThreat fires the first time confidence drops below 0, post-phase only', () => {
    const lowConfidenceMetrics = { ...startupMetrics, investorConfidence: -5 };
    const events = checkForEvents(lowConfidenceMetrics, startupHistory, 5, startupState, 'post');
    expect(events.find(e => e.id === 'downRoundThreat')).toBeDefined();

    const preEvents = checkForEvents(lowConfidenceMetrics, startupHistory, 5, startupState, 'pre');
    expect(preEvents.find(e => e.id === 'downRoundThreat')).toBeUndefined();
  });

  it('downRoundThreat does not refire after the first time', () => {
    const lowConfidenceMetrics = { ...startupMetrics, investorConfidence: -5 };
    const historyWithDownRound = {
      ...startupHistory,
      events: [{ id: 'downRoundThreat', week: 3 }]
    };
    const events = checkForEvents(lowConfidenceMetrics, historyWithDownRound, 5, startupState, 'post');
    expect(events.find(e => e.id === 'downRoundThreat')).toBeUndefined();
  });

  it('acquisitionOffer fires when consecutiveWeeksHighConfidence reaches 3, post-phase', () => {
    const stateWithThree = { ...startupState, consecutiveWeeksHighConfidence: 3 };
    const events = checkForEvents(startupMetrics, startupHistory, 5, stateWithThree, 'post');
    expect(events.find(e => e.id === 'acquisitionOffer')).toBeDefined();
  });

  it('acquisitionOffer does not fire if previously declined', () => {
    const stateDeclined = {
      ...startupState,
      consecutiveWeeksHighConfidence: 3,
      acquisitionOfferDeclined: true
    };
    const events = checkForEvents(startupMetrics, startupHistory, 5, stateDeclined, 'post');
    expect(events.find(e => e.id === 'acquisitionOffer')).toBeUndefined();
  });

  it('acquisitionOffer does not fire below 3 consecutive high-confidence weeks', () => {
    const stateWithTwo = { ...startupState, consecutiveWeeksHighConfidence: 2 };
    const events = checkForEvents(startupMetrics, startupHistory, 5, stateWithTwo, 'post');
    expect(events.find(e => e.id === 'acquisitionOffer')).toBeUndefined();
  });

  it('existing events default to pre-phase (regression check)', () => {
    // securityIncident from the existing event set should fire in pre-phase
    const crisisMetrics = { ...startupMetrics, codeHealth: -60 };
    const events = checkForEvents(crisisMetrics, startupHistory, 5, startupState, 'pre');
    expect(events.find(e => e.id === 'securityIncident')).toBeDefined();
  });
});
```

The fourth argument to `checkForEvents` is the state envelope (new). The fifth is the phase filter (new, defaults to 'pre' for backward compatibility).

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- EventSystem.test.js`
Expected: New tests fail because the new event triggers do not exist and the function ignores its fourth argument.

- [ ] **Step 3: Add events and update `checkForEvents`**

In `src/lib/simulation/EventSystem.js`:

Add the three new event definitions to the `EVENTS` array. Each carries `phase: 'post'` so it fires only after confidence and counters are updated:

```javascript
{
  id: 'investorCheckIn',
  name: 'Investor Check-in',
  type: 'narrative',
  phase: 'post',
  description: 'Investors are reviewing your progress',
  trigger: (metrics, history, week, state) => {
    return state?.scenario === 'startup' && week > 0 && week % 4 === 0;
  },
  outcome: {}
},
{
  id: 'downRoundThreat',
  name: 'Down Round Threat',
  type: 'narrative',
  phase: 'post',
  description: 'Investors hint at a down round if confidence does not recover',
  trigger: (metrics, history, week, state) => {
    if (state?.scenario !== 'startup') return false;
    if (metrics.investorConfidence === undefined) return false;
    if (metrics.investorConfidence >= 0) return false;
    const alreadyFired = history.events.some(e => e.id === 'downRoundThreat');
    return !alreadyFired;
  },
  outcome: {}
},
{
  id: 'acquisitionOffer',
  name: 'Acquisition Offer',
  type: 'choice',
  phase: 'post',
  description: 'A larger company has offered to acquire you',
  trigger: (metrics, history, week, state) => {
    if (state?.scenario !== 'startup') return false;
    if (state?.acquisitionOfferDeclined) return false;
    return state?.consecutiveWeeksHighConfidence >= 3;
  },
  outcome: {
    pendingDecision: 'acquisition'
  }
}
```

Update the `checkForEvents` signature to accept `state` and `phase`:

```javascript
export function checkForEvents(metrics, history, week, state = {}, phase = 'pre') {
  return EVENTS.filter(event =>
    (event.phase ?? 'pre') === phase &&
    event.trigger(metrics, history, week, state)
  );
}
```

Existing events have no `phase` field, so they default to `'pre'`. Their existing triggers do not need updating because they ignore the new `state` parameter (and JavaScript handles the extra argument gracefully).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- EventSystem.test.js`
Expected: All new tests pass. Existing event tests continue to pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/simulation/EventSystem.js src/lib/simulation/EventSystem.test.js
git commit -m "feat: add investor check-in, down round, and acquisition events

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Wire two-phase event firing in `endWeek` and route acquisition `pendingDecision`

**Files:**
- Modify: `src/lib/stores/gameStore.js`
- Modify: `src/lib/simulation/EventSystem.js`
- Modify: `src/lib/stores/gameStore.test.js`

### Architecture

`endWeek` now calls `checkForEvents` twice: once in pre-phase (existing events that produce outcomes consumed by the confidence calculation), once in post-phase (the three new startup events that depend on updated confidence and counters). Each phase applies its own outcomes.

The acquisition offer is special: its outcome carries `pendingDecision: 'acquisition'` instead of metric mutations. The store routes that to a top-level `pendingDecision` state field rather than passing it through `applyEventOutcome`.

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/stores/gameStore.test.js`:

```javascript
describe('gameStore - acquisition offer flow', () => {
  it('sets pendingDecision when acquisitionOffer event triggers', () => {
    startNewGame('startup');
    gameStore.update(s => ({
      ...s,
      consecutiveWeeksHighConfidence: 2, // will become 3 after this week's increment
      metrics: { ...s.metrics, investorConfidence: 75 }
    }));
    endWeek();
    const state = get(gameStore);
    expect(state.pendingDecision).toEqual({ type: 'acquisition', week: state.week });
  });

  it('does not set pendingDecision in non-startup scenarios', () => {
    startNewGame('greenfield');
    endWeek();
    expect(get(gameStore).pendingDecision).toBeNull();
  });

  it('does not set pendingDecision when offer was previously declined', () => {
    startNewGame('startup');
    gameStore.update(s => ({
      ...s,
      consecutiveWeeksHighConfidence: 2,
      acquisitionOfferDeclined: true,
      metrics: { ...s.metrics, investorConfidence: 75 }
    }));
    endWeek();
    expect(get(gameStore).pendingDecision).toBeNull();
  });

  it('does not put pendingDecision into metrics', () => {
    startNewGame('startup');
    gameStore.update(s => ({
      ...s,
      consecutiveWeeksHighConfidence: 2,
      metrics: { ...s.metrics, investorConfidence: 75 }
    }));
    endWeek();
    const state = get(gameStore);
    expect(state.metrics.pendingDecision).toBeUndefined();
  });

  it('records investor check-in event in history every 4 weeks for startup', () => {
    startNewGame('startup');
    // Advance to end of week 4
    endWeek(); endWeek(); endWeek(); endWeek();
    const state = get(gameStore);
    const checkIns = state.history.events.filter(e => e.id === 'investorCheckIn');
    expect(checkIns.length).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- gameStore.test.js`
Expected: New tests fail because the pre/post split, the state envelope, and the pendingDecision routing are not yet wired.

- [ ] **Step 3: Defensively filter metric outcomes in `applyEventOutcome`**

In `src/lib/simulation/EventSystem.js`, the existing `applyEventOutcome` function uses a naive spread. Update it to skip non-metric fields that this design adds:

Find the existing implementation:

```javascript
export function applyEventOutcome(metrics, event) {
  return { ...metrics, ...event.outcome };
}
```

Replace with:

```javascript
export function applyEventOutcome(metrics, event) {
  // pendingDecision and forcedFix are routed by the store, not applied to metrics
  const { pendingDecision, forcedFix, ...metricChanges } = event.outcome;
  return { ...metrics, ...metricChanges };
}
```

If `forcedFix` is already destructured by the existing implementation (because the store currently reads it elsewhere), keep that path and just add `pendingDecision` to the destructure list. Read the existing function before editing.

- [ ] **Step 4: Update `endWeek` to call both phases**

In `src/lib/stores/gameStore.js`, find the existing `checkForEvents` call inside `endWeek`. Locate it — it currently looks like:

```javascript
const triggeredEvents = checkForEvents(newMetrics, state.history, newWeek);
```

Replace with the pre-phase call. The state envelope is needed even for pre-phase events because future pre-phase events may use it; safest to pass it always:

```javascript
const eventState = {
  scenario: state.scenario,
  consecutiveWeeksHighConfidence: state.consecutiveWeeksHighConfidence,
  acquisitionOfferDeclined: state.acquisitionOfferDeclined
};

const preEvents = checkForEvents(newMetrics, state.history, newWeek, eventState, 'pre');
preEvents.forEach(event => {
  newMetrics = applyEventOutcome(newMetrics, event);
  if (event.outcome.forcedFix) {
    // existing forcedFix handling — preserve as-is
    const securityFix = IMPROVEMENTS.securityFix;
    const pointsNeeded = securityFix.weeks * 40;
    newWIP.push({
      ...securityFix,
      type: 'improvement',
      pointsCompleted: 0,
      pointsNeeded,
      startedWeek: newWeek,
      forced: true
    });
  }
});
```

After the burn-rate step (Task 5), confidence-delta step (Task 6), and counter-update step (Task 7), add the post-phase call. The state envelope here uses the JUST-UPDATED counter values:

```javascript
const postEventState = {
  scenario: state.scenario,
  consecutiveWeeksHighConfidence: newHighCounter,
  acquisitionOfferDeclined: state.acquisitionOfferDeclined
};

const postEvents = checkForEvents(newMetrics, state.history, newWeek, postEventState, 'post');

let newPendingDecision = state.pendingDecision;
postEvents.forEach(event => {
  if (event.outcome.pendingDecision === 'acquisition') {
    newPendingDecision = { type: 'acquisition', week: newWeek };
  } else {
    // narrative events: apply any metric changes (none for current set, but supports future)
    newMetrics = applyEventOutcome(newMetrics, event);
  }
});
```

Combine both event lists when recording history. Find where `state.history.events` is updated and ensure both `preEvents` and `postEvents` are appended:

```javascript
events: [
  ...state.history.events,
  ...preEvents.map(e => ({ id: e.id, week: newWeek })),
  ...postEvents.map(e => ({ id: e.id, week: newWeek }))
]
```

In the final return block, include `pendingDecision: newPendingDecision`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: All acquisition-flow tests pass. All existing tests still pass. Note: this step modifies `applyEventOutcome` and the event lifecycle, so a regression here would surface as failures in `EventSystem.test.js` or in existing gameStore tests around forced fixes.

- [ ] **Step 6: Commit**

```bash
git add src/lib/stores/gameStore.js src/lib/simulation/EventSystem.js src/lib/stores/gameStore.test.js
git commit -m "feat: two-phase event firing with acquisition pendingDecision routing

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Add `acceptAcquisition` and `declineAcquisition` actions

**Files:**
- Modify: `src/lib/stores/gameStore.js`
- Modify: `src/lib/stores/gameStore.test.js`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/stores/gameStore.test.js`:

```javascript
describe('gameStore - acquisition accept/decline actions', () => {
  function setupOffer() {
    startNewGame('startup');
    gameStore.update(s => ({
      ...s,
      pendingDecision: { type: 'acquisition', week: s.week },
      metrics: { ...s.metrics, investorConfidence: 75 }
    }));
  }

  it('acceptAcquisition ends the game in alternate victory', () => {
    setupOffer();
    acceptAcquisition();
    const state = get(gameStore);
    expect(state.gameOver).toBe(true);
    expect(state.victory).toBe(true);
    expect(state.victoryType).toBe('acquisition');
    expect(state.pendingDecision).toBeNull();
  });

  it('declineAcquisition resets confidence to 60 and sets the decline flag', () => {
    setupOffer();
    declineAcquisition();
    const state = get(gameStore);
    expect(state.metrics.investorConfidence).toBe(60);
    expect(state.consecutiveWeeksHighConfidence).toBe(0);
    expect(state.acquisitionOfferDeclined).toBe(true);
    expect(state.pendingDecision).toBeNull();
    expect(state.gameOver).toBe(false);
  });

  it('acceptAcquisition does nothing if pendingDecision is not an acquisition', () => {
    startNewGame('startup');
    acceptAcquisition();
    const state = get(gameStore);
    expect(state.gameOver).toBe(false);
  });
});
```

If `acceptAcquisition` and `declineAcquisition` are not exported from `gameStore.js`, also update the test imports to include them.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- gameStore.test.js`
Expected: New tests fail because the actions do not exist.

- [ ] **Step 3: Add the actions**

In `src/lib/stores/gameStore.js`, after the existing actions (`endWeek`, etc.) and before the closing `};` of the returned object, add:

```javascript
acceptAcquisition: () => {
  update(state => {
    if (!state || state.pendingDecision?.type !== 'acquisition') return state;
    return {
      ...state,
      gameOver: true,
      victory: true,
      victoryType: 'acquisition',
      pendingDecision: null
    };
  });
},

declineAcquisition: () => {
  update(state => {
    if (!state || state.pendingDecision?.type !== 'acquisition') return state;
    return {
      ...state,
      metrics: { ...state.metrics, investorConfidence: 60 },
      consecutiveWeeksHighConfidence: 0,
      acquisitionOfferDeclined: true,
      pendingDecision: null
    };
  });
},
```

Then export the actions at the bottom of the file alongside the existing exports:

```javascript
export const { startNew: startNewGame, startFeature, startImprovement, allocateCapacity, endWeek, acceptAcquisition, declineAcquisition } = gameStore;
```

(Match the exact export pattern already used in the file.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- gameStore.test.js`
Expected: All new accept/decline tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stores/gameStore.js src/lib/stores/gameStore.test.js
git commit -m "feat: add acceptAcquisition and declineAcquisition actions

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Render investor confidence tile in `GameHeader`

**Files:**
- Modify: `src/lib/components/simulation/GameHeader.svelte`
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Add the tile**

In `src/lib/components/simulation/GameHeader.svelte`:

Add a new prop to the `<script>` block, near the existing exports:

```javascript
export let mechanics = {};
```

In the metrics grid (the `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6` block), add a new conditional tile after the existing Flow Efficiency tile but before its closing `</div>`:

```svelte
{#if mechanics.investorConfidence}
  <div class="bg-gradient-to-br from-fuchsia-300 to-purple-400 border-2 border-black p-4">
    <div class="text-xs font-bold text-fuchsia-950 mb-1">📊 INVESTOR CONFIDENCE</div>
    <div class="text-2xl font-black text-black">{metrics.investorConfidence}</div>
  </div>
{/if}
```

The conditional ensures only Startup shows this tile.

In `src/routes/+page.svelte`, find the existing `<GameHeader>` usage and pass the `mechanics` prop:

```svelte
<GameHeader
  week={game.week}
  metrics={game.metrics}
  victoryConditions={game.victoryConditions}
  activeBonuses={game.activeBonuses}
  mechanics={getScenario(game.scenario).mechanics ?? {}}
/>
```

If `getScenario` is not already imported in `+page.svelte`, add the import:

```javascript
import { getScenario } from '$lib/simulation/ScenarioDefinitions.js';
```

- [ ] **Step 2: Run dev server to confirm no compile errors**

Run: `timeout 8 npm run dev 2>&1 | tail -10 || true`
Expected: Dev server starts cleanly with no Svelte/Vite errors.

- [ ] **Step 3: Run all tests**

Run: `npm test 2>&1 | tail -8`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/simulation/GameHeader.svelte src/routes/+page.svelte
git commit -m "feat: render investor confidence tile when scenario opts in

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Render acquisition offer modal in `+page.svelte`

**Files:**
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Add the modal**

In `src/routes/+page.svelte`, update the `<script>` block to import the new actions and define handlers:

```javascript
import {
  gameStore,
  startNewGame,
  startFeature,
  startImprovement,
  allocateCapacity,
  endWeek,
  acceptAcquisition,
  declineAcquisition
} from '../lib/stores/gameStore.js';

function handleAcceptAcquisition() {
  acceptAcquisition();
}

function handleDeclineAcquisition() {
  declineAcquisition();
}
```

In the template, add the modal block at the top level of the rendered output (e.g., just inside the main wrapper, near where other modals like `HelpModal` would render):

```svelte
{#if game?.pendingDecision?.type === 'acquisition'}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl">
      <div class="bg-gradient-to-r from-fuchsia-500 to-purple-500 border-b-4 border-black p-6">
        <h2 class="text-3xl font-black text-white uppercase">Acquisition Offer</h2>
      </div>
      <div class="p-6 space-y-4">
        <p class="text-base font-bold text-gray-800 leading-relaxed">
          A larger company has been watching your trajectory. They want to acquire you. Investors love the offer.
        </p>
        <p class="text-sm font-bold text-gray-700 leading-relaxed">
          Accept and the game ends in alternate victory regardless of your business value target. Decline and you continue toward the £500K primary victory, but investor confidence drops to 60 and you cannot receive another offer this game.
        </p>
        <div class="flex gap-3 pt-4">
          <button
            on:click={handleAcceptAcquisition}
            class="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-400 to-teal-500 text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:from-emerald-500 hover:to-teal-600 font-black uppercase"
          >
            Accept Offer
          </button>
          <button
            on:click={handleDeclineAcquisition}
            class="flex-1 px-6 py-3 bg-gradient-to-r from-amber-300 to-yellow-400 text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:from-amber-400 hover:to-yellow-500 font-black uppercase"
          >
            Decline, Keep Building
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
```

- [ ] **Step 2: Verify dev server**

Run: `timeout 8 npm run dev 2>&1 | tail -10 || true`
Expected: Dev server starts cleanly.

- [ ] **Step 3: Run all tests**

Run: `npm test 2>&1 | tail -8`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: render acquisition offer modal with accept/decline buttons

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: Manual balance verification

**Files:** None — verification only.

- [ ] **Step 1: Play a "ship features only" run**

Run: `npm run dev`

Start a new Startup game. Ship features every week with no improvements. Watch:
- Investor confidence climbs (visible momentum)
- Code health drops as features pile up
- Eventually code health crisis triggers events that crash confidence
- Game ends in either time-out or funding-pulled

**Expected outcome:** Pure feature-grind reaches a peak, then collapses. Loss state becomes visible before the time runs out.

- [ ] **Step 2: Play a "balance" run**

Restart Startup. Mix features and improvements. Watch:
- Confidence drains slightly during improvement weeks but recovers when features ship
- Burn rate is offset by feature value delivery
- Code health stays stable
- Hit £500K primary victory before week 12

**Expected outcome:** Sustainable strategy reaches primary victory.

- [ ] **Step 3: Test the acquisition path**

Restart Startup. Try to maximise satisfaction and market position alongside steady delivery. Watch:
- Confidence climbs above 70 and stays
- After three weeks above 70, the Acquisition Offer modal appears
- Click Accept → game ends in alternate victory (acquired ending)
- Restart, get to the offer again, click Decline → confidence resets to 60, no further offers, continue toward primary victory

**Expected outcome:** Both paths through the offer work correctly.

- [ ] **Step 4: Test the lose-condition grace period**

Restart Startup. Drive confidence below -50 (e.g., trigger a security incident with already-low confidence, ship buggy features). Watch:
- One week below -50 does not end the game (counter at 1)
- Recover to above -50 the next week → counter resets, game continues
- Two consecutive weeks below -50 → game over with funding-pulled message

**Expected outcome:** Grace period works as designed.

- [ ] **Step 5: Verify no regression in other scenarios**

Restart Greenfield. Confirm:
- No investor confidence tile shown
- No burn rate applied
- Game plays exactly as before this change

Same check for Legacy.

- [ ] **Step 6: Tune if necessary**

If any of the following emerge:
- Pure feature-grind always wins (confidence too forgiving) → reduce per-feature confidence gain or increase per-week sustained-signal penalties
- Pure improvement always loses (confidence too punishing) → reduce improvement penalty or remove some sustained-signal penalties
- Acquisition path is too easy (always achievable) → raise the high-confidence threshold or extend the consecutive-weeks requirement
- Burn rate too aggressive (cannot win) → reduce coefficient from 0.20 to 0.15 or lower
- Burn rate too gentle (no pressure) → raise to 0.25 or higher

Make the tuning change in the appropriate file (`BusinessRules.js` for burn or confidence formulas; `EventSystem.js` for event triggers; `ScenarioDefinitions.js` for time limit), update the unit tests to match, run the test suite to confirm green, then re-run the playthroughs.

- [ ] **Step 7: Commit any tuning changes**

```bash
git add <changed-files>
git commit -m "tune: adjust startup mechanics after balance verification

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

If no tuning was needed, skip this step.

---

## Summary

After all tasks:

- Startup carries a capacity-tied burn rate that drains BV every week
- Investor confidence responds to feature/improvement decisions, sustained metrics, and crisis events
- Confidence collapse below -50 for two consecutive weeks ends the game (funding pulled)
- Confidence above 70 for three consecutive weeks unlocks an Acquisition Offer (alternate win)
- Three Startup-specific events surface the dynamics in narrative form
- UI shows confidence as a metric tile and the acquisition choice as a modal
- Legacy and Greenfield are unchanged

**Estimated implementation time:** 4–6 hours for tasks 1–12, plus 1–2 hours of manual balance verification in task 13.
