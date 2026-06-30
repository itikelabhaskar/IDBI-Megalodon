import { describe, it, expect } from "vitest";
import { generateDataset } from "../data/generate";
import { splitTrainTest } from "./train";
import { trainGbm } from "./gbm-train";
import { MODEL_GBM, scoreGbm } from "./gbm";
import { computeFeatures } from "./features";
import gbmJson from "./gbm-model.json";

describe("GBM challenger — champion–challenger governance", () => {
  const all = generateDataset(1000);
  const { train, test } = splitTrainTest(all);
  const fitted = trainGbm(train, test, {
    trees: 200,
    lr: 0.05,
    maxDepth: 3,
    lambda: 1,
    minSamples: 20,
  });

  it("achieves a sane, non-degenerate AUC (learnable, not leaked)", () => {
    expect(fitted.metrics.auc).toBeGreaterThan(0.6);
    expect(fitted.metrics.auc).toBeLessThan(0.97);
    expect(fitted.metrics.gini).toBeCloseTo(2 * fitted.metrics.auc - 1, 3);
    expect(fitted.metrics.ks).toBeGreaterThan(0.2);
  });

  it("is statistically comparable to the logistic champion (no large lift)", () => {
    // On this monotonic synthetic structure the explainable champion is already
    // near-optimal; the challenger should match it within a small margin.
    expect(Math.abs(fitted.metrics.auc - 0.7433)).toBeLessThan(0.05);
  });

  it("re-trains deterministically to the committed gbm-model.json", () => {
    expect(JSON.stringify(fitted)).toBe(JSON.stringify(gbmJson));
  });

  it("loads the fitted forest into the runtime model", () => {
    expect(MODEL_GBM.forest.length).toBe(gbmJson.forest.length);
    expect(MODEL_GBM.featureKeys.length).toBeGreaterThan(0);
  });

  it("scores a default probability in [0,1] with viability = 1 − pDefault", () => {
    const r = scoreGbm(computeFeatures(all[0]));
    expect(r.pDefault).toBeGreaterThanOrEqual(0);
    expect(r.pDefault).toBeLessThanOrEqual(1);
    expect(r.viability).toBeCloseTo(1 - r.pDefault, 10);
  });
});
