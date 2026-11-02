// src/lib/simulation/EventSystem.test.js
import { describe, it, expect } from 'vitest';
import {
  checkForEvents,
  EVENTS,
  applyEventOutcome,
  nextLowHealthStreak
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

  it('counts consecutive weeks of low code health and resets on recovery', () => {
    expect(nextLowHealthStreak({ codeHealth: 9 }, 2)).toBe(3);
    expect(nextLowHealthStreak({ codeHealth: 9 })).toBe(1);
    expect(nextLowHealthStreak({ codeHealth: 10 }, 2)).toBe(0);
  });

  it('triggers engineering exodus once the low-health streak reaches three weeks', () => {
    const metrics = { satisfaction: 50, codeHealth: 0, marketPosition: 50, capacity: 100 };
    const ids = (history) => checkForEvents(metrics, history, 2).map(e => e.event.id);

    expect(ids({ weeksLowHealth: 2 })).not.toContain('engineeringExodus');
    expect(ids({ weeksLowHealth: 3 })).toContain('engineeringExodus');
  });

  describe('cooldowns', () => {
    const lowSatisfaction = { satisfaction: 15, codeHealth: 50, marketPosition: 50, capacity: 100 };
    const churnAt = week => ({ events: [{ event: EVENTS.customerChurn, outcome: EVENTS.customerChurn.outcome, week }] });
    const firesChurn = (history, week) => checkForEvents(lowSatisfaction, history, week).some(e => e.event.id === 'customerChurn');

    it('gives every event a cooldown of at least one week', () => {
      Object.values(EVENTS).forEach(event => expect(event.cooldown).toBeGreaterThanOrEqual(1));
    });

    it('does not repeat an event during its cooldown', () => {
      const { cooldown } = EVENTS.customerChurn;

      expect(firesChurn(churnAt(5), 5 + cooldown - 1)).toBe(false);
    });

    it('can repeat an event once its cooldown has passed', () => {
      const { cooldown } = EVENTS.customerChurn;

      expect(firesChurn(churnAt(5), 5 + cooldown)).toBe(true);
    });
  });
});
