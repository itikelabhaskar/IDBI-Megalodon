// Gradient-boosted decision-tree CHALLENGER model — shared core (types + the
// pure prediction path). The logistic scorecard in ml.ts remains the CHAMPION
// (monotonic, exact additive explanations, final control). This challenger is a
// flexible benchmark a risk team runs alongside the champion to prove the
// scorecard isn't leaving signal on the table — standard champion–challenger
// governance. It has no monotonic constraint by design.
//
// Kept dependency-free (no model.json import) so both the trainer and the
// runtime loader can share it without a bootstrap cycle.

export interface GbmLeaf {
  v: number; // leaf log-odds contribution
}
export interface GbmSplit {
  f: number; // feature index
  t: number; // threshold (go left if x[f] <= t)
  l: GbmNode;
  r: GbmNode;
}
export type GbmNode = GbmLeaf | GbmSplit;

export interface GbmMetrics {
  auc: number;
  ks: number;
  gini: number;
  trainN: number;
  testN: number;
  defaultRateTrain: number;
  trees: number;
}

export interface GbmModel {
  init: number; // initial log-odds (base rate)
  lr: number; // learning rate (shrinkage)
  featureKeys: string[]; // feature order, aligned to TERM_DEFS
  impute: number[]; // per-feature value used when a source is missing
  forest: GbmNode[];
  metrics: GbmMetrics;
}

export const sigmoid = (z: number): number => 1 / (1 + Math.exp(-z));

const isLeaf = (n: GbmNode): n is GbmLeaf => (n as GbmSplit).f === undefined;

export function predictTree(node: GbmNode, x: number[]): number {
  let n = node;
  while (!isLeaf(n)) {
    n = x[n.f] <= n.t ? n.l : n.r;
  }
  return n.v;
}

/** Ensemble log-odds for a feature row. */
export function predictLogit(model: GbmModel, x: number[]): number {
  let z = model.init;
  for (const tree of model.forest) z += model.lr * predictTree(tree, x);
  return z;
}

/** Probability of DEFAULT for a feature row. */
export function predictPDefault(model: GbmModel, x: number[]): number {
  return sigmoid(predictLogit(model, x));
}
