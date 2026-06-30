// Offline trainer for the transparent logistic viability scorecard.
//
// Fits standardised-feature logistic regression on the synthetic TRAIN split
// (predicting synthetic_default) via gradient descent with L2, then evaluates
// AUC / KS / Gini on the held-out TEST split. Deterministic for a fixed dataset.
//
// The label is the leakage-free `synthetic_default`; features are observable
// only — so the model has to learn the relationship, it cannot read the answer.

import type { RawMsme } from "../data/raw-types";
import { computeFeatures } from "./features";
import { TERM_DEFS } from "./ml-terms";

export interface FittedTerm {
  mean: number;
  std: number;
  weight: number;
}

export interface FittedModel {
  intercept: number;
  terms: Record<string, FittedTerm>;
  metrics: {
    auc: number;
    ks: number;
    gini: number;
    trainN: number;
    testN: number;
    defaultRateTrain: number;
  };
}

const sigmoid = (z: number): number => 1 / (1 + Math.exp(-z));
const round = (x: number, d = 4): number => {
  const p = 10 ** d;
  return Math.round(x * p) / p;
};

interface Row {
  y: number;
  v: number[];
  avail: boolean[];
}

function toRows(raws: RawMsme[]): Row[] {
  return raws.map((r) => {
    const f = computeFeatures(r);
    return {
      y: r.syntheticDefault,
      v: TERM_DEFS.map((t) => t.value(f)),
      avail: TERM_DEFS.map((t) => t.available(f)),
    };
  });
}

/** Mann–Whitney AUC. */
export function aucScore(scores: { p: number; y: number }[]): number {
  const pos = scores.filter((s) => s.y === 1).map((s) => s.p);
  const neg = scores.filter((s) => s.y === 0).map((s) => s.p);
  if (!pos.length || !neg.length) return 0.5;
  let c = 0;
  for (const pp of pos) for (const nn of neg) c += pp > nn ? 1 : pp === nn ? 0.5 : 0;
  return c / (pos.length * neg.length);
}

/** Kolmogorov–Smirnov separation. */
export function ksScore(scores: { p: number; y: number }[]): number {
  const sorted = [...scores].sort((a, b) => a.p - b.p);
  const P = scores.filter((s) => s.y === 1).length;
  const N = scores.length - P;
  if (!P || !N) return 0;
  let cp = 0;
  let cn = 0;
  let ks = 0;
  for (const s of sorted) {
    if (s.y === 1) cp++;
    else cn++;
    ks = Math.max(ks, Math.abs(cp / P - cn / N));
  }
  return ks;
}

export interface TrainOpts {
  epochs?: number;
  lr?: number;
  l2?: number;
}

export function trainModel(
  trainRaws: RawMsme[],
  testRaws: RawMsme[],
  opts: TrainOpts = {},
): FittedModel {
  const tr = toRows(trainRaws);
  const k = TERM_DEFS.length;

  // Standardisation params from TRAIN, over available values only.
  const mean: number[] = [];
  const std: number[] = [];
  for (let j = 0; j < k; j++) {
    const vals = tr.filter((r) => r.avail[j]).map((r) => r.v[j]);
    const m = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const variance = vals.length > 1 ? vals.reduce((a, b) => a + (b - m) ** 2, 0) / vals.length : 1;
    const sd = Math.sqrt(variance);
    mean[j] = m;
    std[j] = sd > 1e-6 ? sd : 1;
  }
  const z01 = (r: Row, j: number): number => (r.avail[j] ? (r.v[j] - mean[j]) / std[j] : 0);

  // Logistic regression via batch gradient descent + L2.
  const w = new Array<number>(k).fill(0);
  let b = 0;
  const lr = opts.lr ?? 0.2;
  const l2 = opts.l2 ?? 1e-3;
  const epochs = opts.epochs ?? 2000;
  const n = tr.length;
  for (let e = 0; e < epochs; e++) {
    const gw = new Array<number>(k).fill(0);
    let gb = 0;
    for (const r of tr) {
      let z = b;
      for (let j = 0; j < k; j++) z += w[j] * z01(r, j);
      const err = sigmoid(z) - r.y;
      gb += err;
      for (let j = 0; j < k; j++) gw[j] += err * z01(r, j);
    }
    b -= lr * (gb / n);
    for (let j = 0; j < k; j++) {
      w[j] -= lr * (gw[j] / n + l2 * w[j]);
      if (w[j] * TERM_DEFS[j].signToDefault < 0) w[j] = 0; // monotonic constraint (sign-constrained scorecard)
    }
  }

  // Evaluate on the held-out TEST split.
  const te = toRows(testRaws);
  const scores = te.map((r) => {
    let z = b;
    for (let j = 0; j < k; j++) z += w[j] * z01(r, j);
    return { p: sigmoid(z), y: r.y };
  });
  const auc = aucScore(scores);
  const ks = ksScore(scores);

  const terms: Record<string, FittedTerm> = {};
  TERM_DEFS.forEach((t, j) => {
    terms[t.key] = { mean: round(mean[j]), std: round(std[j]), weight: round(w[j]) };
  });

  return {
    intercept: round(b),
    terms,
    metrics: {
      auc: round(auc),
      ks: round(ks),
      gini: round(2 * auc - 1),
      trainN: n,
      testN: te.length,
      defaultRateTrain: round(tr.reduce((a, r) => a + r.y, 0) / n),
    },
  };
}

/** Deterministic index split: 70% train (i % 10 < 7), 30% test. No overlap. */
export function splitTrainTest<T>(all: T[]): { train: T[]; test: T[] } {
  return {
    train: all.filter((_, i) => i % 10 < 7),
    test: all.filter((_, i) => i % 10 >= 7),
  };
}
