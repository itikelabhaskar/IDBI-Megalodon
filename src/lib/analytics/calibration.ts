// Model-validation analytics for the Governance screen: a calibration curve, a
// risk-band → expected-PD table, and a champion-vs-challenger comparison. These
// are computed over the currently-scored population using the HIDDEN
// synthetic_default label (never a model feature), so they are honest outcome
// measures. Held-out validation metrics live in the model card.

import { getAllCases, getRaws } from "../data/dataset";
import { computeFeatures } from "../scoring/features";
import { scoreGbm } from "../scoring/gbm";
import { aucScore, ksScore } from "../scoring/train";
import { MODEL } from "../scoring/ml";
import { MODEL_GBM } from "../scoring/gbm";
import type { RiskBand } from "../types";

const round3 = (x: number) => Math.round(x * 1000) / 1000;
const round4 = (x: number) => Math.round(x * 10000) / 10000;

function labelMap(): Map<string, number> {
  return new Map(getRaws().map((m) => [m.profile.msmeId, m.syntheticDefault]));
}

export interface CalibrationBin {
  bin: number;
  meanPredicted: number; // mean champion P(default) in the bin
  observed: number; // observed default rate in the bin
  count: number;
}

/** Reliability curve: predicted vs observed default rate across PD deciles. */
export function calibrationCurve(bins = 10): CalibrationBin[] {
  const label = labelMap();
  const rows = getAllCases()
    .map((c) => ({ p: 1 - c.mlProbabilityProxy, y: label.get(c.id) ?? 0 }))
    .sort((a, b) => a.p - b.p);
  const n = rows.length;
  const out: CalibrationBin[] = [];
  for (let b = 0; b < bins; b++) {
    const slice = rows.slice(Math.floor((b * n) / bins), Math.floor(((b + 1) * n) / bins));
    if (!slice.length) continue;
    out.push({
      bin: b + 1,
      meanPredicted: round3(slice.reduce((s, r) => s + r.p, 0) / slice.length),
      observed: round3(slice.reduce((s, r) => s + r.y, 0) / slice.length),
      count: slice.length,
    });
  }
  return out;
}

export interface BandPd {
  band: RiskBand;
  count: number;
  predictedPd: number;
  observedPd: number;
}

/** Expected vs observed default rate per risk band — the underwriting lookup. */
export function bandPdTable(): BandPd[] {
  const label = labelMap();
  const cases = getAllCases();
  return (["A", "B", "C", "D"] as RiskBand[]).map((band) => {
    const g = cases.filter((c) => c.riskBand === band);
    const predictedPd = g.length
      ? g.reduce((s, c) => s + (1 - c.mlProbabilityProxy), 0) / g.length
      : 0;
    const observedPd = g.length ? g.reduce((s, c) => s + (label.get(c.id) ?? 0), 0) / g.length : 0;
    return {
      band,
      count: g.length,
      predictedPd: round3(predictedPd),
      observedPd: round3(observedPd),
    };
  });
}

export interface ModelScores {
  auc: number;
  ks: number;
}
export interface ChampionChallenger {
  champion: ModelScores;
  challenger: ModelScores;
  championAucHeldOut: number;
  challengerAucHeldOut: number;
}

/** Champion (logistic) vs challenger (GBM) on the current population, with the
 *  held-out validation AUCs from each model's card for reference. */
export function championChallengerModels(): ChampionChallenger {
  const raws = getRaws();
  const label = labelMap();
  const champ = getAllCases().map((c) => ({
    p: 1 - c.mlProbabilityProxy,
    y: label.get(c.id) ?? 0,
  }));
  const chall = raws.map((m) => ({
    p: scoreGbm(computeFeatures(m)).pDefault,
    y: m.syntheticDefault,
  }));
  return {
    champion: { auc: round4(aucScore(champ)), ks: round4(ksScore(champ)) },
    challenger: { auc: round4(aucScore(chall)), ks: round4(ksScore(chall)) },
    championAucHeldOut: MODEL.metrics.auc,
    challengerAucHeldOut: MODEL_GBM.metrics.auc,
  };
}
