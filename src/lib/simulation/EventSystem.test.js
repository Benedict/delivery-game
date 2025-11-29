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
