// src/lib/simulation/StoryEngine.test.js
import { describe, it, expect } from 'vitest';
import {
  generateFeatureStory,
  generateImprovementStory,
  generateEventStory,
  generateWeekSummary,
  narrateWeek
} from './StoryEngine.js';

describe('StoryEngine', () => {
  it('should generate story for feature delivery without bugs', () => {
    const feature = { name: 'User Dashboard', value: 40 };
    const outcome = { valueDelivered: 40, hasBugs: false, satisfactionDelta: 4 };

    const story = generateFeatureStory(feature, outcome);

    expect(story).toBeDefined();
    expect(story).toContain('User Dashboard');
    expect(story).not.toContain('bugs');
  });

  it('should generate story for feature delivery with bugs', () => {
    const feature = { name: 'Payment Integration', value: 60 };
    const outcome = { valueDelivered: 45, hasBugs: true, satisfactionDelta: 0 };

    const story = generateFeatureStory(feature, outcome);

    expect(story).toBeDefined();
    expect(story).toContain('Payment Integration');
    expect(story.toLowerCase()).toContain('bug');
  });

  it('should generate story for improvement investments', () => {
    const improvement = { name: 'Fix Critical Bugs', description: 'Stabilise the codebase' };
    const outcome = { codeHealthDelta: 10, satisfactionDelta: 5 };

    const story = generateImprovementStory(improvement, outcome);

    expect(story).toBeDefined();
    expect(story).toContain('Fix Critical Bugs');
  });

  it('should generate story for triggered events', () => {
    const event = {
      event: {
        name: 'Customer Churn',
        type: 'crisis',
        description: 'Frustrated customers are leaving'
      }
    };

    const story = generateEventStory(event);

    expect(story).toBeDefined();
    expect(story).toContain('Customer Churn');
  });

  it('should generate different stories for different event types', () => {
    const crisisEvent = {
      event: { name: 'Security Incident', type: 'crisis', description: 'Critical vulnerability' }
    };

    const positiveEvent = {
      event: { name: 'Big Client', type: 'positive', description: 'Major client interested' }
    };

    const crisisStory = generateEventStory(crisisEvent);
    const positiveStory = generateEventStory(positiveEvent);

    expect(crisisStory).not.toBe(positiveStory);
  });

  it('should generate week summary with context', () => {
    const week = 5;
    const metrics = {
      businessValue: 200,
      codeHealth: 60,
      satisfaction: 70
    };
    const decisions = [
      { type: 'feature', feature: { name: 'Analytics' } }
    ];

    const summary = generateWeekSummary(week, metrics, decisions);

    expect(summary).toBeDefined();
    expect(summary).toContain('Week 5');
  });
});

describe('StoryEngine - narrateWeek', () => {
  const feature = { name: 'Search Functionality', value: 70 };
  const goodOutcome = { valueDelivered: 70, hasBugs: false };
  const churn = { event: { id: 'customerChurn', name: 'Customer Churn', description: 'Customers leave' }, week: 4 };

  it('puts events before deliveries', () => {
    const story = narrateWeek({
      week: 3,
      events: [churn],
      decisions: [{ type: 'feature', feature, outcome: goodOutcome }]
    });

    expect(story.indexOf('Customer Churn')).toBeLessThan(story.indexOf('Search Functionality'));
  });

  it('narrates improvements', () => {
    const story = narrateWeek({
      week: 3,
      events: [],
      decisions: [{ type: 'improvement', improvement: { name: 'Fix Critical Bugs' }, outcome: {} }]
    });

    expect(story).toContain('Fix Critical Bugs');
  });

  it('says the week is complete when nothing shipped', () => {
    expect(narrateWeek({ week: 3, events: [], decisions: [] })).toBe('Week 3 complete. Your team made progress on their work.');
  });
});

describe('StoryEngine - improvement stories', () => {
  const GENERIC = 'The team invested in this improvement';
  const improvements = {
    fixBugs: 'Fix Critical Bugs',
    codeReviews: 'Implement Pair Programming',
    refactorPayment: 'Refactor Payment Module',
    hireSenior: 'Hire Senior Engineer',
    adoptTDD: 'Adopt Test-Driven Development'
  };

  for (const [id, name] of Object.entries(improvements)) {
    it(`tells a specific story for ${name}`, () => {
      const story = generateImprovementStory({ id, name }, {});
      expect(story).toContain(name);
      expect(story).not.toContain(GENERIC);
    });
  }

  it('talks about pairing, not code reviews, for pair programming', () => {
    expect(generateImprovementStory({ id: 'codeReviews', name: 'Implement Pair Programming' }, {})).toMatch(/pair/i);
  });
});
