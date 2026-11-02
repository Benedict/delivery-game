// src/lib/simulation/random.test.js
import { describe, it, expect } from 'vitest';
import { seededRng, fixedRng, randomInt, pick } from './random.js';

describe('random', () => {
  it('seededRng repeats the same sequence for the same seed', () => {
    const a = seededRng(42);
    const b = seededRng(42);
    const seqA = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(seqA);
    seqA.forEach(n => {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    });
  });

  it('seededRng differs between seeds', () => {
    expect(seededRng(1)()).not.toBe(seededRng(2)());
  });

  it('randomInt covers the inclusive range ends', () => {
    expect(randomInt(fixedRng(0), 2, 4)).toBe(2);
    expect(randomInt(fixedRng(0.999), 2, 4)).toBe(4);
  });

  it('pick chooses by position', () => {
    expect(pick(fixedRng(0), ['a', 'b', 'c'])).toBe('a');
    expect(pick(fixedRng(0.99), ['a', 'b', 'c'])).toBe('c');
  });
});
