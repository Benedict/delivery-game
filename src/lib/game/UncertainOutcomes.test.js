import { describe, it, expect, vi } from "vitest";
import {
  generateMeasureCards,
  selectRandomCard,
  createUncertainGame,
} from "./UncertainOutcomes.js";

describe("UncertainOutcomes", () => {
  describe("generateMeasureCards", () => {
    it("should generate 4 cards per measure", () => {
      const cards = generateMeasureCards("reducedComplexity");
      expect(cards).toHaveLength(4);
    });

    it("should have 2 identical cards (common outcome)", () => {
      const cards = generateMeasureCards("reducedComplexity");
      const card1 = JSON.stringify(cards[0]);
      const card2 = JSON.stringify(cards[1]);
      expect(card1).toBe(card2);
    });

    it("should include varied costs and benefits", () => {
      const cards = generateMeasureCards("reducedComplexity");
      const costs = cards.map((c) => c.cost);
      const uniqueCosts = new Set(costs);
      expect(uniqueCosts.size).toBeGreaterThan(1);
    });
  });

  describe("selectRandomCard", () => {
    it("should select one card from the set", () => {
      const cards = generateMeasureCards("codeReview");
      const selected = selectRandomCard(cards);

      expect(selected).toBeDefined();
      expect(cards).toContainEqual(selected);
    });

    it("should use randomness", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.75);
      const cards = generateMeasureCards("codeReview");
      const selected = selectRandomCard(cards);

      expect(selected).toEqual(cards[3]);
      vi.restoreAllMocks();
    });
  });

  describe("createUncertainGame", () => {
    it("should create game with selected cards", () => {
      const game = createUncertainGame();

      expect(game.uncertainMode).toBe(true);
      expect(game.selectedCards).toBeDefined();
      expect(Object.keys(game.selectedCards)).toHaveLength(4);
    });

    it("should not reveal cards initially", () => {
      const game = createUncertainGame();

      expect(game.revealedCards).toEqual([]);
    });
  });
});
