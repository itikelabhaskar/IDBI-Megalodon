import { describe, it, expect } from "vitest";
import { ablationSummary } from "./ablation";
import { getAllCases } from "../data/dataset";

describe("ablation harness", () => {
  const summary = ablationSummary(getAllCases());

  it("reports structured-only vs full HealthScore on the book", () => {
    expect(summary.sampleN).toBeGreaterThan(0);
    expect(summary.meanFullScore).toBeGreaterThan(0);
    expect(summary.meanStructuredOnly).toBeGreaterThan(0);
    expect(Number.isFinite(summary.meanDelta)).toBe(true);
  });

  it("catches FRAUD_SUSPECT and high fraud flags at a high rate", () => {
    expect(summary.fraudSuspectCatchRate).toBeGreaterThanOrEqual(80);
    expect(summary.highFraudFlagCatchRate).toBeGreaterThanOrEqual(80);
    expect(summary.note.toLowerCase()).toContain("synthetic");
  });
});
