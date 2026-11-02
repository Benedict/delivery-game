// src/lib/simulation/EventSystem.js
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
    trigger: (metrics, history, week, state, rng) => {
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
  },
  investorCheckIn: {
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
  downRoundThreat: {
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
  acquisitionOffer: {
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
 * Has this event fired too recently to fire again? Events without a
 * cooldown manage their own timing in their trigger.
 * @param {object} event - Event definition
 * @param {object} history - Game history
 * @param {number} week - Current week
 */
export function isCoolingDown(event, history, week) {
  if (!event.cooldown) return false;
  const lastFired = (history.events || [])
    .filter(past => past.event?.id === event.id)
    .reduce((latest, past) => Math.max(latest, past.week), -Infinity);
  return week - lastFired < event.cooldown;
}

/**
 * Check which events should trigger this week
 * @param {object} metrics - Current metrics
 * @param {object} history - Game history, with weeksLowHealth already updated for this week
 * @param {number} week - Current week
 * @param {object} state - Game state (scenario, counters, flags)
 * @param {string} phase - 'pre' or 'post' (default 'pre')
 * @param {import('./random.js').Rng} [rng] - Random source
 * @returns {array} Triggered events
 */
export function checkForEvents(metrics, history, week, state = {}, phase = 'pre', rng = defaultRng) {
  const triggeredEvents = [];

  // Check each event's trigger condition
  for (const event of Object.values(EVENTS)) {
    const eventPhase = event.phase ?? 'pre';
    if (eventPhase !== phase) continue;
    if (isCoolingDown(event, history, week)) continue;
    if (event.trigger(metrics, history, week, state, rng)) {
      triggeredEvents.push({
        ...event,
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
    satisfaction: Math.max(-100, Math.min(100,
      metrics.satisfaction + (outcome.satisfactionDelta || 0)
    )),
    marketPosition: Math.max(-100, Math.min(100,
      metrics.marketPosition + (outcome.marketPositionDelta || 0)
    )),
    capacity: Math.max(0, metrics.capacity + (outcome.capacityDelta || 0)),
    codeHealth: metrics.codeHealth + (outcome.codeHealthDelta || 0)
  };
}
