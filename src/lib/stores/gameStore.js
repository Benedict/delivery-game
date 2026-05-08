// src/lib/stores/gameStore.js
import { writable } from 'svelte/store';
import { getScenario } from '../simulation/ScenarioDefinitions.js';
import { calculateFlowEfficiency, getComplexityPoints, calculateContextSwitchingPenalty, calculateWeeklyCapacity } from '../simulation/GameEngine.js';
import { calculateFeatureDelivery, applyFeatureOutcome, IMPROVEMENTS, calculateImprovementOutcome, applyImprovementOutcome, updateBonusMaturity, calculateWeeklyBurn, calculateConfidenceDelta } from '../simulation/BusinessRules.js';
import { checkForEvents, applyEventOutcome } from '../simulation/EventSystem.js';
import { generateOpportunities, checkDeadlines } from '../simulation/OpportunityGenerator.js';

function createGameStore() {
  const { subscribe, set, update } = writable(null);

  return {
    subscribe,
    update, // Exposed for test fixtures; not part of the public store API

    startNew: (scenarioId = 'startup') => {
      const scenario = getScenario(scenarioId);
      const metrics = { ...scenario.initialMetrics };
      metrics.flowEfficiency = calculateFlowEfficiency(metrics.codeHealth);

      const initialState = {
        scenario: scenarioId,
        week: 1,
        metrics,
        opportunities: generateOpportunities(scenarioId, 1, metrics, [], []),
        workInProgress: [], // Features/improvements being worked on
        capacityAllocation: {}, // { featureId: points }
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

      set(initialState);
    },

    // Start working on a feature (add to WIP)
    startFeature: (feature) => {
      update(state => {
        if (!state || state.gameOver) return state;

        // Prevent starting new work if there's a forced fix
        const hasForcedFix = state.workInProgress.some(item => item.forced);
        if (hasForcedFix) return state;

        const pointsNeeded = getComplexityPoints(feature.complexity);

        return {
          ...state,
          workInProgress: [...state.workInProgress, {
            ...feature,
            type: 'feature',
            pointsCompleted: 0,
            pointsNeeded,
            startedWeek: state.week
          }],
          opportunities: state.opportunities.filter(opp => opp.id !== feature.id)
        };
      });
    },

    // Start working on an improvement (add to WIP)
    startImprovement: (improvementId) => {
      update(state => {
        if (!state || state.gameOver) return state;

        // Prevent starting new work if there's a forced fix
        const hasForcedFix = state.workInProgress.some(item => item.forced);
        if (hasForcedFix) return state;

        const improvement = IMPROVEMENTS[improvementId];
        const pointsNeeded = improvement.weeks * 40; // Improvements take weeks * 40 points

        return {
          ...state,
          workInProgress: [...state.workInProgress, {
            ...improvement,
            type: 'improvement',
            pointsCompleted: 0,
            pointsNeeded,
            startedWeek: state.week
          }]
        };
      });
    },

    // Allocate capacity points to WIP items
    allocateCapacity: (allocation) => {
      update(state => {
        if (!state || state.gameOver) return state;

        return {
          ...state,
          capacityAllocation: allocation
        };
      });
    },

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

    // End the week and progress all WIP
    endWeek: () => {
      update(state => {
        if (!state || state.gameOver) return state;

        const newWeek = state.week + 1;
        let newMetrics = { ...state.metrics };
        const completedItems = [];
        let newWIP = [...state.workInProgress];
        let newActiveBonuses = [...state.activeBonuses];

        // Calculate weekly capacity
        const weeklyCapacity = calculateWeeklyCapacity(newMetrics.capacity, newMetrics.flowEfficiency);

        // Apply context switching penalty
        const activeItems = Object.keys(state.capacityAllocation).length;
        const efficiencyPenalty = calculateContextSwitchingPenalty(activeItems);

        // Progress WIP items
        newWIP = newWIP.map(item => {
          const allocated = state.capacityAllocation[item.id] || 0;
          const effectivePoints = Math.round(allocated * efficiencyPenalty);
          const newCompleted = item.pointsCompleted + effectivePoints;

          if (newCompleted >= item.pointsNeeded) {
            completedItems.push(item);
            return null; // Remove from WIP
          }

          return {
            ...item,
            pointsCompleted: newCompleted
          };
        }).filter(item => item !== null);

        // Process completed items
        const completionEvents = [];
        const newDecisions = [];
        completedItems.forEach(item => {
          if (item.type === 'feature') {
            const outcome = calculateFeatureDelivery(item, newMetrics.capacity, newMetrics.codeHealth, state.activeBonuses);
            newMetrics = applyFeatureOutcome(newMetrics, outcome);
            newDecisions.push({
              type: 'feature',
              week: newWeek,
              feature: item,
              outcome
            });
            completionEvents.push({ type: 'feature', hasBugs: outcome.hasBugs });
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
            completionEvents.push({ type: 'improvement' });
          }
        });

        newMetrics.flowEfficiency = calculateFlowEfficiency(newMetrics.codeHealth);

        // Check for events (pre-phase: existing events without explicit phase)
        const eventState = {
          scenario: state.scenario,
          consecutiveWeeksHighConfidence: state.consecutiveWeeksHighConfidence,
          acquisitionOfferDeclined: state.acquisitionOfferDeclined
        };

        const triggeredEvents = checkForEvents(newMetrics, state.history, newWeek, eventState, 'pre');
        triggeredEvents.forEach(event => {
          newMetrics = applyEventOutcome(newMetrics, event);

          // Handle forced fix events (like security incidents)
          if (event.outcome.forcedFix) {
            const securityFix = IMPROVEMENTS.securityFix;
            const pointsNeeded = securityFix.weeks * 40;

            // Add security fix to WIP
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

        newMetrics.flowEfficiency = calculateFlowEfficiency(newMetrics.codeHealth);

        // Advance bonus maturity based on end-of-week stress signals
        const allocatedItemCount = Object.keys(state.capacityAllocation).length;
        newActiveBonuses = updateBonusMaturity(newActiveBonuses, newMetrics, allocatedItemCount);

        // Apply burn rate for scenarios that have it (e.g. startup)
        const scenario = getScenario(state.scenario);
        if (scenario.mechanics?.burnRate) {
          const burn = calculateWeeklyBurn(newMetrics.capacity);
          newMetrics = { ...newMetrics, businessValue: newMetrics.businessValue - burn };
        }

        // Apply investor confidence delta for scenarios that track it (e.g. startup)
        let newLowCounter = state.consecutiveWeeksLowConfidence;
        let newHighCounter = state.consecutiveWeeksHighConfidence;

        if (scenario.mechanics?.investorConfidence) {
          const confidenceDelta = calculateConfidenceDelta(newMetrics, completionEvents, triggeredEvents);
          const newConfidence = Math.max(-100, Math.min(100, newMetrics.investorConfidence + confidenceDelta));
          newMetrics = { ...newMetrics, investorConfidence: newConfidence };

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

        // Check deadlines and generate new opportunities
        const { active, expired } = checkDeadlines(state.opportunities, newWeek);

        // Extract completed feature names from history
        const completedFeatureNames = [...state.history.decisions, ...newDecisions]
          .filter(d => d.type === 'feature')
          .map(d => d.feature.name);

        // Extract WIP feature names
        const wipFeatureNames = newWIP
          .filter(item => item.type === 'feature')
          .map(item => item.name);

        const newOpportunities = [
          ...active,
          ...generateOpportunities(state.scenario, newWeek, newMetrics, completedFeatureNames, wipFeatureNames)
        ];

        // Record weekly metrics
        const weeklyMetrics = [
          ...state.history.weeklyMetrics,
          { week: state.week, ...state.metrics }
        ];

        // Check lose condition: funding pulled after two consecutive low-confidence weeks
        let fundingPulled = false;
        if (scenario.mechanics?.investorConfidence && newLowCounter >= 2) {
          fundingPulled = true;
        }

        // Check victory conditions
        const { victory, gameOver } = checkVictoryConditions(
          newMetrics,
          newWeek,
          state.victoryConditions
        );

        const willEndGame = fundingPulled || gameOver;

        // Check for post-phase events (using JUST-UPDATED counter values)
        // Evaluated after lose/win checks so post-events cannot overlay the game-over screen
        const postEventState = {
          scenario: state.scenario,
          consecutiveWeeksHighConfidence: newHighCounter,
          acquisitionOfferDeclined: state.acquisitionOfferDeclined
        };

        const postEvents = checkForEvents(newMetrics, state.history, newWeek, postEventState, 'post');

        // Only route pendingDecision when the game is NOT ending this week
        let newPendingDecision = state.pendingDecision;
        if (!willEndGame) {
          postEvents.forEach(event => {
            // Acquisition offer routes to pendingDecision; other narrative events have empty outcome
            if (event.outcome?.pendingDecision === 'acquisition') {
              newPendingDecision = { type: 'acquisition', week: newWeek };
            }
          });
        }

        // Preserve allocations for items still in WIP
        const preservedAllocations = {};
        const hasForcedFix = newWIP.some(item => item.forced);

        newWIP.forEach(item => {
          if (item.forced) {
            // Force 100% allocation to forced fixes
            const weeklyCapacity = calculateWeeklyCapacity(newMetrics.capacity, newMetrics.flowEfficiency);
            preservedAllocations[item.id] = weeklyCapacity;
          } else if (!hasForcedFix && state.capacityAllocation[item.id]) {
            // Only preserve other allocations if there's no forced fix
            preservedAllocations[item.id] = state.capacityAllocation[item.id];
          }
        });

        return {
          ...state,
          week: newWeek,
          metrics: newMetrics,
          workInProgress: newWIP,
          capacityAllocation: preservedAllocations,
          opportunities: newOpportunities,
          activeBonuses: newActiveBonuses,
          consecutiveWeeksLowConfidence: newLowCounter,
          consecutiveWeeksHighConfidence: newHighCounter,
          pendingDecision: newPendingDecision,
          history: {
            events: [
              ...state.history.events,
              ...triggeredEvents,
              ...postEvents
            ],
            decisions: [...state.history.decisions, ...newDecisions],
            weeklyMetrics
          },
          gameOver: fundingPulled ? true : gameOver,
          victory: fundingPulled ? false : victory,
          lastWeekCompleted: completedItems,
          lastWeekEfficiency: efficiencyPenalty
        };
      });
    }
  };
}

function checkVictoryConditions(metrics, week, conditions) {
  // Check if player won
  const hasBusinessValue = metrics.businessValue >= conditions.businessValue;
  const hasCodeHealth = !conditions.codeHealth || metrics.codeHealth >= conditions.codeHealth;
  const withinTimeLimit = week <= conditions.weeks;

  if (hasBusinessValue && hasCodeHealth && withinTimeLimit) {
    return { victory: true, gameOver: true };
  }

  // Check if player lost (ran out of time)
  if (week > conditions.weeks) {
    return { victory: false, gameOver: true };
  }

  return { victory: false, gameOver: false };
}

export const gameStore = createGameStore();

// Action helpers
export const startNewGame = (scenarioId) => gameStore.startNew(scenarioId);
export const startFeature = (feature) => gameStore.startFeature(feature);
export const startImprovement = (improvementId) => gameStore.startImprovement(improvementId);
export const allocateCapacity = (allocation) => gameStore.allocateCapacity(allocation);
export const endWeek = () => gameStore.endWeek();
export const acceptAcquisition = () => gameStore.acceptAcquisition();
export const declineAcquisition = () => gameStore.declineAcquisition();
