// src/lib/simulation/EventSystem.test.js
import { describe, it, expect } from 'vitest';
import {
  checkForEvents,
  EVENTS,
  applyEventOutcome
} from './EventSystem.js';

describe('EventSystem', () => {
  it('should define event types', () => {
    expect(EVENTS.customerChurn).toBeDefined();
    expect(EVENTS.customerChurn.name).toBe('Customer Churn');
    expect(EVENTS.customerChurn.type).toBe('crisis');
  });

  it('should trigger customer churn when satisfaction is low', () => {
    const metrics = {
      satisfaction: 15,
      codeHealth: 50,
      marketPosition: 50,
      capacity: 100
    };
    const history = { weeksSinceLastChurn: 5 };

    const events = checkForEvents(metrics, history, 5);

    expect(events).toContainEqual(expect.objectContaining({
      event: EVENTS.customerChurn
    }));
  });

  it('should not trigger events when conditions not met', () => {
    const metrics = {
      satisfaction: 50,
      codeHealth: 60,
      marketPosition: 50,
      capacity: 100
    };
    const history = {};

    const events = checkForEvents(metrics, history, 3);

    expect(events).toEqual([]);
  });

  it('should trigger big client interest when market position is high', () => {
    const metrics = {
      satisfaction: 70,
      codeHealth: 60,
      marketPosition: 75,
      capacity: 100
    };
    const history = {};

    const events = checkForEvents(metrics, history, 4);

    const bigClient = events.find(e => e.event.id === 'bigClient');
    expect(bigClient).toBeDefined();
  });

  it('should apply event outcomes to metrics', () => {
    const metrics = {
      businessValue: 200,
      satisfaction: 60,
      marketPosition: 50,
      capacity: 100,
      codeHealth: 50
    };

    const event = {
      event: EVENTS.customerChurn,
      outcome: {
        businessValueDelta: -50,
        satisfactionDelta: -10
      }
    };

    const newMetrics = applyEventOutcome(metrics, event);

    expect(newMetrics.businessValue).toBe(150);
    expect(newMetrics.satisfaction).toBe(50);
  });
});

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
