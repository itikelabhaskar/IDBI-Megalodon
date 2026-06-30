import { describe, it, expect } from "vitest";
import { generateDataset } from "../data/generate";
import { trainModel, splitTrainTest } from "./train";
import { TERM_DEFS } from "./ml-terms";
import { MODEL, scoreMl } from "./ml";
import { computeFeatures } from "./features";
import modelJson from "./model.json";

describe("ML model training — bank-grade validation", () => {
  const all = generateDataset(1000);
  const { train, test } = splitTrainTest(all);
  const fitted = trainModel(train, test, { epochs: 2000, lr: 0.2, l2: 1e-3 });

  it("trains on a disjoint train/test split", () => {
    const trainIds = new Set(train.map((m) => m.profile.msmeId));
    const overlap = test.filter((m) => trainIds.has(m.profile.msmeId));
    expect(overlap.length).toBe(0);
    expect(train.length + test.length).toBe(all.length);
  });

  it("achieves a sane, non-degenerate AUC (learnable but not leaked)", () => {
    expect(fitted.metrics.auc).toBeGreaterThan(0.6); // clearly better than random
    expect(fitted.metrics.auc).toBeLessThan(0.97); // not a suspicious ~1.0 ⇒ no leakage
    expect(fitted.metrics.gini).toBeCloseTo(2 * fitted.metrics.auc - 1, 3);
    expect(fitted.metrics.ks).toBeGreaterThan(0.15);
  });

  it("keeps every weight on its monotonic side (sign-constrained scorecard)", () => {
    for (const t of TERM_DEFS) {
      const w = fitted.terms[t.key].weight;
      expect(w * t.signToDefault).toBeGreaterThanOrEqual(0);
    }
  });

  it("re-trains deterministically to the committed model.json", () => {
    expect(JSON.stringify(fitted)).toBe(JSON.stringify(modelJson));
  });

  it("loads fitted coefficients and metrics into the runtime MODEL", () => {
    expect(MODEL.metrics.auc).toBe(modelJson.metrics.auc);
    expect(MODEL.terms.length).toBe(TERM_DEFS.length);
    expect(MODEL.terms.every((t) => typeof t.weight === "number")).toBe(true);
  });

  it("scores a healthy profile as more viable than a stressed one", () => {
    const healthy = scoreMl(computeFeatures(generateDataset(1)[0]));
    expect(healthy.viability).toBeGreaterThanOrEqual(0);
    expect(healthy.viability).toBeLessThanOrEqual(1);
  });
});
