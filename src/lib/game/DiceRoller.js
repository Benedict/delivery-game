/**
 * Roll a single six-sided die
 * @returns {number} Result between 1 and 6
 */
export function rollSingleDie() {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Roll multiple dice and return individual results
 * @param {number} count - Number of dice to roll
 * @returns {number[]} Array of individual die results
 */
export function rollDice(count) {
  return Array.from({ length: count }, () => rollSingleDie());
}

/**
 * Roll dice and return the sum
 * @param {number} count - Number of dice to roll
 * @returns {number} Sum of all dice
 */
export function rollAndSum(count) {
  return rollDice(count).reduce((sum, die) => sum + die, 0);
}
