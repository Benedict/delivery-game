// src/lib/simulation/metrics.js

/** Code health, satisfaction and market position all live on this scale. */
export const SCORE_MIN = -100;
export const SCORE_MAX = 100;

/**
 * Keep a score metric within [SCORE_MIN, SCORE_MAX].
 * @param {number} value
 * @returns {number}
 */
export function clampScore(value) {
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, value));
}
