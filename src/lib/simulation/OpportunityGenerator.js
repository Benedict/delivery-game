// src/lib/simulation/OpportunityGenerator.js

const FEATURE_TEMPLATES = [
  { name: 'User Dashboard', value: 40, complexity: 'medium' },
  { name: 'Payment Integration', value: 60, complexity: 'high' },
  { name: 'Email Notifications', value: 30, complexity: 'low' },
  { name: 'Search Functionality', value: 50, complexity: 'medium' },
  { name: 'Mobile App', value: 80, complexity: 'high' },
  { name: 'Analytics Dashboard', value: 45, complexity: 'medium' },
  { name: 'Social Login', value: 35, complexity: 'low' },
  { name: 'Export Features', value: 25, complexity: 'low' },
  { name: 'API Integration', value: 55, complexity: 'medium' },
  { name: 'Admin Panel', value: 50, complexity: 'medium' }
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
 * @returns {array} Generated opportunities
 */
export function generateOpportunities(scenario, week, metrics) {
  const scenarioConfig = {
    startup: { min: 3, max: 5, valueMultiplier: 1.2 },
    enterprise: { min: 1, max: 3, valueMultiplier: 0.8 },
    greenfield: { min: 2, max: 4, valueMultiplier: 1.0 }
  };

  const config = scenarioConfig[scenario] || scenarioConfig.greenfield;

  // Market position affects opportunity quantity
  const marketBonus = metrics.marketPosition > 70 ? 1 : 0;
  const count = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min + marketBonus;

  const opportunities = [];
  const usedTemplates = new Set();

  for (let i = 0; i < count; i++) {
    // Pick random template we haven't used
    let template;
    let attempts = 0;
    do {
      template = FEATURE_TEMPLATES[Math.floor(Math.random() * FEATURE_TEMPLATES.length)];
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
