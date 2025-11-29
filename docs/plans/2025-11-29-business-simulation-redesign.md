# Business Simulation Redesign

**Date:** November 29, 2025
**Status:** Design Complete
**Approach:** Complete redesign of Dice of Debt as story-based business simulation

## Vision

Transform the dice game into a business simulation that teaches how technical debt affects business outcomes. Replace dice mechanics with a narrative-driven experience that connects code quality to optionality, flow, agility, and business success.

## Core Concept

Players manage a software development team over 10 weeks. Each week they face a strategic choice: deliver features to build business value, or invest in code quality to maintain long-term velocity. The game reveals how technical decisions create business consequences through interconnected metrics and dynamic events.

## Game Flow

### Entry Experience

**Story Introduction**
Players see a narrative setup explaining they manage a software team. The introduction establishes stakes and context without jargon.

**Scenario Selection**
Players choose one of three scenarios:
- **Startup Sprint**: Rapid growth under investor pressure
- **Enterprise Modernization**: Rescue a legacy system
- **Greenfield Project**: Build right from the start

Each scenario sets different starting conditions and business contexts.

**Interactive Tutorial**
A guided 3-week playthrough teaches core mechanics:
- Week 1: Feature delivery and business value
- Week 2: Technical debt accumulation
- Week 3: Improvement investments

### Main Game Loop

Each of 10 weeks follows this structure:

1. **Business Opportunities Arrive**: 2-3 feature requests with business value estimates
2. **Team Status Update**: Current capacity, code health, business metrics
3. **Player Decision**: Deliver features OR invest in improvements
4. **Week Execution**: System calculates outcomes based on code health and capacity
5. **Results & Events**: Show delivered work, triggered events, updated metrics
6. **Week Advances**: Update team state, move to next week

## Metrics System

The game tracks four interconnected metric categories. Metrics can go negative to represent crisis states.

### Technical Metrics

**Code Health** (-100 to 100)
Decreases when delivering features. Increases with refactoring. Negative values represent actively harmful code where each change breaks existing functionality.

**Team Capacity** (points per week, can go negative)
Base 100, modified by code health and improvements. Low code health reduces capacity as teams spend time fighting bugs. Negative capacity means firefighting mode—more time fixing than building.

**Flow Efficiency** (percentage)
Measures how much capacity goes to new work versus rework and firefighting. Calculated from code health.

### Business Metrics

**Business Value Delivered** (cumulative, can go negative)
Features shipped multiplied by their business value. Can go negative when bug costs, refunds, and lost deals outweigh delivered value. Primary score.

**Customer Satisfaction** (-100 to 100)
Increases with feature delivery. Decreases with bugs and delays. Negative values represent angry customers, churn, and bad reviews. Affects future opportunities.

**Market Position** (-100 to 100)
Competitive standing. High satisfaction plus consistent delivery improves it. Negative values represent damaged brand and lost trust.

### Opportunity Metrics

**Available Opportunities**
Feature requests in queue with value and urgency.

**Missed Opportunities**
Requests that expired because delivery was too slow.

**Strategic Options**
High-value opportunities unlocked only by high agility (good code health plus capacity).

### Metric Connections

Low code health reduces capacity, which slows delivery, which causes missed opportunities, which lowers market position, which reduces future opportunities. This creates a reinforcing negative cycle. Investing in code quality breaks the cycle but costs short-term velocity.

## Decision Mechanics

Each week presents a choice between two modes.

### Feature Delivery Mode

Players see 2-3 available feature requests:
- Business value (e.g., "Customer Portal: 45 value, 2-week deadline")
- Complexity (affected by code health—low health makes features take longer and create more bugs)
- Risk (higher value features in poor codebases create more debt)

Players select features to work on. The system calculates:
- Value delivered (modified by code health and capacity)
- Code health impact (each feature reduces code health 5-15 points depending on current state)
- Bug probability (poor code health means features ship with bugs, hitting customer satisfaction)

### Improvement Investment Mode

Players invest capacity in improvements:
- **Quick wins**: "Fix critical bugs" (1 week, +10 code health, +5 customer satisfaction)
- **Process improvements**: "Implement code reviews" (2 weeks, ongoing quality boost on future features)
- **Major refactoring**: "Rewrite payment module" (3 weeks, +30 code health, -15 capacity during work)
- **Team growth**: "Hire senior engineer" (permanent +20 capacity, costs business value)

### Strategic Tension

Features build value now but degrade code health. Improvements cost time now but enable better future velocity and unlock high-value opportunities.

## Business Events & Opportunities

Events trigger based on metrics and choices, creating narrative moments.

### Positive Events

**Big Client Interest** (Market Position >70)
High-value opportunity unlocked, but complex requirements.

**Talent Attraction** (Customer Satisfaction >60)
Hire at reduced cost.

**Industry Recognition** (Consistent delivery)
Market position boost, easier feature delivery.

### Crisis Events

**Customer Churn** (Satisfaction <20)
Lose -50 business value, ongoing penalties.

**Engineering Exodus** (Code Health <10 for 3+ weeks)
Lose -30 capacity permanently.

**Security Incident** (Code Health <0)
Emergency 2-week fix, -100 business value, -40 satisfaction.

### Pressure Events

**Competitor Launch** (random)
Deliver feature within 2 weeks or lose market position.

**Sales Promise** (random)
Sales promised a feature—deliver or damage relationships.

**Technical Debt Reckoning** (Code Health <30)
Bug cascade forces 1-week stabilization.

### Strategic Opportunities

These appear only with high capacity and decent code health:
- **Pivot Opportunity**: New market direction, 3x value but requires 4 weeks
- **Partnership Offer**: Integrate with major platform, permanent value boost
- **Acquisition Interest**: Someone wants to buy you (alternate win condition)

### Opportunity Queue

Feature requests have deadlines. Miss the deadline, lose the opportunity forever. High-value opportunities require higher code quality to execute successfully. Low code health restricts you to small, low-risk features.

## Scenario System

Three scenarios create distinct strategic challenges.

### Startup Sprint

**Context**
"You're the founding engineer at a funded startup. Investors expect rapid growth. Ship features fast or run out of runway."

**Starting State**
- Capacity: 120
- Code Health: 70
- Duration: 12 weeks until runway ends

**Business Pressure**
High—4-5 feature requests per week, aggressive deadlines.

**Victory Conditions**
- Primary: Reach 500 business value before week 10
- Bonus: Maintain code health >40 (sustainable growth ending)
- Alternate: Get acquired (triggered by high market position)

**Unique Mechanic**
Burn rate—lose -20 business value per week (represents costs). Must deliver to stay positive.

### Enterprise Modernization

**Context**
"You inherited a legacy system. The business depends on it, but it's holding you back. Modernize without breaking production."

**Starting State**
- Capacity: 80
- Code Health: -20
- Customer Satisfaction: 60

**Business Pressure**
Medium—2-3 features per week, but can't afford downtime.

**Victory Conditions**
- Primary: Code health >50 by week 10 AND maintain customer satisfaction >40
- Bonus: Deliver 300+ business value while modernizing

**Unique Mechanic**
Stability requirement—if code health drops below -40, forced 2-week recovery. Customers leave.

### Greenfield Project

**Context**
"New product, clean slate. Build it right from the start. Early decisions shape long-term success."

**Starting State**
- Capacity: 100
- Code Health: 80
- Feature slate: Blank

**Business Pressure**
Low at first, escalates—1-2 features early, 4-5 by week 8.

**Victory Conditions**
- Primary: 400 business value AND code health >60 (sustainable business)
- Bonus: Unlock "Scale-up" ending (high metrics trigger growth opportunity)

**Unique Mechanic**
Technical foundation—early quality investments have 2x impact on long-term health.

## UI/UX Design

### Screen Layout

**Main Game Screen**
- **Top Bar**: Week counter (Week 3 of 10), scenario name, quick metrics (capacity, code health, satisfaction as colored indicators)
- **Center Stage**: Current decision focus
  - Story text describing the week's situation
  - Available choices (features OR improvements) as cards
  - Each card shows: name, description, cost, expected impact, risk level
- **Right Sidebar**:
  - Business metrics dashboard (compact, expandable)
  - Opportunity queue (upcoming features with deadlines)
  - Active improvements in progress
- **Bottom**: Timeline visualization showing past weeks' performance and upcoming milestones

### Visual Design Principles

**No Dice Imagery**
Use progress bars, capacity meters, health indicators.

**Business-First Language**
"Team Capacity: 85 pts/week" not "8 dice"

**Color Coding**
- Green: Good health
- Yellow: Warning
- Red: Crisis
- Blue: Opportunities

**Narrative Framing**
Each screen has story context, not just numbers.

**Progressive Disclosure**
Core metrics always visible. Details on hover or expand.

### Story Wrapper

Each week opens with a brief narrative moment:
"Week 4: The sales team is excited about the new customer portal. Meanwhile, the engineering team reports that the checkout system is becoming fragile..."

Then transition to decision screen.

### Results Presentation

After each week's decision, show:
1. **What happened**: "Your team delivered the Customer Portal feature" (with animation)
2. **Impact**: Metrics changed (with +/- indicators and brief explanations)
3. **Events triggered**: Any business events that occurred
4. **Next week preview**: Hint at upcoming opportunities or challenges

## Technical Architecture

### Core Architecture Layers

**Game Engine (Pure Logic)**
- `GameEngine.js`: Core simulation rules, metric calculations, state transitions
- `BusinessRules.js`: Formulas for how code health affects capacity, feature delivery
- `EventSystem.js`: Event triggers, conditions, outcomes
- `OpportunityGenerator.js`: Creates feature requests based on scenario and metrics
- `ScenarioDefinitions.js`: Starting conditions and victory criteria for each scenario

**State Management**
- `gameStore.js` (Svelte store): Single source of truth for game state

State shape:
```javascript
{
  scenario: 'startup' | 'enterprise' | 'greenfield',
  week: 1-10,
  metrics: {
    capacity,
    codeHealth,
    satisfaction,
    marketPosition,
    businessValue
  },
  opportunities: [
    { id, name, value, deadline, complexity }
  ],
  activeImprovements: [
    { id, name, weeksRemaining, impact }
  ],
  eventHistory: [
    { week, event, impact }
  ],
  weekHistory: [
    { week, decision, outcomes, metricsSnapshot }
  ]
}
```

**UI Components**
- `ScenarioSelect.svelte`: Choose scenario with previews
- `Tutorial.svelte`: Interactive 3-week guided experience
- `GameBoard.svelte`: Main game screen orchestrator
- `DecisionPanel.svelte`: Shows feature and improvement choices
- `MetricsDashboard.svelte`: Business metrics display
- `OpportunityQueue.svelte`: Feature request backlog
- `WeekResults.svelte`: Outcome animation and summary
- `StoryCard.svelte`: Narrative text presentation
- `EndGame.svelte`: Victory or defeat screen with story outcome

**Narrative Layer**
- `StoryEngine.js`: Generates contextual narrative text based on game state
- `EventNarratives.js`: Story text for each event type
- `OutcomeDescriptions.js`: Explains what happened and why in plain language

**Data Flow**
Player action → Store update → Engine calculations → Event checks → State mutation → UI reactivity

## Testing Strategy

### Unit Tests (TDD for Game Logic)

- `GameEngine.test.js`: Test all calculation formulas (how code health affects capacity, feature delivery outcomes)
- `BusinessRules.test.js`: Verify metric relationships and thresholds
- `EventSystem.test.js`: Test event triggering conditions and outcomes
- `OpportunityGenerator.test.js`: Verify feature request generation logic
- Target: 100% coverage of game logic

### Integration Tests

- `gameStore.test.js`: Test state management and action flows
- Component tests for critical user paths (scenario selection, decision making, week progression)
- Test scenario-specific rules and victory conditions

### Simulation Tests

Automated games that make specific choices and verify expected outcomes:
- "Always choose features" should lead to high value but code health crisis
- "Balance features and improvements" should achieve sustainable growth

## Implementation Approach

### Keep from Current Implementation

- Testing infrastructure (Vitest, @testing-library/svelte)
- Build setup (SvelteKit, Tailwind, Vite)
- Git workflow and project structure

### Rebuild from Scratch

- All game logic (different mechanics)
- All UI components (different presentation)
- Store structure (different state shape)

### Development Strategy

1. Start with GameEngine core logic using TDD
2. Build one scenario end-to-end before adding others
3. Implement tutorial last (once core game feels right)
4. Add events and opportunities incrementally

### Migration Path

- Create new `/src/lib/simulation/` directory for new game logic
- Keep old `/src/lib/game/` temporarily for reference
- Build new components in `/src/lib/components/simulation/`
- Replace `routes/+page.svelte` when ready to switch over
- Clean up old code after new version works

## Success Criteria

The redesign succeeds if players:
1. Understand the business impact of technical debt without seeing dice
2. Make strategic decisions based on business context, not game mechanics
3. Experience the tension between short-term delivery and long-term sustainability
4. Learn that code quality directly affects business agility and success
