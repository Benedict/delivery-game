// src/lib/simulation/random.js

/**
 * A random number source: returns a float in [0, 1), like Math.random.
 * Every function that needs chance takes one of these so tests and replays
 * can be deterministic.
 * @typedef {() => number} Rng
 */

/** @type {Rng} */
export const defaultRng = Math.random;

/**
 * Seeded pseudo-random generator (mulberry32). Same seed, same sequence.
 * @param {number} seed
 * @returns {Rng}
 */
export function seededRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * An rng that always returns the same value. Useful for pinning outcomes in tests.
 * @param {number} value - in [0, 1)
 * @returns {Rng}
 */
export function fixedRng(value) {
  return () => value;
}

/**
 * Pick a random integer in [min, max] inclusive.
 * @param {Rng} rng
 * @param {number} min
 * @param {number} max
 */
export function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * Pick a random element of a non-empty array.
 * @template T
 * @param {Rng} rng
 * @param {T[]} items
 * @returns {T}
 */
export function pick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}
