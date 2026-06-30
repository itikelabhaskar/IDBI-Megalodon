// What-if simulator core. Re-runs the same pure pipeline (sub-scores → HealthScore
// → band → BRE decision → limit) on an officer-adjusted feature vector, so the
// "what would it take to approve this MSME?" exploration is the REAL engine, not a
// mock. Routing/product downgrades are excluded — this shows the engine's core
// yes-go/no-go recommendation as the levers move.

import type { FeatureVector } from "./features";
import type { ScoreCtx } from "./scorecard";
import { computeSubScoresCtx, computeHealthScore, riskBand } from "./scorecard";
import { scoreMl } from "./ml";
import { hardFlags, breDecision, recommendedLimit } from "./decision";
import type { Decision, RiskBand, SubScores } from "../types";

export interface SimResult {
  subScores: SubScores;
  healthScore: number;
  band: RiskBand;
  viability: number; // 0–1
  decision: Decision;
  recommendedLimit: number;
}

export function simulateScore(f: FeatureVector, ctx: ScoreCtx): SimResult {
  const subScores = computeSubScoresCtx(f, ctx);
  const healthScore = computeHealthScore(subScores);
  const band = riskBand(healthScore);
  const flags = hardFlags(f);
  const decision = breDecision(band, f, flags);
  return {
    subScores,
    healthScore,
    band,
    viability: scoreMl(f).viability,
    decision,
    recommendedLimit: decision === "Reject" ? 0 : recommendedLimit(band, f, flags),
  };
}
