import { describe, it, expect } from "vitest";
import { assessConfidence } from "./confidence";
import { computeFeatures } from "./features";
import { generateDataset } from "../data/generate";

describe("confidence / data-quality assessment", () => {
  const data = generateDataset(400);

  it("rates a full, internally-consistent file as higher confidence than a thin one", () => {
    const full = data.find(
      (m) =>
        m.dataCompleteness.every((d) => d.available) && m.profile.archetype === "STABLE_TRADER",
    );
    const thin = data.find((m) => m.profile.archetype === "NTC_NO_GST");
    expect(full).toBeTruthy();
    expect(thin).toBeTruthy();
    const cFull = assessConfidence(full!, computeFeatures(full!));
    const cThin = assessConfidence(thin!, computeFeatures(thin!));
    expect(cFull.score).toBeGreaterThan(cThin.score);
    expect(["High", "Medium"]).toContain(cFull.level);
  });

  it("returns a bounded score, a level, and explanatory factors", () => {
    for (const m of data.slice(0, 50)) {
      const c = assessConfidence(m, computeFeatures(m));
      expect(c.score).toBeGreaterThanOrEqual(0);
      expect(c.score).toBeLessThanOrEqual(100);
      expect(["High", "Medium", "Low"]).toContain(c.level);
      expect(c.factors.length).toBeGreaterThan(0);
    }
  });

  it("penalises a large GST-vs-bank divergence in the agreement factor", () => {
    const fraud = data.find((m) => m.profile.archetype === "FRAUD_SUSPECT");
    if (fraud) {
      const c = assessConfidence(fraud, computeFeatures(fraud));
      expect(c.factors.some((f) => f.impact === "negative")).toBe(true);
    }
  });
});
