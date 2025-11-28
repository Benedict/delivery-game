/**
 * Technical Debt Reducing Measures
 * Each measure has a cost (NV dice) and duration (sprints),
 * plus a benefit that activates after investment completes
 */

export const MEASURES = {
  reducedComplexity: {
    id: "reducedComplexity",
    name: "Reduced Complexity",
    description:
      "Remove 2 dice from the TD pool, add them to the NV pool for the rest of the game.",
    cost: 2, // NV dice per turn
    costDuration: 3, // turns
    benefitType: "moveDice", // Move dice from TD to NV pool
    benefitValue: 2, // number of dice to move
    commitment: "High",
    color: "blue",
  },
  codeReview: {
    id: "codeReview",
    name: "Code Review",
    description:
      "Remove 1 die from the TD pool, add it to the NV pool for the rest of the game.",
    cost: 3,
    costDuration: 2,
    benefitType: "moveDice",
    benefitValue: 1,
    commitment: "Low",
    color: "gray",
  },
  continuousIntegration: {
    id: "continuousIntegration",
    name: "Continuous Integration",
    description: "Re-roll once any TD dice each turn.",
    cost: 1,
    costDuration: 2,
    benefitType: "reroll",
    benefitValue: 1, // number of dice that can be rerolled
    commitment: "Medium",
    color: "green",
  },
  increasedTestCoverage: {
    id: "increasedTestCoverage",
    name: "Increased Test Coverage",
    description:
      "Subtract 3 from the TD total rolled each turn for the rest of the game.",
    cost: 1,
    costDuration: 3,
    benefitType: "subtractFromTD",
    benefitValue: 3,
    commitment: "Low",
    color: "yellow",
  },
};

/**
 * Get a specific measure by ID
 * @param {string} measureId
 * @returns {object} Measure definition
 */
export function getMeasure(measureId) {
  return MEASURES[measureId];
}

/**
 * Get all measures as an array
 * @returns {object[]} Array of all measures
 */
export function getAllMeasures() {
  return Object.values(MEASURES);
}
