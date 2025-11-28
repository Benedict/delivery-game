import { describe, it, expect } from "vitest";
import { MEASURES, getMeasure, getAllMeasures } from "./TDMeasures.js";

describe("TDMeasures", () => {
  describe("measure definitions", () => {
    it("should have 4 measures defined", () => {
      const measures = getAllMeasures();
      expect(measures).toHaveLength(4);
    });

    it("should define Reduced Complexity correctly", () => {
      const measure = getMeasure("reducedComplexity");
      expect(measure.name).toBe("Reduced Complexity");
      expect(measure.cost).toBe(2);
      expect(measure.costDuration).toBe(3);
      expect(measure.benefitType).toBe("moveDice");
      expect(measure.benefitValue).toBe(2);
    });

    it("should define Code Review correctly", () => {
      const measure = getMeasure("codeReview");
      expect(measure.name).toBe("Code Review");
      expect(measure.cost).toBe(3);
      expect(measure.costDuration).toBe(2);
      expect(measure.benefitType).toBe("moveDice");
      expect(measure.benefitValue).toBe(1);
    });

    it("should define Continuous Integration correctly", () => {
      const measure = getMeasure("continuousIntegration");
      expect(measure.name).toBe("Continuous Integration");
      expect(measure.cost).toBe(1);
      expect(measure.costDuration).toBe(2);
      expect(measure.benefitType).toBe("reroll");
      expect(measure.benefitValue).toBe(1);
    });

    it("should define Increased Test Coverage correctly", () => {
      const measure = getMeasure("increasedTestCoverage");
      expect(measure.name).toBe("Increased Test Coverage");
      expect(measure.cost).toBe(1);
      expect(measure.costDuration).toBe(3);
      expect(measure.benefitType).toBe("subtractFromTD");
      expect(measure.benefitValue).toBe(3);
    });
  });
});
