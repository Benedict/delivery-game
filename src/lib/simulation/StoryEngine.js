// src/lib/simulation/StoryEngine.js

/**
 * Generate narrative text for feature delivery
 * @param {object} feature - Feature that was delivered
 * @param {object} outcome - Delivery outcome
 * @returns {string} Story text
 */
export function generateFeatureStory(feature, outcome) {
  if (outcome.hasBugs) {
    return `You shipped ${feature.name}, delivering $${outcome.valueDelivered}K in value. However, the team rushed it and introduced bugs. The engineering team is frustrated with the quality issues, and customer complaints are starting to come in.`;
  }

  if (outcome.valueDelivered >= feature.value * 0.9) {
    return `Great news! Your team successfully delivered ${feature.name}, generating $${outcome.valueDelivered}K in business value. The feature works well and customers are happy with the new functionality.`;
  }

  return `Your team delivered ${feature.name}, creating $${outcome.valueDelivered}K in value. While functional, the implementation took longer than expected due to technical debt slowing the team down.`;
}

/**
 * Generate narrative text for improvement investments
 * @param {object} improvement - Improvement that was invested in
 * @param {object} outcome - Investment outcome
 * @returns {string} Story text
 */
export function generateImprovementStory(improvement, outcome) {
  const stories = {
    'Fix Critical Bugs': `**${improvement.name}:** The team spent time addressing critical bugs and stabilizing the codebase. While no new features shipped, the system is more reliable and the team feels better about the code quality.`,
    'Implement Code Reviews': `**${improvement.name}:** You established a code review process. The team initially grumbled about the overhead, but they're starting to catch issues earlier and share knowledge more effectively.`,
    'Refactor Payment Module': `**${improvement.name}:** The team undertook a major refactoring of the payment system. It was painful to pause feature development, but the cleaner architecture will pay dividends in future velocity.`,
    'Hire Senior Engineer': `**${improvement.name}:** You brought on an experienced senior engineer. There's some onboarding overhead, but their expertise is already helping the team tackle complex problems more effectively.`
  };

  return stories[improvement.name] || `**${improvement.name}:** The team invested in this improvement, strengthening the foundation for future work.`;
}

/**
 * Generate narrative text for triggered events
 * @param {object} triggeredEvent - Event that occurred
 * @returns {string} Story text
 */
export function generateEventStory(triggeredEvent) {
  const { event } = triggeredEvent;

  const eventStories = {
    customerChurn: `⚠️  **${event.name}:** Frustrated by bugs and slow feature delivery, several key customers have churned to competitors. The sales team is panicking and blaming engineering.`,
    bigClient: `🎉 **${event.name}:** ${event.description}! This could be a game-changing deal if you can deliver what they need on time.`,
    engineeringExodus: `🚨 **${event.name}:** Fed up with the endless tech debt and fire-fighting, several engineers have quit. The remaining team is stretched thin and morale is at an all-time low.`,
    securityIncident: `🔥 **${event.name}:** ${event.description}. This is a full-blown crisis. All hands must drop everything to fix this immediately.`,
    competitorLaunch: `⚡ **${event.name}:** ${event.description}. You need to respond quickly or risk losing market share.`,
    talentAttraction: `✨ **${event.name}:** ${event.description}. Talented engineers are reaching out, attracted by your team's reputation for quality work.`
  };

  return eventStories[event.id] || `**${event.name}:** ${event.description}`;
}

/**
 * Generate summary of the week
 * @param {number} week - Week number
 * @param {object} metrics - Current metrics
 * @param {array} decisions - Decisions made this week
 * @returns {string} Summary text
 */
export function generateWeekSummary(week, metrics, decisions) {
  const healthStatus = metrics.codeHealth > 60 ? 'healthy' :
                       metrics.codeHealth > 30 ? 'concerning' :
                       metrics.codeHealth > 0 ? 'poor' : 'critical';

  const teamMorale = metrics.satisfaction > 60 ? 'high' :
                     metrics.satisfaction > 30 ? 'moderate' : 'low';

  let summary = `**Week ${week} Complete**\n\n`;
  summary += `Business Value: $${metrics.businessValue}K | Code Health: ${healthStatus} | Team Morale: ${teamMorale}\n\n`;

  if (decisions.length === 0) {
    summary += `The team didn't take any action this week.`;
  } else {
    summary += `This week, `;
    const actions = decisions.map(d => {
      if (d.type === 'feature') return `delivered ${d.feature.name}`;
      if (d.type === 'improvement') return `invested in ${d.improvement.name}`;
      return 'took action';
    });
    summary += actions.join(' and ') + '.';
  }

  return summary;
}
