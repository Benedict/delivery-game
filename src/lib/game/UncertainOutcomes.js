/**
 * Uncertain Outcomes Variant
 * Each TD-reducing measure has 4 possible cost/benefit cards
 * Players select cards randomly before the game starts
 */

const CARD_VARIANTS = {
  reducedComplexity: [
    { cost: 2, costDuration: 3, benefitType: "moveDice", benefitValue: 2 }, // Standard (2x)
    { cost: 2, costDuration: 3, benefitType: "moveDice", benefitValue: 2 },
    { cost: 4, costDuration: 2, benefitType: "moveDice", benefitValue: 3 }, // High cost, high benefit
    { cost: 3, costDuration: 3, benefitType: "moveDice", benefitValue: 2 }, // Medium variation
  ],
  codeReview: [
    { cost: 3, costDuration: 2, benefitType: "moveDice", benefitValue: 1 }, // Standard (2x)
    { cost: 3, costDuration: 2, benefitType: "moveDice", benefitValue: 1 },
    { cost: 2, costDuration: 2, benefitType: "moveDice", benefitValue: 1 }, // Lower cost
    { cost: 1, costDuration: 2, benefitType: "moveDice", benefitValue: 1 }, // Lowest cost
  ],
  continuousIntegration: [
    { cost: 1, costDuration: 2, benefitType: "reroll", benefitValue: 1 }, // Standard (2x)
    { cost: 1, costDuration: 2, benefitType: "reroll", benefitValue: 1 },
    { cost: 1, costDuration: 3, benefitType: "reroll", benefitValue: 2 }, // More rerolls, longer investment
    { cost: 1, costDuration: 3, benefitType: "moveDice", benefitValue: 1 }, // Different benefit
  ],
  increasedTestCoverage: [
    {
      cost: 1,
      costDuration: 3,
      benefitType: "subtractFromTD",
      benefitValue: 3,
    }, // Standard (2x)
    {
      cost: 1,
      costDuration: 3,
      benefitType: "subtractFromTD",
      benefitValue: 3,
    },
    { cost: 3, costDuration: 2, benefitType: "reroll", benefitValue: 2 }, // High cost, different benefit
    {
      cost: 2,
      costDuration: 2,
      benefitType: "subtractFromTD",
      benefitValue: 2,
    }, // Medium
  ],
};

/**
 * Generate all card variants for a measure
 * @param {string} measureId
 * @returns {object[]} Array of 4 card variants
 */
export function generateMeasureCards(measureId) {
  return CARD_VARIANTS[measureId] || [];
}

/**
 * Select a random card from a set
 * @param {object[]} cards
 * @returns {object} Selected card
 */
export function selectRandomCard(cards) {
  const index = Math.floor(Math.random() * cards.length);
  return cards[index];
}

/**
 * Create a game with Uncertain Outcomes variant
 * @returns {object} Game with selected cards
 */
export function createUncertainGame() {
  const measureIds = [
    "reducedComplexity",
    "codeReview",
    "continuousIntegration",
    "increasedTestCoverage",
  ];

  const selectedCards = {};
  measureIds.forEach((measureId) => {
    const cards = generateMeasureCards(measureId);
    selectedCards[measureId] = selectRandomCard(cards);
  });

  return {
    uncertainMode: true,
    selectedCards,
    revealedCards: [],
  };
}

/**
 * Reveal a card when measure is invested in
 * @param {object} game
 * @param {string} measureId
 * @returns {object} Card details
 */
export function revealCard(game, measureId) {
  if (!game.uncertainMode) {
    return null;
  }

  return game.selectedCards[measureId];
}
