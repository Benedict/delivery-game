// src/lib/simulation/StoryEngine.test.js
import { describe, it, expect } from 'vitest';
import {
  generateFeatureStory,
  generateImprovementStory,
  generateEventStory,
  generateWeekSummary
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
    const improvement = { name: 'Fix Critical Bugs', description: 'Stabilize the codebase' };
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
