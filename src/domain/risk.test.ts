import { describe, expect, it } from "vitest";

import { calculateRiskLevel, type RiskMatrix } from "./risk";
import { RISK_RATINGS } from "./entities";

describe("risk matrix", () => {
  it("implements all nine configured POC mappings", () => {
    const expected = [
      ["Low", "Low", "Low"], ["Low", "Medium", "Low"], ["Low", "High", "Medium"],
      ["Medium", "Low", "Low"], ["Medium", "Medium", "Medium"], ["Medium", "High", "High"],
      ["High", "Low", "Medium"], ["High", "Medium", "High"], ["High", "High", "High"],
    ] as const;
    for (const [probability, impact, level] of expected) {
      expect(calculateRiskLevel(probability, impact)).toBe(level);
    }
  });

  it("uses an injected matrix rather than arithmetic", () => {
    const allLow = Object.fromEntries(
      RISK_RATINGS.map((rating) => [
        rating,
        Object.fromEntries(RISK_RATINGS.map((impact) => [impact, "Low"])),
      ]),
    ) as RiskMatrix;
    expect(calculateRiskLevel("High", "High", allLow)).toBe("Low");
  });
});
