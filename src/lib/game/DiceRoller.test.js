import { describe, it, expect, vi } from "vitest";
import { rollDice, rollSingleDie, rollAndSum } from "./DiceRoller.js";

describe("DiceRoller", () => {
  describe("rollSingleDie", () => {
    it("should return a number between 1 and 6", () => {
      const result = rollSingleDie();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
      expect(Number.isInteger(result)).toBe(true);
    });

    it("should use Math.random for rolling", () => {
      const spy = vi.spyOn(Math, "random").mockReturnValue(0.5);
      const result = rollSingleDie();
      expect(result).toBe(4); // 0.5 * 6 = 3, floor(3) + 1 = 4
      spy.mockRestore();
    });
  });

  describe("rollDice", () => {
    it("should return array of correct length", () => {
      const result = rollDice(8);
      expect(result).toHaveLength(8);
    });

    it("should return all values between 1 and 6", () => {
      const result = rollDice(20);
      result.forEach((die) => {
        expect(die).toBeGreaterThanOrEqual(1);
        expect(die).toBeLessThanOrEqual(6);
      });
    });

    it("should return empty array for 0 dice", () => {
      const result = rollDice(0);
      expect(result).toEqual([]);
    });
  });

  describe("rollAndSum", () => {
    it("should return sum of all dice", () => {
      vi.spyOn(Math, "random")
        .mockReturnValueOnce(0) // 1
        .mockReturnValueOnce(0.5) // 4
        .mockReturnValueOnce(0.9); // 6

      const result = rollAndSum(3);
      expect(result).toBe(11);
      vi.restoreAllMocks();
    });

    it("should return 0 for 0 dice", () => {
      const result = rollAndSum(0);
      expect(result).toBe(0);
    });
  });
});
