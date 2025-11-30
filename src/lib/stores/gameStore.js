// src/lib/stores/gameStore.js
import { writable } from 'svelte/store';
import { getScenario } from '../simulation/ScenarioDefinitions.js';
import { calculateFlowEfficiency, getComplexityPoints, calculateContextSwitchingPenalty, calculateWeeklyCapacity } from '../simulation/GameEngine.js';
import { calculateFeatureDelivery, applyFeatureOutcome, IMPROVEMENTS, calculateImprovementOutcome, applyImprovementOutcome } from '../simulation/BusinessRules.js';
import { checkForEvents, applyEventOutcome } from '../simulation/EventSystem.js';
import { generateOpportunities, checkDeadlines } from '../simulation/OpportunityGenerator.js';

function createGameStore() {
  const { subscribe, set, update } = writable(null);

  return {
    subscribe,

    startNew: (scenarioId = 'startup') => {
      const scenario = getScenario(scenarioId);
      const metrics = { ...scenario.initialMetrics };
      metrics.flowEfficiency = calculateFlowEfficiency(metrics.codeHealth);

      const initialState = {
        scenario: scenarioId,
        week: 1,
        metrics,
        opportunities: generateOpportunities(scenarioId, 1, metrics),
        workInProgress: [], // Features/improvements being worked on
        capacityAllocation: {}, // { featureId: points }
        history: {
          events: [],
          decisions: [],
          weeklyMetrics: []
        },
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

    // End the week and progress all WIP
    endWeek: () => {
      update(state => {
        if (!state || state.gameOver) return state;

        const newWeek = state.week + 1;
        let newMetrics = { ...state.metrics };
        const completedItems = [];
        let newWIP = [...state.workInProgress];

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
        const newDecisions = [];
        completedItems.forEach(item => {
          if (item.type === 'feature') {
            const outcome = calculateFeatureDelivery(item, newMetrics.capacity, newMetrics.codeHealth);
            newMetrics = applyFeatureOutcome(newMetrics, outcome);
            newDecisions.push({
              type: 'feature',
              week: newWeek,
              feature: item,
              outcome
            });
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
        });

        newMetrics.flowEfficiency = calculateFlowEfficiency(newMetrics.codeHealth);

        // Check for events
        const triggeredEvents = checkForEvents(newMetrics, state.history, newWeek);
        triggeredEvents.forEach(event => {
          newMetrics = applyEventOutcome(newMetrics, event);
        });

        newMetrics.flowEfficiency = calculateFlowEfficiency(newMetrics.codeHealth);

        // Check deadlines and generate new opportunities
        const { active, expired } = checkDeadlines(state.opportunities, newWeek);
        const newOpportunities = [
          ...active,
          ...generateOpportunities(state.scenario, newWeek, newMetrics)
        ];

        // Record weekly metrics
        const weeklyMetrics = [
          ...state.history.weeklyMetrics,
          { week: state.week, ...state.metrics }
        ];

        // Check victory conditions
        const { victory, gameOver } = checkVictoryConditions(
          newMetrics,
          newWeek,
          state.victoryConditions
        );

        // Preserve allocations for items still in WIP
        const preservedAllocations = {};
        newWIP.forEach(item => {
          if (state.capacityAllocation[item.id]) {
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
          history: {
            events: [...state.history.events, ...triggeredEvents],
            decisions: [...state.history.decisions, ...newDecisions],
            weeklyMetrics
          },
          gameOver,
          victory,
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
