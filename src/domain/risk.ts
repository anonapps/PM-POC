import type { RiskLevel, RiskRating } from "./entities";

export type RiskMatrix = Readonly<
  Record<RiskRating, Readonly<Record<RiskRating, RiskLevel>>>
>;

export const DEFAULT_RISK_MATRIX: RiskMatrix = Object.freeze({
  Low: Object.freeze({ Low: "Low", Medium: "Low", High: "Medium" }),
  Medium: Object.freeze({ Low: "Low", Medium: "Medium", High: "High" }),
  High: Object.freeze({ Low: "Medium", Medium: "High", High: "High" }),
});

export function calculateRiskLevel(
  probability: RiskRating,
  impact: RiskRating,
  matrix: RiskMatrix = DEFAULT_RISK_MATRIX,
): RiskLevel {
  return matrix[probability][impact];
}
