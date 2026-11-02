// src/lib/simulation/StoryEngine.js

/**
 * Generate narrative text for feature delivery
 * @param {object} feature - Feature that was delivered
 * @param {object} outcome - Delivery outcome
 * @returns {string} Story text
 */
export function generateFeatureStory(feature, outcome) {
  if (outcome.hasBugs) {
    return `You shipped ${feature.name}, delivering £${outcome.valueDelivered}K in value. However, the team rushed it and introduced bugs. The engineering team is frustrated with the quality issues, and customer complaints are starting to come in.`;
  }

  if (outcome.valueDelivered >= feature.value * 0.9) {
    return `Great news! Your team successfully delivered ${feature.name}, generating £${outcome.valueDelivered}K in business value. The feature works well and customers are happy with the new functionality.`;
  }

  return `Your team delivered ${feature.name}, creating £${outcome.valueDelivered}K in value. While functional, the implementation took longer than expected due to technical debt slowing the team down.`;
}

/**
 * Generate narrative text for improvement investments
 * @param {object} improvement - Improvement that was invested in
 * @param {object} outcome - Investment outcome
 * @returns {string} Story text
 */
export function generateImprovementStory(improvement, outcome) {
  const stories = {
    fixBugs: `**${improvement.name}:** The team spent time addressing critical bugs and stabilising the codebase. While no new features shipped, the system is more reliable and the team feels better about the code quality.`,
    codeReviews: `**${improvement.name}:** You established pair programming. The team initially grumbled about the overhead, but they're catching issues earlier and sharing knowledge, so new features will do less damage to the codebase as the practice beds in.`,
    refactorPayment: `**${improvement.name}:** The team undertook a major refactoring of the payment system. It was painful to pause feature development, but the cleaner architecture will pay dividends in future velocity.`,
    hireSenior: `**${improvement.name}:** You brought on an experienced senior engineer. There's some onboarding overhead, but their expertise is already helping the team tackle complex problems more effectively.`,
    adoptTDD: `**${improvement.name}:** The team started writing tests first. It feels slower at the start, but as the habit sets in, fewer bugs will reach your customers.`
  };

  return stories[improvement.id] || `**${improvement.name}:** The team invested in this improvement, strengthening the foundation for future work.`;
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
  summary += `Business Value: £${metrics.businessValue}K | Code Health: ${healthStatus} | Team Morale: ${teamMorale}\n\n`;

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

/**
 * Narrate a finished week: events first (they are the news), then deliveries.
 * @param {import('./Game.js').WeekReport} report
 * @returns {string} Story text
 */
export function narrateWeek(report) {
  const eventStories = report.events.map(generateEventStory);
  const deliveryStories = report.decisions.map(decision =>
    decision.type === 'feature'
      ? generateFeatureStory(decision.feature, decision.outcome)
      : generateImprovementStory(decision.improvement, decision.outcome)
  );

  const finished = new Set(report.completed?.map(item => item.id) ?? []);
  const unfinished = (report.progress ?? []).filter(item => !finished.has(item.id));
  const progressStories = unfinished.map(item => item.pointsAdded > 0
    ? `${item.name}: ${item.pointsCompleted} of ${item.pointsNeeded} points done (+${item.pointsAdded} this week).`
    : `${item.name} made no progress: no capacity was allocated to it.`);

  if (deliveryStories.length === 0 && progressStories.length === 0) {
    progressStories.push(`Week ${report.week} complete. Your team had nothing to work on: start a feature or an improvement.`);
  }

  return [...eventStories, ...deliveryStories, ...progressStories].join('\n\n');
}
