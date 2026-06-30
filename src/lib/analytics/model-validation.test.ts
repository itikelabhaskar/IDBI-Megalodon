import { describe, it, expect } from "vitest";
import { calibrationCurve, bandPdTable, championChallengerModels } from "./calibration";
import { psiByFeature } from "./drift";
import { TERM_DEFS } from "../scoring/ml-terms";

describe("model validation analytics (governance)", () => {
  it("produces a calibration curve with bounded predicted/observed rates", () => {
    const curve = calibrationCurve();
    expect(curve.length).toBeGreaterThan(0);
    expect(curve.length).toBeLessThanOrEqual(10);
    for (const b of curve) {
      expect(b.meanPredicted).toBeGreaterThanOrEqual(0);
      expect(b.meanPredicted).toBeLessThanOrEqual(1);
      expect(b.observed).toBeGreaterThanOrEqual(0);
      expect(b.observed).toBeLessThanOrEqual(1);
      expect(b.count).toBeGreaterThan(0);
    }
  });

  it("ranks expected default rate by risk band (A safest)", () => {
    const table = bandPdTable();
    expect(table.map((r) => r.band)).toEqual(["A", "B", "C", "D"]);
    const present = table.filter((r) => r.count > 0);
    const a = present.find((r) => r.band === "A");
    const d = present.find((r) => r.band === "D");
    if (a && d) expect(a.predictedPd).toBeLessThanOrEqual(d.predictedPd);
  });

  it("compares champion vs challenger with sane AUCs", () => {
    const cc = championChallengerModels();
    expect(cc.champion.auc).toBeGreaterThan(0.6);
    expect(cc.champion.auc).toBeLessThan(1);
    expect(cc.challenger.auc).toBeGreaterThan(0.6);
    expect(cc.challenger.auc).toBeLessThan(1);
    expect(cc.championAucHeldOut).toBeGreaterThan(0.6);
    expect(cc.challengerAucHeldOut).toBeGreaterThan(0.6);
  });

  it("reports PSI drift per model feature with a status band", () => {
    const psi = psiByFeature();
    expect(psi.length).toBe(TERM_DEFS.length);
    for (const r of psi) {
      expect(r.psi).toBeGreaterThanOrEqual(0);
      expect(["Stable", "Watch", "Shift"]).toContain(r.status);
    }
    // Same-generator served book ⇒ no material drift.
    expect(psi.every((r) => r.status === "Stable")).toBe(true);
  });
});
