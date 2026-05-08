// src/lib/simulation/EventSystem.js

/**
 * Event definitions
 */
export const EVENTS = {
  customerChurn: {
    id: 'customerChurn',
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
    name: 'Engineering Exodus',
    type: 'crisis',
    description: 'Frustrated engineers are leaving the team',
    trigger: (metrics, history) => {
      return metrics.codeHealth < 10 &&
             history.weeksLowHealth >= 3;
    },
    outcome: {
      capacityDelta: -30,
      codeHealthDelta: -10
    }
  },
  securityIncident: {
    id: 'securityIncident',
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
    name: 'Competitor Launch',
    type: 'pressure',
    description: 'A competitor just launched a similar feature',
    trigger: (metrics, history, week) => {
      // Random event, 20% chance each week after week 3
      return week > 3 && Math.random() < 0.2;
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

/**
 * Check which events should trigger this week
 * @param {object} metrics - Current metrics
 * @param {object} history - Game history
 * @param {number} week - Current week
 * @param {object} state - Game state (scenario, counters, flags)
 * @param {string} phase - 'pre' or 'post' (default 'pre')
 * @returns {array} Triggered events
 */
export function checkForEvents(metrics, history, week, state = {}, phase = 'pre') {
  const triggeredEvents = [];

  // Track low health streak
  const weeksLowHealth = metrics.codeHealth < 10
    ? (history.weeksLowHealth || 0) + 1
    : 0;

  const enrichedHistory = { ...history, weeksLowHealth };

  // Check each event's trigger condition
  for (const event of Object.values(EVENTS)) {
    const eventPhase = event.phase ?? 'pre';
    if (eventPhase !== phase) continue;
    if (event.trigger(metrics, enrichedHistory, week, state)) {
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
