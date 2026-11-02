// src/lib/simulation/EventSystem.js
import { clampScore } from './metrics.js';
import { defaultRng } from './random.js';

/**
 * Event definitions
 */
export const EVENTS = {
  customerChurn: {
    id: 'customerChurn',
    cooldown: 3, // weeks before it can trigger again
    name: 'Customer Churn',
    type: 'crisis',
    description: 'Frustrated customers are leaving for competitors',
    trigger: (metrics, history) => metrics.satisfaction < 20,
    outcome: {
      businessValueDelta: -50,
      satisfactionDelta: -10,
      marketPositionDelta: -5
    }
  },
  bigClient: {
    id: 'bigClient',
    cooldown: 4, // weeks before it can trigger again
    name: 'Big Client Interest',
    type: 'positive',
    description: 'A major client is interested in your product',
    trigger: (metrics, history) => metrics.marketPosition > 70,
    outcome: {
      opportunityUnlocked: {
        id: 'enterprise-deal',
        name: 'Enterprise Deal',
        value: 150,
        complexity: 'high',
        deadline: 3
      }
    }
  },
  engineeringExodus: {
    id: 'engineeringExodus',
    cooldown: 3, // weeks before it can trigger again
    name: 'Engineering Exodus',
    type: 'crisis',
    description: 'Frustrated engineers are leaving the team',
    trigger: (metrics, history) => {
      return metrics.codeHealth < LOW_HEALTH_THRESHOLD &&
             (history.weeksLowHealth || 0) >= 3;
    },
    outcome: {
      capacityDelta: -30,
      codeHealthDelta: -10
    }
  },
  securityIncident: {
    id: 'securityIncident',
    cooldown: 4, // weeks before it can trigger again
    name: 'Security Incident',
    type: 'crisis',
    description: 'Critical security vulnerability discovered in production',
    trigger: (metrics, history) => metrics.codeHealth < -50,
    outcome: {
      businessValueDelta: -100,
      satisfactionDelta: -40,
      marketPositionDelta: -20,
      forcedFix: true, // Must spend next 2 weeks fixing
      weeksRequired: 2
    }
  },
  competitorLaunch: {
    id: 'competitorLaunch',
    cooldown: 3, // weeks before it can trigger again
    name: 'Competitor Launch',
    type: 'pressure',
    description: 'A competitor just launched a similar feature',
    trigger: (metrics, history, week, rng) => {
      // Random event, 20% chance each week after week 3
      return week > 3 && rng() < 0.2;
    },
    outcome: {
      marketPositionDelta: -10,
      urgentFeature: {
        name: 'Competitive Response',
        value: 60,
        complexity: 'medium',
        deadline: 2
      }
    }
  },
  talentAttraction: {
    id: 'talentAttraction',
    cooldown: 4, // weeks before it can trigger again
    name: 'Talent Attraction',
    type: 'positive',
    description: 'Your good reputation attracts talented engineers',
    trigger: (metrics, history) => metrics.satisfaction > 60,
    outcome: {
      hiringCostReduction: 0.5 // Hiring costs 50% less
    }
  }
};

/** Code health below this counts towards the low-health streak. */
export const LOW_HEALTH_THRESHOLD = 10;

/**
 * Update the count of consecutive weeks with low code health.
 * @param {object} metrics - Metrics at the end of the week
 * @param {number} [previousStreak] - Streak before this week
 * @returns {number} New streak length
 */
export function nextLowHealthStreak(metrics, previousStreak = 0) {
  return metrics.codeHealth < LOW_HEALTH_THRESHOLD ? previousStreak + 1 : 0;
}

/**
 * Has this event fired too recently to fire again?
 * @param {object} event - Event definition
 * @param {object} history - Game history
 * @param {number} week - Current week
 */
export function isCoolingDown(event, history, week) {
  const lastFired = (history.events || [])
    .filter(past => past.event.id === event.id)
    .reduce((latest, past) => Math.max(latest, past.week), -Infinity);
  return week - lastFired < event.cooldown;
}

/**
 * Check which events should trigger this week
 * @param {object} metrics - Current metrics
 * @param {object} history - Game history, with weeksLowHealth already updated for this week
 * @param {number} week - Current week
 * @param {import('./random.js').Rng} [rng] - Random source
 * @returns {array} Triggered events
 */
export function checkForEvents(metrics, history, week, rng = defaultRng) {
  const triggeredEvents = [];

  // Check each event's trigger condition
  for (const event of Object.values(EVENTS)) {
    if (isCoolingDown(event, history, week)) continue;
    if (event.trigger(metrics, history, week, rng)) {
      triggeredEvents.push({
        event,
        outcome: event.outcome,
        week
      });
    }
  }

  return triggeredEvents;
}

/**
 * Apply event outcome to metrics
 * @param {object} metrics - Current metrics
 * @param {object} triggeredEvent - Event that occurred
 * @returns {object} Updated metrics
 */
export function applyEventOutcome(metrics, triggeredEvent) {
  const { outcome } = triggeredEvent;

  return {
    ...metrics,
    businessValue: metrics.businessValue + (outcome.businessValueDelta || 0),
    satisfaction: clampScore(metrics.satisfaction + (outcome.satisfactionDelta || 0)),
    marketPosition: clampScore(metrics.marketPosition + (outcome.marketPositionDelta || 0)),
    capacity: Math.max(0, metrics.capacity + (outcome.capacityDelta || 0)),
    codeHealth: clampScore(metrics.codeHealth + (outcome.codeHealthDelta || 0))
  };
}
