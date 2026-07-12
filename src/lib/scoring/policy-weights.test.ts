import { describe, it, expect } from "vitest";
import { policyWeightRows } from "./policy-weights";
import type { SubScores } from "../types";

const full: SubScores = {
  gst: 80,
  bank: 70,
  upi: 60,
  epfo: 50,
  compliance: 90,
  bureau: 40,
  operations: 55,
};

describe("policyWeightRows", () => {
  it("re-normalises weights when rails are missing", () => {
    const thin: SubScores = {
      gst: null,
      bank: 70,
      upi: 60,
      epfo: null,
      compliance: 90,
      bureau: null,
      operations: 55,
    };
    const rows = policyWeightRows(thin);
    const present = rows.filter((r) => r.present);
    const absent = rows.filter((r) => !r.present);
    expect(absent.map((r) => r.key).sort()).toEqual(["bureau", "epfo", "gst"]);
    const weightSum = present.reduce((s, r) => s + r.weight, 0);
    expect(weightSum).toBeCloseTo(1, 5);
    for (const a of absent) {
      expect(a.weight).toBe(0);
      expect(a.contribution).toBe(0);
    }
  });

  it("applies NTC ops boost when requested", () => {
    const thin: SubScores = {
      gst: null,
      bank: 70,
      upi: 60,
      epfo: null,
      compliance: 90,
      bureau: null,
      operations: 55,
    };
    const base = policyWeightRows(thin, false).find((r) => r.key === "operations")!;
    const boosted = policyWeightRows(thin, true).find((r) => r.key === "operations")!;
    expect(boosted.weight).toBeGreaterThan(base.weight);
  });

  it("contributions sum toward HealthScore scale on full rails", () => {
    const rows = policyWeightRows(full);
    const contrib = rows.reduce((s, r) => s + r.contribution, 0);
    expect(contrib).toBeGreaterThan(50);
    expect(contrib).toBeLessThanOrEqual(100);
  });
});
