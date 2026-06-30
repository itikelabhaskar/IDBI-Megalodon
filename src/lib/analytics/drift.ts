// Population Stability Index (PSI) drift monitor for the Governance screen.
//
// Compares each model feature's distribution in the current scored population
// against the training-time reference distribution. PSI < 0.1 = stable, 0.1–0.25
// = watch, > 0.25 = material shift (retrain trigger). On synthetic data the
// served book is drawn from the same generator, so PSI reads near-zero — the
// panel demonstrates the live monitor a pilot would watch against real drift.

import { generateDataset } from "../data/generate";
import { splitTrainTest } from "../scoring/train";
import { getRaws } from "../data/dataset";
import { computeFeatures } from "../scoring/features";
import { TERM_DEFS } from "../scoring/ml-terms";
import type { FeatureVector } from "../scoring/features";

export type PsiStatus = "Stable" | "Watch" | "Shift";

export interface PsiRow {
  key: string;
  label: string;
  psi: number;
  status: PsiStatus;
}

function quantileEdges(values: number[], bins: number): number[] {
  const s = [...values].sort((a, b) => a - b);
  const edges: number[] = [];
  for (let b = 1; b < bins; b++) edges.push(s[Math.floor((b * s.length) / bins)]);
  return edges;
}

function binIndex(x: number, edges: number[]): number {
  let i = 0;
  while (i < edges.length && x > edges[i]) i++;
  return i;
}

function statusOf(psi: number): PsiStatus {
  return psi < 0.1 ? "Stable" : psi < 0.25 ? "Watch" : "Shift";
}

let cache: PsiRow[] | null = null;

export function psiByFeature(bins = 10): PsiRow[] {
  if (cache) return cache;
  const refRaws = splitTrainTest(generateDataset(1000)).train;
  const refF = refRaws.map(computeFeatures);
  const curF = getRaws().map(computeFeatures);

  const rows = TERM_DEFS.map((t) => {
    const refVals = refF.filter((f: FeatureVector) => t.available(f)).map((f) => t.value(f));
    const curVals = curF.filter((f: FeatureVector) => t.available(f)).map((f) => t.value(f));
    if (refVals.length < bins || curVals.length < bins) {
      return { key: t.key, label: t.label, psi: 0, status: "Stable" as PsiStatus };
    }
    const edges = quantileEdges(refVals, bins);
    const eCount = new Array<number>(bins).fill(0);
    const aCount = new Array<number>(bins).fill(0);
    for (const v of refVals) eCount[binIndex(v, edges)]++;
    for (const v of curVals) aCount[binIndex(v, edges)]++;
    let psi = 0;
    for (let b = 0; b < bins; b++) {
      const e = Math.max(eCount[b], 0.5) / refVals.length; // smoothing for empty bins
      const a = Math.max(aCount[b], 0.5) / curVals.length;
      psi += (a - e) * Math.log(a / e);
    }
    psi = Math.round(Math.max(0, psi) * 1000) / 1000;
    return { key: t.key, label: t.label, psi, status: statusOf(psi) };
  });
  cache = rows;
  return rows;
}
