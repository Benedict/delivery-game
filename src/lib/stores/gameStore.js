// src/lib/stores/gameStore.js
import { writable } from 'svelte/store';
import { getScenario } from '../simulation/ScenarioDefinitions.js';
import { calculateFlowEfficiency } from '../simulation/GameEngine.js';
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

    deliverFeature: (feature) => {
      update(state => {
        if (!state || state.gameOver) return state;

        const outcome = calculateFeatureDelivery(feature, state.metrics.capacity, state.metrics.codeHealth);
        const newMetrics = applyFeatureOutcome(state.metrics, outcome);
        newMetrics.flowEfficiency = calculateFlowEfficiency(newMetrics.codeHealth);

        return {
          ...state,
          metrics: newMetrics,
          opportunities: state.opportunities.filter(opp => opp.id !== feature.id),
          history: {
            ...state.history,
            decisions: [
              ...state.history.decisions,
              {
                type: 'feature',
                week: state.week,
                feature,
                outcome
              }
            ]
          }
        };
      });
    },

    investInImprovement: (improvementId) => {
      update(state => {
        if (!state || state.gameOver) return state;

        const improvement = IMPROVEMENTS[improvementId];
        const outcome = calculateImprovementOutcome(improvement, state.metrics.capacity);
        const newMetrics = applyImprovementOutcome(state.metrics, outcome);
        newMetrics.flowEfficiency = calculateFlowEfficiency(newMetrics.codeHealth);

        return {
          ...state,
          metrics: newMetrics,
          history: {
            ...state.history,
            decisions: [
              ...state.history.decisions,
              {
                type: 'improvement',
                week: state.week,
                improvement,
                outcome
              }
            ]
          }
        };
      });
    },

    advanceWeek: () => {
      update(state => {
        if (!state || state.gameOver) return state;

        const newWeek = state.week + 1;

        // Check for events
        const triggeredEvents = checkForEvents(state.metrics, state.history, newWeek);
        let newMetrics = { ...state.metrics };

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

        return {
          ...state,
          week: newWeek,
          metrics: newMetrics,
          opportunities: newOpportunities,
          history: {
            events: [...state.history.events, ...triggeredEvents],
            decisions: state.history.decisions,
            weeklyMetrics
          },
          gameOver,
          victory
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
export const deliverFeature = (feature) => gameStore.deliverFeature(feature);
export const investInImprovement = (improvementId) => gameStore.investInImprovement(improvementId);
export const advanceWeek = () => gameStore.advanceWeek();
