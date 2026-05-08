# Startup Difficulty Redesign — Design

**Date:** 2026-05-08
**Status:** Design approved, ready for implementation plan

## Problem

The Startup scenario plays too easy. The other two scenarios carry unique pressure mechanics — Legacy has a stability requirement that forces a recovery loop under crisis, Greenfield has escalating feature load. Startup has only "high capacity, more features available" with no countervailing force. The original redesign spec called for a burn-rate mechanic to capture runway pressure, but it never landed in code.

Players who pick Startup currently grind features and walk to victory without grappling with the dynamics that make running a real startup hard: investor pressure, runway pressure, and the trade-off between visible momentum and sustainable practice.

## Goal

Make Startup feel like a startup. Add two new pressure systems that interact with existing mechanics:

1. **Capacity-tied burn rate** — every week, the team costs business value to run, scaled by capacity. Hiring grows output but also grows burn.
2. **Investor confidence** — a new metric that responds to strategic decisions (features versus improvements) and delivery quality. Lose investor confidence and they pull funding. Sustain high confidence and you may get acquired.

Together these give Startup a distinct pedagogical shape: time pressure, cash pressure, and reputation pressure, all reinforcing the lesson that no single strategy wins.

## Starting state

| Metric | Value |
|---|---|
| Capacity | 120 |
| Code Health | 70 |
| Customer Satisfaction | 50 |
| Market Position | 50 |
| Business Value | 0 |
| **Investor Confidence** | **50** (new) |

**Time limit:** 12 weeks (reduced from 15)
**Primary victory:** £500K business value before time runs out

## Burn rate

At the end of every week, business value drops by:

```
weeklyBurn = capacity × £0.20K
```

**Examples:**
- Capacity 120 (start): -£24K per week
- Capacity 140 (after hiring): -£28K per week
- Capacity 80 (after engineering exodus): -£16K per week

Over 12 weeks at starting capacity with no changes, total burn is -£288K. To win the primary victory, gross feature delivery must exceed £788K (£500K target plus £288K burn).

Burn applies after all feature delivery and event outcomes for the week, so the player sees their net BV change clearly in the week summary.

## Investor confidence

A new metric in the range -100 to 100, starting at 50. Only used in Startup.

### Per-event deltas

| Event | Δ Confidence |
|---|---|
| Feature ships, no bugs | +5 |
| Feature ships with bugs | -10 |
| Improvement completes | -5 |
| Security incident triggers | -25 |
| Customer churn event triggers | -15 |
| Engineering exodus event triggers | -20 |
| Big Client deal triggers | +15 |

### Per-week sustained signals

Applied at the end of every week:

| Condition | Δ Confidence per week |
|---|---|
| Customer satisfaction > 60 | +2 |
| Customer satisfaction < 20 | -3 |
| Code health < 0 | -3 |
| Market position > 60 | +2 |

Sustained signals accumulate so a steady state of "happy customers, healthy code" gradually rebuilds confidence between feature ships, while sustained bad metrics drag it down even between events. The signals are deliberately small so a single flip-flop week doesn't dominate.

Confidence is clamped to the range -100 to 100.

## Lose conditions

Any one of the following ends the game in failure:

- Time runs out without primary victory (same as other scenarios)
- **Investor Confidence ≤ -50 for two consecutive weeks** — funding pulled

A `consecutiveWeeksLowConfidence` counter increments each end-of-week the confidence is at or below -50, and resets to 0 if confidence rises above -50. The lose condition fires when the counter reaches 2.

The two-week grace period prevents one bad week from killing the game and gives the player room to recover.

## Win conditions

Either of the following wins:

- **Primary victory:** Reach £500K business value before week 12 ends
- **Acquisition victory:** A `consecutiveWeeksHighConfidence` counter increments each end-of-week the confidence is at or above 70, and resets to 0 if confidence falls below 70. When the counter reaches 3, the Acquisition Offer event triggers.

The Acquisition Offer event presents the player with a choice: accept or decline.

- Accept → game ends in alternate victory ("acquired"), regardless of business value
- Decline → confidence resets to 60, the high-confidence counter resets to 0, and the `acquisitionOfferDeclined` flag is set so the offer never re-triggers in the same playthrough

The reset to 60 captures "you turned them down — they trust you less now" and prevents the player from stacking multiple offers.

## Startup-specific events

The existing events (security incident, customer churn, big client, talent attraction, competitor launch, engineering exodus) all fire as today. Three new events are scoped to Startup only.

1. **Investor Check-in** — Triggers every 4 weeks (week % 4 === 0). Narrative-only event with no mechanical effect. Generates a story beat reading current confidence and metrics, reinforcing what investors care about.
2. **Down Round Threat** — Triggers the first time confidence drops below 0. One-shot. No mechanical effect, but serves as a clear in-game warning that confidence is heading toward fail territory.
3. **Acquisition Offer** — Triggers when the high-confidence counter reaches 3 AND `acquisitionOfferDeclined` is false. Presents the accept/decline choice described in the Win conditions section.

Only Acquisition Offer carries mechanical consequences. The other two are narrative beats. Keeping the new event count small avoids bloating the event system.

## Pedagogical shape

A player who picks Startup now faces three interacting pressures:

- **Time** (12 weeks) — same shape as before, tightened by three weeks
- **Cash** (burn rate) — every week of inaction or improvement-grind costs real BV. Pure improvement-grind drains BV into negative territory.
- **Reputation** (investor confidence) — pure feature-grind sustains confidence but lets code health collapse, which eventually triggers crisis events that crash confidence anyway

Intended losing patterns:
- "Just ship features" → confidence stays high, code health collapses, security incident or bug cascade hits, confidence drops, funding pulled
- "Just improve" → confidence drains, BV bleeds, time runs out before primary victory or confidence collapses first
- "Try to do everything at once" → too high WIP, context-switching penalties drag delivery, burn outpaces output

Intended winning patterns:
- "Earn-out grind": ship features, accept code-health debt, hit £500K before code crisis catches up
- "Sustainable growth": balance features and improvements, keep code health and confidence both stable, hit £500K
- "Acquisition path": prioritise sustained high satisfaction and market position, build confidence to 70+, accept the offer

## Order of operations within `endWeek`

The store's `endWeek` action gains several new steps. The exact order matters because event outcomes affect confidence, confidence affects counters, counters trigger new events.

1. Process WIP completions (features and improvements) — unchanged
2. Apply ongoing-bonus maturity update — unchanged
3. Run `checkForEvents` for existing global events (security incident, customer churn, etc.) and apply their outcomes — unchanged
4. **Apply burn rate** to business value — new
5. **Compute and apply investor confidence delta** using completed items, triggered events, and sustained-signal contributions from end-of-week metrics — new
6. **Update consecutive-week counters** for low-confidence and high-confidence states using the just-updated confidence — new
7. **Check lose conditions** (time runs out, low-confidence counter reaches 2) — extended
8. **Fire Startup-specific events** (investor check-in, down round threat, acquisition offer) using the just-updated counters and confidence — new
9. Generate next week's opportunities — unchanged

Burn rate fires before confidence delta because confidence does not depend on BV. Confidence delta fires before counter updates because counters track the new confidence value. Lose conditions fire before new events because a fail state should not show an acquisition offer in the same week.

## Acquisition offer player-choice flow

Player choices cannot resolve synchronously in `endWeek`, so the design uses a `pendingDecision` field on game state.

When the Acquisition Offer event triggers in step 8 above:

- Set `state.pendingDecision = { type: 'acquisition', week: currentWeek }`
- The UI watches `pendingDecision` and renders a modal when present, blocking other interaction
- The player clicks Accept or Decline
- Accept → new store action `acceptAcquisition()` sets `state.gameOver = true`, `state.victory = true`, `state.victoryType = 'acquisition'`, and clears `pendingDecision`
- Decline → new store action `declineAcquisition()` sets `state.metrics.investorConfidence = 60`, `state.consecutiveWeeksHighConfidence = 0`, `state.acquisitionOfferDeclined = true`, and clears `pendingDecision`

The modal is the only UI gate added. Other event types remain narrative-only and need no equivalent treatment.

## State shape

Modify the startup scenario in `ScenarioDefinitions.js`:

```javascript
startup: {
  // ... existing fields ...
  initialMetrics: {
    capacity: 120,
    codeHealth: 70,
    satisfaction: 50,
    marketPosition: 50,
    businessValue: 0,
    investorConfidence: 50  // new
  },
  victoryConditions: {
    businessValue: 500,
    weeks: 12,  // reduced from 15
    description: 'Reach £500K business value within 12 weeks'
  },
  mechanics: {
    burnRate: true,
    investorConfidence: true
  }
}
```

Add to game state in the store:

```javascript
{
  // ... existing fields ...
  consecutiveWeeksLowConfidence: 0,
  consecutiveWeeksHighConfidence: 0,
  acquisitionOfferDeclined: false,
  pendingDecision: null,        // { type: 'acquisition', week: number } when offer is on the table
  victoryType: null             // 'primary' | 'acquisition' on win, null otherwise
}
```

`investorConfidence` lives in `metrics` alongside other metrics. The consecutive-week counters and decline flag are top-level state because they are scenario-specific bookkeeping rather than displayed metrics.

The `mechanics` flag block lets the store and UI activate features only for scenarios that opt in. Legacy and Greenfield omit the flags and behave exactly as today.

## Implementation surface

Files to modify or create:

- **`src/lib/simulation/ScenarioDefinitions.js`** — add `investorConfidence` to startup's initialMetrics, set time limit to 12, add `mechanics` flag block
- **`src/lib/simulation/BusinessRules.js`** — new pure functions:
  - `calculateWeeklyBurn(capacity)` — returns burn amount in pounds (capacity × 0.20)
  - `calculateConfidenceDelta(metrics, completedItems, triggeredEvents)` — returns the total confidence change for the week, summing per-event and per-week sustained signals
- **`src/lib/simulation/EventSystem.js`** — three new events scoped to Startup:
  - `investorCheckIn` (week % 4 === 0)
  - `downRoundThreat` (first time confidence dips below 0)
  - `acquisitionOffer` (high-confidence counter reaches 3 AND not previously declined)
- **`src/lib/stores/gameStore.js`**:
  - Initialise consecutive-week counters and `acquisitionOfferDeclined` in `startNew`
  - In `endWeek`: apply burn rate, apply confidence deltas, update counters, check new lose/win conditions
  - Handle acquisition accept/decline as a player-choice event outcome
- **`src/lib/components/simulation/GameHeader.svelte`** — conditionally render investor confidence as a metric tile when `scenario.mechanics.investorConfidence` is true
- **`src/routes/+page.svelte`** — render an Acquisition Offer modal/dialogue with accept/decline buttons when the event fires

Test additions:
- **`BusinessRules.test.js`** — coverage for `calculateWeeklyBurn` and `calculateConfidenceDelta`
- **`EventSystem.test.js`** — coverage for the three new events' triggers
- **`gameStore.test.js`** — integration coverage for burn applied each week, confidence updates, lose-condition with grace period, acquisition-offer flow (both accept and decline paths)

## Out of scope

- **Other scenarios.** Burn rate and investor confidence are Startup-only. Legacy and Greenfield keep their current shape. The `mechanics` opt-in flag pattern leaves the door open for similar mechanics on other scenarios later, but no work on those is included here.
- **Fundraising as an active player resource.** No mechanic for the player to deliberately raise more capital mid-game. The "investor confidence" abstraction captures the relationship without requiring the player to manage a fundraise event manually.
- **Retuning Legacy or Greenfield.** No changes to those scenarios' numbers or mechanics.
- **Rebalancing the ongoing bonus mechanism (TDD, PP).** The recently-shipped bonuses interact with this work but are not retuned here.

## Open questions

None at design time. Numbers may need tuning during balance verification.
