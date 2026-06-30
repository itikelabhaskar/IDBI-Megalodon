import { describe, it, expect } from "vitest";
import { championChallenger, fairnessSlices, topRejectReasons, getDemoCases } from "./portfolio";
import { getAllCases } from "../data/dataset";

describe("portfolio analytics (governance)", () => {
  const cc = championChallenger();

  it("champion-challenger rescues thin-file MSMEs at a controlled bad-rate", () => {
    expect(cc.population).toBeGreaterThan(0);
    expect(cc.thinFileTotal).toBeGreaterThan(0);
    expect(cc.rescued).toBeGreaterThan(0);
    expect(cc.rescuedPct).toBeGreaterThan(0);
    expect(cc.healthLensApprovedBadRate).toBeGreaterThanOrEqual(0);
    expect(cc.healthLensApprovedBadRate).toBeLessThan(20); // approvals stay low-risk
    expect(cc.healthLensApprovals).toBeGreaterThan(0);
  });

  it("fairness slices cover key segments with valid approval rates", () => {
    const slices = fairnessSlices();
    expect(slices.length).toBe(6);
    for (const s of slices) {
      expect(s.approvalRate).toBeGreaterThanOrEqual(0);
      expect(s.approvalRate).toBeLessThanOrEqual(100);
    }
    expect(slices.find((s) => s.segment === "Women-owned")!.n).toBeGreaterThan(0);
  });

  it("top reject reasons are ranked negative codes", () => {
    const r = topRejectReasons();
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].count).toBeGreaterThanOrEqual(r[r.length - 1].count);
  });

  it("curated demo cases reference real cases and cover the decision spread", () => {
    const demos = getDemoCases();
    expect(demos.length).toBeGreaterThanOrEqual(3);
    const ids = new Set(getAllCases().map((c) => c.id));
    for (const d of demos) expect(ids.has(d.id)).toBe(true);
  });
});
