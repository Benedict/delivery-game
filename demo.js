// Demo of Business Simulation Game Engine
// Run with: node demo.js

import { createInitialMetrics, calculateCapacity, calculateFlowEfficiency } from './src/lib/simulation/GameEngine.js';
import { calculateFeatureDelivery, applyFeatureOutcome, IMPROVEMENTS, calculateImprovementOutcome, applyImprovementOutcome } from './src/lib/simulation/BusinessRules.js';
import { checkForEvents, applyEventOutcome } from './src/lib/simulation/EventSystem.js';
import { generateOpportunities, checkDeadlines } from './src/lib/simulation/OpportunityGenerator.js';

console.log('🎮 BUSINESS SIMULATION GAME ENGINE DEMO\n');
console.log('=' .repeat(60));

// Initialize game with startup scenario
console.log('\n📊 WEEK 1: GAME START (Startup Scenario)');
console.log('=' .repeat(60));

let metrics = createInitialMetrics('startup');
let week = 1;
let history = {};

function displayMetrics(metrics) {
  console.log('\nCurrent Metrics:');
  console.log(`  💪 Capacity: ${metrics.capacity}`);
  console.log(`  🏥 Code Health: ${metrics.codeHealth}`);
  console.log(`  😊 Team Satisfaction: ${metrics.satisfaction}`);
  console.log(`  📈 Market Position: ${metrics.marketPosition}`);
  console.log(`  💰 Business Value: ${metrics.businessValue}`);
  console.log(`  ⚡ Flow Efficiency: ${(metrics.flowEfficiency * 100).toFixed(0)}%`);
}

displayMetrics(metrics);

// Generate initial opportunities
console.log('\n🎯 Available Feature Opportunities:');
let opportunities = generateOpportunities('startup', week, metrics);
opportunities.slice(0, 3).forEach((opp, i) => {
  console.log(`  ${i + 1}. ${opp.name} - Value: ${opp.value}, Complexity: ${opp.complexity}, Deadline: ${opp.deadline} weeks`);
});

// Week 2: Deliver a feature
console.log('\n\n📊 WEEK 2: DELIVERING A FEATURE');
console.log('=' .repeat(60));
week = 2;

const feature = opportunities[0];
console.log(`\n🚀 Delivering: ${feature.name}`);
console.log(`   Complexity: ${feature.complexity}, Value: ${feature.value}`);

const deliveryOutcome = calculateFeatureDelivery(feature, metrics.capacity, metrics.codeHealth);
console.log('\n📋 Delivery Outcome:');
console.log(`  ✅ Value Delivered: ${deliveryOutcome.valueDelivered}`);
console.log(`  🐛 Has Bugs: ${deliveryOutcome.hasBugs ? 'YES ⚠️' : 'NO ✓'}`);
console.log(`  📉 Code Health Impact: ${deliveryOutcome.codeHealthDelta}`);
console.log(`  😊 Satisfaction Impact: ${deliveryOutcome.satisfactionDelta}`);

metrics = applyFeatureOutcome(metrics, deliveryOutcome);
displayMetrics(metrics);

// Check for events
const events = checkForEvents(metrics, history, week);
if (events.length > 0) {
  console.log('\n⚡ EVENTS TRIGGERED:');
  events.forEach(e => {
    console.log(`  ${e.event.name} (${e.event.type}): ${e.event.description}`);
  });
}

// Week 3: Invest in improvements
console.log('\n\n📊 WEEK 3: INVESTING IN IMPROVEMENTS');
console.log('=' .repeat(60));
week = 3;

console.log('\n🔧 Available Improvements:');
Object.values(IMPROVEMENTS).forEach((imp, i) => {
  console.log(`  ${i + 1}. ${imp.name} - ${imp.description}`);
  console.log(`     Duration: ${imp.weeks} weeks, Code Health: +${imp.codeHealthDelta}`);
});

const improvement = IMPROVEMENTS.fixBugs;
console.log(`\n✨ Investing in: ${improvement.name}`);

const improvementOutcome = calculateImprovementOutcome(improvement, metrics.capacity);
console.log('\n📋 Improvement Outcome:');
console.log(`  ⏱️  Duration: ${improvementOutcome.weeksRequired} weeks`);
console.log(`  🏥 Code Health: +${improvementOutcome.codeHealthDelta}`);
console.log(`  😊 Satisfaction: +${improvementOutcome.satisfactionDelta}`);

metrics = applyImprovementOutcome(metrics, improvementOutcome);
displayMetrics(metrics);

// Week 5: Show compound effects
console.log('\n\n📊 WEEK 5: DELIVERING ANOTHER FEATURE WITH BETTER CODE HEALTH');
console.log('=' .repeat(60));
week = 5;

const feature2 = { name: 'Analytics Dashboard', value: 45, complexity: 'medium', deadline: 3 };
console.log(`\n🚀 Delivering: ${feature2.name}`);

const deliveryOutcome2 = calculateFeatureDelivery(feature2, metrics.capacity, metrics.codeHealth);
console.log('\n📋 Delivery Outcome (with improved code health):');
console.log(`  ✅ Value Delivered: ${deliveryOutcome2.valueDelivered} (was ${deliveryOutcome.valueDelivered} in week 2)`);
console.log(`  🐛 Has Bugs: ${deliveryOutcome2.hasBugs ? 'YES ⚠️' : 'NO ✓'}`);
console.log(`  📉 Code Health Impact: ${deliveryOutcome2.codeHealthDelta} (less degradation!)`);

metrics = applyFeatureOutcome(metrics, deliveryOutcome2);
displayMetrics(metrics);

// Summary
console.log('\n\n📊 GAME SUMMARY');
console.log('=' .repeat(60));
console.log('\n🎯 Key Learnings:');
console.log('  1. Better code health = more capacity & fewer bugs');
console.log('  2. Improvements pay off in future feature delivery');
console.log('  3. Business value compounds as you maintain code health');
console.log('  4. Events create dynamic challenges and opportunities');
console.log('\n💡 Next Steps:');
console.log('  - Continue implementing Tasks 6-15 (UI, state management, story engine)');
console.log('  - Add more scenarios and strategic opportunities');
console.log('  - Build the full game experience!\n');
