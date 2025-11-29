// src/lib/simulation/ScenarioDefinitions.js

/**
 * Scenario definitions for different game modes
 */
export const SCENARIOS = {
  startup: {
    id: 'startup',
    name: 'The Startup',
    description: 'You\'re the CTO of a fast-growing startup. Ship features quickly to capture market share, but don\'t let technical debt sink you.',
    initialMetrics: {
      capacity: 120,
      codeHealth: 70,
      satisfaction: 50,
      marketPosition: 50,
      businessValue: 0
    },
    victoryConditions: {
      businessValue: 500,
      weeks: 15,
      description: 'Reach $500K in business value within 15 weeks'
    },
    story: {
      opening: 'You\'ve just raised a seed round for your startup. Investors are excited, but they want to see rapid growth. Your small team is talented but the codebase was built quickly. Can you balance speed with sustainability?',
      challenge: 'High pressure to ship features fast while maintaining code quality'
    }
  },

  enterprise: {
    id: 'enterprise',
    name: 'The Legacy System',
    description: 'Inherit a critical enterprise system with years of technical debt. Modernize it without breaking production.',
    initialMetrics: {
      capacity: 80,
      codeHealth: -20,
      satisfaction: 60,
      marketPosition: 40,
      businessValue: 0
    },
    victoryConditions: {
      businessValue: 400,
      codeHealth: 50,
      weeks: 20,
      description: 'Deliver $400K in value AND improve code health to 50+ within 20 weeks'
    },
    story: {
      opening: 'You\'re the new VP of Engineering at a large enterprise. The legacy system is critical but crumbling. Years of "quick fixes" have left the codebase in crisis. The business needs new features, but every change risks breaking production.',
      challenge: 'Dig out of massive technical debt while delivering business value'
    }
  },

  greenfield: {
    id: 'greenfield',
    name: 'The Greenfield Project',
    description: 'Start fresh with a new project. Build it right from the beginning and maintain high quality.',
    initialMetrics: {
      capacity: 100,
      codeHealth: 80,
      satisfaction: 50,
      marketPosition: 50,
      businessValue: 0
    },
    victoryConditions: {
      businessValue: 600,
      codeHealth: 70,
      weeks: 15,
      description: 'Deliver $600K in value while maintaining 70+ code health'
    },
    story: {
      opening: 'You\'re building a brand new product from scratch. You have the rare opportunity to do things right from the start. But can you maintain quality as pressure mounts to ship faster?',
      challenge: 'Build sustainable architecture while proving business value'
    }
  }
};

/**
 * Get scenario by ID
 * @param {string} scenarioId - Scenario identifier
 * @returns {object} Scenario configuration
 */
export function getScenario(scenarioId) {
  return SCENARIOS[scenarioId] || SCENARIOS.startup;
}

/**
 * Get scenario story content
 * @param {string} scenarioId - Scenario identifier
 * @returns {object} Story content with opening and challenge
 */
export function getScenarioStory(scenarioId) {
  const scenario = getScenario(scenarioId);
  return scenario.story;
}
