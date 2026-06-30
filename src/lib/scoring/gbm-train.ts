// Offline trainer for the gradient-boosted CHALLENGER model. Deterministic
// (exact-greedy CART, Newton leaf weights, fixed feature/threshold order) so a
// retrain reproduces the committed gbm-model.json byte-for-byte. Run via the
// same `npm run train` entrypoint as the logistic champion.

import type { RawMsme } from "../data/raw-types";
import { computeFeatures } from "./features";
import { TERM_DEFS } from "./ml-terms";
import type { GbmModel, GbmNode } from "./gbm-core";
import { predictTree, predictPDefault, sigmoid } from "./gbm-core";
import { aucScore, ksScore } from "./train";

interface Row {
  y: number;
  x: number[];
}

const round = (x: number, d: number): number => {
  const p = 10 ** d;
  return Math.round(x * p) / p;
};

function imputeMeans(raws: RawMsme[]): number[] {
  const k = TERM_DEFS.length;
  const sum = new Array<number>(k).fill(0);
  const cnt = new Array<number>(k).fill(0);
  for (const r of raws) {
    const f = computeFeatures(r);
    TERM_DEFS.forEach((t, j) => {
      if (t.available(f)) {
        sum[j] += t.value(f);
        cnt[j]++;
      }
    });
  }
  return sum.map((s, j) => (cnt[j] ? s / cnt[j] : 0));
}

function extract(raws: RawMsme[], impute: number[]): Row[] {
  return raws.map((r) => {
    const f = computeFeatures(r);
    return {
      y: r.syntheticDefault,
      x: TERM_DEFS.map((t, j) => (t.available(f) ? t.value(f) : impute[j])),
    };
  });
}

interface GbmOpts {
  trees?: number;
  lr?: number;
  maxDepth?: number;
  lambda?: number;
  minSamples?: number;
}

function buildTree(
  idx: number[],
  g: number[],
  h: number[],
  X: number[][],
  depth: number,
  maxDepth: number,
  lambda: number,
  minSamples: number,
): GbmNode {
  let G = 0;
  let H = 0;
  for (const i of idx) {
    G += g[i];
    H += h[i];
  }
  const leaf: GbmNode = { v: round(-G / (H + lambda), 5) };
  if (depth >= maxDepth || idx.length < minSamples * 2) return leaf;

  const k = X[0].length;
  const baseScore = (G * G) / (H + lambda);
  let bestGain = 1e-6;
  let bestF = -1;
  let bestT = 0;
  for (let f = 0; f < k; f++) {
    const sorted = [...idx].sort((a, b) => X[a][f] - X[b][f]);
    let GL = 0;
    let HL = 0;
    for (let p = 0; p < sorted.length - 1; p++) {
      const i = sorted[p];
      GL += g[i];
      HL += h[i];
      if (X[i][f] === X[sorted[p + 1]][f]) continue;
      if (p + 1 < minSamples || sorted.length - (p + 1) < minSamples) continue;
      const GR = G - GL;
      const HR = H - HL;
      const gain = (GL * GL) / (HL + lambda) + (GR * GR) / (HR + lambda) - baseScore;
      if (gain > bestGain) {
        bestGain = gain;
        bestF = f;
        bestT = round((X[i][f] + X[sorted[p + 1]][f]) / 2, 4);
      }
    }
  }
  if (bestF < 0) return leaf;

  const left: number[] = [];
  const right: number[] = [];
  for (const i of idx) (X[i][bestF] <= bestT ? left : right).push(i);
  if (!left.length || !right.length) return leaf;
  return {
    f: bestF,
    t: bestT,
    l: buildTree(left, g, h, X, depth + 1, maxDepth, lambda, minSamples),
    r: buildTree(right, g, h, X, depth + 1, maxDepth, lambda, minSamples),
  };
}

export function trainGbm(trainRaws: RawMsme[], testRaws: RawMsme[], opts: GbmOpts = {}): GbmModel {
  const lr = opts.lr ?? 0.1;
  const maxDepth = opts.maxDepth ?? 3;
  const lambda = opts.lambda ?? 1.0;
  const minSamples = opts.minSamples ?? 20;
  const trees = opts.trees ?? 120;

  const impute = imputeMeans(trainRaws).map((v) => round(v, 4));
  const tr = extract(trainRaws, impute);
  const X = tr.map((r) => r.x);
  const y = tr.map((r) => r.y);
  const n = tr.length;
  const base = y.reduce((a, b) => a + b, 0) / n;
  const init = round(Math.log(base / (1 - base)), 5);

  const F = new Array<number>(n).fill(init);
  const allIdx = Array.from({ length: n }, (_, i) => i);
  const forest: GbmNode[] = [];
  for (let m = 0; m < trees; m++) {
    const g = new Array<number>(n);
    const h = new Array<number>(n);
    for (let i = 0; i < n; i++) {
      const p = sigmoid(F[i]);
      g[i] = p - y[i];
      h[i] = p * (1 - p);
    }
    const tree = buildTree(allIdx, g, h, X, 0, maxDepth, lambda, minSamples);
    for (let i = 0; i < n; i++) F[i] += lr * predictTree(tree, X[i]);
    forest.push(tree);
  }

  const model: GbmModel = {
    init,
    lr,
    featureKeys: TERM_DEFS.map((t) => t.key),
    impute,
    forest,
    metrics: {
      auc: 0,
      ks: 0,
      gini: 0,
      trainN: n,
      testN: 0,
      defaultRateTrain: round(base, 4),
      trees,
    },
  };

  // Evaluate the persisted (rounded) model on the held-out test split.
  const te = extract(testRaws, impute);
  const scores = te.map((r) => ({ p: predictPDefault(model, r.x), y: r.y }));
  const auc = aucScore(scores);
  model.metrics = {
    auc: round(auc, 4),
    ks: round(ksScore(scores), 4),
    gini: round(2 * auc - 1, 4),
    trainN: n,
    testN: te.length,
    defaultRateTrain: round(base, 4),
    trees,
  };
  return model;
}
