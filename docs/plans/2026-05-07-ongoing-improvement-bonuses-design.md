# Ongoing Improvement Bonuses — Design

**Date:** 2026-05-07
**Status:** Design approved, ready for implementation plan

## Problem

`IMPROVEMENTS` in `src/lib/simulation/BusinessRules.js` declares an `ongoingBonus` field on two entries (Pair Programming with `reduceFeatureImpact`, the new TDD entry with `reduceBugProbability`), but no consumer reads it. Both fields are dead. Players who invest in those practices pay the costs (weeks spent, capacity penalty, satisfaction hit for TDD) but receive only the one-shot deltas. The mechanism that should differentiate improvements pedagogically is silent.

## Goal

Wire up the ongoing bonuses so completing Pair Programming or TDD produces an effect that:

- Differentiates the practices by capturing real-world contextual fit
- Rewards investment without creating a dominant strategy
- Teaches that practices embed over time and erode under stress

## Design summary

Two practices, two effects, both context-dependent and time-evolving:

- **TDD** reduces bug probability. Effect is small in healthy code, large in crisis code.
- **Pair Programming** reduces the code-health cost of features. Effect is small on simple features, large on complex ones.

Both bonuses ramp from 30% to 100% maturity over four weeks after completion. Both decay under stress signals (high WIP and crisis-level code health). Both recover when stress clears.

## Context — bonus magnitude at full maturity

### TDD `reduceBugProbability`

Reduction depends on current code health at the moment of feature delivery:

| Code health | Bug probability reduction |
|---|---|
| 50 or above | 20% |
| 0 to 49 | 50% |
| Below 0 | 70% |

**Pedagogical intent:** TDD's value is highest where you cannot trust the code. Clean codebases see modest gains. Messy codebases see major gains. Real teams adopting TDD in legacy environments report the largest benefits.

### Pair Programming `reduceFeatureImpact`

Reduction depends on the complexity of the feature being delivered:

| Feature complexity | Code-health-cost reduction |
|---|---|
| Low (factor 0.5) | 10% |
| Medium (factor 1.0) | 30% |
| High (factor 1.5) | 50% |

**Pedagogical intent:** Pairing pays off on hard problems. Two engineers on a trivial feature is overkill. Two engineers on a hard architectural decision is where the practice earns its cost.

## Maturity — temporal evolution

Each active bonus carries a `maturity` value from 0.0 to 1.0. The applied effect equals the table value above multiplied by maturity.

### Initial state

A practice starts at maturity 0.3 the week it completes. The team has the practice on paper, but has not internalised it.

### Ramp

Maturity gains 0.175 per week of stable conditions, reaching 1.0 four weeks after completion.

### Decay under stress

At end of week, maturity decreases when either stress signal is active:

- **High WIP**: four or more items have capacity allocated to them. This uses the same metric as the existing context-switching penalty (`Object.keys(state.capacityAllocation).length >= 4`), so the two systems share a definition of "spread thin".
- **Crisis code**: code health below zero

| Stress | Maturity change per week |
|---|---|
| Neither signal | +0.175 (ramp) |
| One signal | -0.20 |
| Both signals | -0.30 |

### Floor and recovery

Maturity floors at 0.0. Once stress clears, the same +0.175 ramp resumes from the current value. A practice can be erased back to zero by sustained stress and rebuilt from scratch when conditions stabilise.

## What players experience

A player who completes TDD in week 3 sees only a 30% × 50% = 15% bug reduction at code health 0 in week 4. By week 7 they hit full maturity and see the full 50% reduction. In week 10 they push WIP to five items chasing a deadline. Over the next three weeks their TDD maturity slips to 40%. They face a choice: pull WIP back to preserve discipline, or accept a half-strength bonus while shipping more.

The lesson is the trade-off, not the optimisation. There is no recipe.

## State shape

Add to game state:

```javascript
activeBonuses: [
  {
    type: 'reduceBugProbability',     // matches IMPROVEMENTS[*].ongoingBonus
    sourceImprovement: 'adoptTDD',    // for traceability and UI labelling
    maturity: 0.3,                    // 0.0 to 1.0
    completedWeek: 5
  }
]
```

Initialised to `[]` in `startNewGame` for every scenario.

## Function changes

### New pure functions in `BusinessRules.js`

- `getBonusStrength(activeBonuses, type, context)` — looks up the active bonus of the given type, returns the contextual multiplier scaled by maturity. Returns 0 if no such bonus is active.
- `updateBonusMaturity(activeBonuses, metrics, allocatedItemCount)` — pure function returning a new array with maturity values advanced one week, applying ramp or decay per the rules above. `allocatedItemCount` is the number of items in `state.capacityAllocation`.

### Modified existing functions

- `calculateBugProbability(codeHealth, activeBonuses = [])` — applies the TDD multiplier if `reduceBugProbability` is active.
- `calculateFeatureDelivery(feature, capacity, codeHealth, activeBonuses = [])` — applies the PP multiplier to `codeHealthDelta` if `reduceFeatureImpact` is active. Threads through the new `calculateBugProbability` signature.

Default empty arrays preserve existing test compatibility.

### Modified store logic in `gameStore.js`

- `endWeek` — when an improvement completes and has `ongoingBonus`, push a new entry to `state.activeBonuses` with maturity 0.3 and `completedWeek = newWeek`.
- `endWeek` — after processing completions, call `updateBonusMaturity` and replace `state.activeBonuses`. Order matters: read bonuses before updating them, so the week's outcomes use start-of-week maturity, and the update happens at week boundary.

## Visibility

Players cannot make informed decisions about WIP or crisis without seeing the bonus state.

Add a section to `GameHeader.svelte` showing each active bonus:

- Practice name (from `IMPROVEMENTS[sourceImprovement].name`)
- Maturity bar (visual 0–100%)
- Status indicator: building (ramp), mature (at 1.0), or eroding (decaying)
- Hover tooltip with current effect strength in plain language ("currently reducing bugs by 35%")

Specific layout left to implementation. The neobrutalist palette and existing card patterns should accommodate it cleanly.

## Testing

### Unit tests in `BusinessRules.test.js`

- `getBonusStrength`: returns 0 with no active bonus; returns context-appropriate multiplier scaled by maturity; covers all three code health bands and three complexity tiers
- `updateBonusMaturity`: ramps under stable conditions; decays under WIP-only, crisis-only, and combined stress; floors at 0; recovers after stress clears
- `calculateBugProbability` with TDD active: reduction matches table at full maturity; partial reduction at partial maturity
- `calculateFeatureDelivery` with PP active: code-health cost reduced per complexity tier

### Integration tests in `gameStore.test.js`

- Completing Pair Programming creates an active bonus at maturity 0.3
- Bonus reaches 1.0 four weeks after completion under stable conditions
- Bonus erodes to 0 over five weeks of sustained dual-signal stress
- Bonus recovers after stress clears

### Balance verification (manual)

Play one full Greenfield run with TDD adopted in week 3. Verify that bug rate is visibly lower in late game compared to a control run without TDD. Repeat for a Legacy run with Pair Programming. Confirm neither practice creates an obvious dominant strategy.

## Out of scope

- **New ongoing-bonus types** beyond `reduceBugProbability` and `reduceFeatureImpact`. The mechanism is generic enough to extend later, but only these two ship in this change.
- **Multiple instances of the same practice**. The current improvement model is one-shot per practice. If the design later allows reinvestment, stacking rules will need a separate decision.
- **Bonus effects on metrics other than code-health-cost and bug probability**. No interaction with capacity, satisfaction, or market position is added here.

## Open questions

None at design time. Numbers may need tuning during balance verification.
