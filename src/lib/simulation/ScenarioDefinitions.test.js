// src/lib/simulation/ScenarioDefinitions.test.js
import { describe, it, expect } from 'vitest';
import {
  SCENARIOS,
  getScenario,
  getScenarioStory
} from './ScenarioDefinitions.js';

describe('ScenarioDefinitions', () => {
  it('should define three scenario types', () => {
    expect(SCENARIOS.startup).toBeDefined();
    expect(SCENARIOS.enterprise).toBeDefined();
    expect(SCENARIOS.greenfield).toBeDefined();
  });

  it('should have complete scenario configuration for startup', () => {
    const scenario = SCENARIOS.startup;

    expect(scenario.id).toBe('startup');
    expect(scenario.name).toBe('The Startup');
    expect(scenario.description).toBeDefined();
    expect(scenario.initialMetrics).toBeDefined();
    expect(scenario.initialMetrics.capacity).toBe(120);
    expect(scenario.initialMetrics.codeHealth).toBe(70);
  });

  it('should have different initial metrics for each scenario', () => {
    expect(SCENARIOS.startup.initialMetrics.capacity).toBe(120);
    expect(SCENARIOS.enterprise.initialMetrics.capacity).toBe(80);
    expect(SCENARIOS.greenfield.initialMetrics.capacity).toBe(100);
  });

  it('should get scenario by id', () => {
    const startup = getScenario('startup');
    expect(startup.id).toBe('startup');
    expect(startup.name).toBe('The Startup');
  });

  it('should return default scenario for invalid id', () => {
    const fallback = getScenario('invalid');
    expect(fallback.id).toBe('startup');
  });

  it('should provide scenario story with context', () => {
    const story = getScenarioStory('startup');

    expect(story).toBeDefined();
    expect(story.opening).toBeDefined();
    expect(story.challenge).toBeDefined();
    expect(story.opening).toContain('startup');
  });

  it('should have different stories for different scenarios', () => {
    const startupStory = getScenarioStory('startup');
    const enterpriseStory = getScenarioStory('enterprise');

    expect(startupStory.opening).not.toBe(enterpriseStory.opening);
    expect(enterpriseStory.opening).toContain('enterprise');
  });

  it('should define victory conditions for each scenario', () => {
    expect(SCENARIOS.startup.victoryConditions).toBeDefined();
    expect(SCENARIOS.startup.victoryConditions.businessValue).toBeDefined();
    expect(SCENARIOS.startup.victoryConditions.weeks).toBeDefined();
  });
});
