// src/lib/simulation/OpportunityGenerator.js

const FEATURE_TEMPLATES = [
  { name: 'User Dashboard', value: 60, complexity: 'medium' },
  { name: 'Payment Integration', value: 90, complexity: 'high' },
  { name: 'Email Notifications', value: 45, complexity: 'low' },
  { name: 'Search Functionality', value: 70, complexity: 'medium' },
  { name: 'Mobile App', value: 120, complexity: 'high' },
  { name: 'Analytics Dashboard', value: 65, complexity: 'medium' },
  { name: 'Social Login', value: 50, complexity: 'low' },
  { name: 'Export Features', value: 40, complexity: 'low' },
  { name: 'API Integration', value: 75, complexity: 'medium' },
  { name: 'Admin Panel', value: 70, complexity: 'medium' }
];

const STRATEGIC_OPPORTUNITIES = [
  {
    name: 'Platform Pivot',
    description: 'Shift to new market segment',
    value: 200,
    complexity: 'high',
    deadline: 4,
    type: 'strategic'
  },
  {
    name: 'Enterprise Partnership',
    description: 'Partner with major platform',
    value: 250,
    complexity: 'high',
    deadline: 3,
    type: 'strategic'
  },
  {
    name: 'Acquisition Opportunity',
    description: 'Company wants to acquire you',
    value: 300,
    complexity: 'medium',
    deadline: 2,
    type: 'strategic',
    isVictory: true
  }
];

/**
 * Generate feature opportunities for the current week
 * @param {string} scenario - Current scenario
 * @param {number} week - Current week
 * @param {object} metrics - Current metrics
 * @param {array} completedFeatureNames - Names of features already delivered
 * @param {array} wipFeatureNames - Names of features currently in progress
 * @returns {array} Generated opportunities
 */
export function generateOpportunities(scenario, week, metrics, completedFeatureNames = [], wipFeatureNames = []) {
  const scenarioConfig = {
    startup: { min: 3, max: 5, valueMultiplier: 1.2 },
    enterprise: { min: 1, max: 3, valueMultiplier: 0.8 },
    greenfield: { min: 2, max: 4, valueMultiplier: 1.0 }
  };

  const config = scenarioConfig[scenario] || scenarioConfig.greenfield;

  // Filter out features that have already been completed or are in progress
  const unavailableNames = [...completedFeatureNames, ...wipFeatureNames];
  const availableTemplates = FEATURE_TEMPLATES.filter(
    template => !unavailableNames.includes(template.name)
  );

  // If all features completed, return empty array
  if (availableTemplates.length === 0) {
    return [];
  }

  // Market position affects opportunity quantity
  const marketBonus = metrics.marketPosition > 70 ? 1 : 0;
  const count = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min + marketBonus;

  const opportunities = [];
  const usedTemplates = new Set();

  for (let i = 0; i < count; i++) {
    // Pick random template we haven't used this week
    let template;
    let attempts = 0;
    do {
      template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
      attempts++;
    } while (usedTemplates.has(template.name) && attempts < 20);

    usedTemplates.add(template.name);

    opportunities.push({
      id: `${scenario}-${week}-${i}`,
      name: template.name,
      value: Math.round(template.value * config.valueMultiplier),
      complexity: template.complexity,
      deadline: Math.floor(Math.random() * 3) + 2, // 2-4 weeks
      createdWeek: week
    });
  }

  return opportunities;
}

/**
 * Check opportunity deadlines and mark expired ones
 * @param {array} opportunities - Current opportunities
 * @param {number} currentWeek - Current week
 * @returns {object} { active, expired }
 */
export function checkDeadlines(opportunities, currentWeek) {
  const active = [];
  const expired = [];

  opportunities.forEach(opp => {
    const age = currentWeek - opp.createdWeek;
    if (age > opp.deadline) {
      expired.push(opp);
    } else {
      active.push(opp);
    }
  });

  return { active, expired };
}

/**
 * Check if metrics unlock a strategic opportunity
 * @param {object} metrics - Current metrics
 * @param {number} week - Current week
 * @returns {object|null} Strategic opportunity or null
 */
export function unlockStrategicOpportunity(metrics, week) {
  // Require high agility: good capacity AND code health
  const hasAgility = metrics.capacity > 100 && metrics.codeHealth > 60;
  const hasMarket = metrics.marketPosition > 70;

  if (!hasAgility || !hasMarket) {
    return null;
  }

  // Only unlock after week 4
  if (week < 4) {
    return null;
  }

  // Pick random strategic opportunity
  const opp = STRATEGIC_OPPORTUNITIES[Math.floor(Math.random() * STRATEGIC_OPPORTUNITIES.length)];

  return {
    ...opp,
    id: `strategic-${week}`,
    createdWeek: week
  };
}
