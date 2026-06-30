// Rule-based scorecard — seven sub-scores, the weighted HealthScore (the PRIMARY
// score that drives the decision), the 300–900 credit-style score, and the risk
// band. Weights and thresholds follow plan.md §7 and perplexity2 §4.1/§4.3.
//
// Missing-data handling: a missing source yields a null sub-score; its weight is
// excluded and the remaining weights are re-normalised (plan.md §7 step 4).

import type { RawMsme } from "../data/raw-types";
import type { SubScores, RiskBand } from "../types";
import type { FeatureVector } from "./features";

export const SUBSCORE_WEIGHTS = {
  gst: 0.2,
  bank: 0.3,
  upi: 0.15,
  epfo: 0.1,
  compliance: 0.1,
  bureau: 0.05,
  operations: 0.1,
} as const;

const clamp = (x: number, lo = 0, hi = 100): number => Math.min(hi, Math.max(lo, x));

// The minimal non-feature context the compliance sub-score needs. Extracted so
// sub-scores can be recomputed from a feature vector alone (what-if simulator)
// without a full RawMsme.
export interface ScoreCtx {
  hasUdyam: boolean;
  availableSources: number;
}

function ctxFromRaw(raw: RawMsme): ScoreCtx {
  return {
    hasUdyam: !!raw.profile.udyamId,
    availableSources: raw.dataCompleteness.filter((d) => d.available).length,
  };
}

function gstScore(f: FeatureVector): number | null {
  if (!f.hasGst) return null;
  let s = 100;
  if (f.gstOnTimeRatio < 0.8) s -= 30;
  else if (f.gstOnTimeRatio < 0.9) s -= 10;
  if (f.gstZeroReturnRatio > 0.3) s -= 20;
  if (f.gstConcentration > 0.7) s -= 15;
  else if (f.gstConcentration > 0.5) s -= 5;
  if (f.gstTurnoverCov > 0.5 && !f.seasonalSectorFlag) s -= 10;
  return clamp(s);
}

function bankScore(f: FeatureVector): number {
  let s = 100;
  if (f.emiBounceCount > 6) s -= 40;
  else if (f.emiBounceCount >= 3) s -= 20;
  else if (f.emiBounceCount >= 1) s -= 8;
  if (f.negativeBalanceDaysRatio > 0.1) s -= 15;
  else if (f.negativeBalanceDaysRatio > 0.05) s -= 7;
  if (f.bankCreditVolatility > 0.5 && !f.seasonalSectorFlag) s -= 15;
  else if (f.bankCreditVolatility > 0.3 && !f.seasonalSectorFlag) s -= 7;
  if (f.gstBankTurnoverGap > 0.5) s -= 25; // GST-vs-bank mismatch erodes cash-flow credibility
  return clamp(s);
}

function upiScore(f: FeatureVector): number | null {
  if (!f.hasUpi) return null;
  let s = 70;
  if (f.upiTrend > 0.15) s += 20;
  else if (f.upiTrend > 0.05) s += 10;
  else if (f.upiTrend < -0.1) s -= 10;
  if (f.upiRefundRatio > 0.05) s -= 20;
  else if (f.upiRefundRatio > 0.03) s -= 10;
  if (f.upiConcentration > 0.5) s -= 10;
  return clamp(s);
}

function epfoScore(f: FeatureVector): number | null {
  if (!f.hasEpfo) return null;
  let s = 100;
  if (f.epfoMissingMonthRatio > 0.25) s -= 30;
  else if (f.epfoMissingMonthRatio > 0.1) s -= 15;
  if (f.epfoEmployeeGrowth < 0) s -= 10;
  return clamp(s);
}

function complianceScore(f: FeatureVector, ctx: ScoreCtx): number {
  let s = 100;
  if (f.hasGst) {
    if (f.gstOnTimeRatio < 0.8) s -= 20;
    else if (f.gstOnTimeRatio < 0.9) s -= 8;
    if (f.gstZeroReturnRatio > 0.3) s -= 10;
  } else {
    s -= 15; // no GST registration weakens the governance signal
  }
  if (f.hasEpfo && f.epfoMissingMonthRatio > 0.25) s -= 10;
  if (!ctx.hasUdyam) s -= 10;
  if (ctx.availableSources <= 2) s -= 15;
  else if (ctx.availableSources === 3) s -= 8;
  return clamp(s);
}

function bureauScore(f: FeatureVector): number | null {
  if (!f.hasBureau) return null;
  let s = 100;
  if (f.dpdDays >= 90) s -= 70;
  else if (f.dpdDays >= 60) s -= 40;
  else if (f.dpdDays >= 30) s -= 20;
  if (f.debtServiceRatio > 0.4) s -= 20;
  else if (f.debtServiceRatio > 0.3) s -= 10;
  return clamp(s);
}

// Power & operations — electricity consumption confirms real operational activity
// (IDBI's flagship alternate signal). Rewards growing/steady consumption; penalises
// declining usage and a large gap between declared turnover and power-implied activity.
function operationsScore(f: FeatureVector): number | null {
  if (!f.hasPower) return null;
  let s = 70;
  if (f.powerTrend > 0.15) s += 20;
  else if (f.powerTrend > 0.05) s += 10;
  else if (f.powerTrend < -0.15) s -= 15;
  else if (f.powerTrend < -0.05) s -= 7;
  if (f.hasGst) {
    if (f.turnoverPowerGap > 0.5)
      s -= 30; // power far below declared turnover ⇒ activity not real
    else if (f.turnoverPowerGap > 0.3) s -= 12;
  }
  return clamp(s);
}

export function computeSubScores(f: FeatureVector, raw: RawMsme): SubScores {
  return computeSubScoresCtx(f, ctxFromRaw(raw));
}

/** Sub-scores from a feature vector + minimal context (used by the simulator). */
export function computeSubScoresCtx(f: FeatureVector, ctx: ScoreCtx): SubScores {
  return {
    gst: gstScore(f),
    bank: bankScore(f),
    upi: upiScore(f),
    epfo: epfoScore(f),
    compliance: complianceScore(f, ctx),
    bureau: bureauScore(f),
    operations: operationsScore(f),
  };
}

/** Weighted HealthScore (0–100) over available sub-scores, with re-normalisation. */
export function computeHealthScore(sub: SubScores): number {
  let num = 0;
  let den = 0;
  (Object.keys(SUBSCORE_WEIGHTS) as (keyof SubScores)[]).forEach((k) => {
    const v = sub[k];
    if (v !== null) {
      num += SUBSCORE_WEIGHTS[k] * v;
      den += SUBSCORE_WEIGHTS[k];
    }
  });
  return den === 0 ? 0 : Math.round(num / den);
}

/** 300–900 credit-style score — a familiar mapping, NOT a bureau score. */
export function creditStyleScore(healthScore: number): number {
  return Math.round(300 + healthScore * 6);
}

export function riskBand(healthScore: number): RiskBand {
  if (healthScore >= 80) return "A";
  if (healthScore >= 65) return "B";
  if (healthScore >= 50) return "C";
  return "D";
}
