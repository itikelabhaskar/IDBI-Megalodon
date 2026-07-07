import { describe, it, expect } from "vitest";
import { computeFeatures } from "./features";
import { generateDataset } from "../data/generate";
import { rupeesPerKwh, rupeesTurnoverPerFuel } from "../data/sector-intensity";

describe("purchase (inward/ITC) signal", () => {
  const cases = generateDataset(150);

  it("emits a non-negative totalInward for every GST month", () => {
    for (const m of cases) {
      if (!m.gst) continue;
      for (const g of m.gst) {
        expect(g.totalInward).toBeGreaterThanOrEqual(0);
        // purchases should never wildly exceed sales for honest trading archetypes
        if (g.totalOutward > 0) expect(g.totalInward).toBeLessThanOrEqual(g.totalOutward * 1.5);
      }
    }
  });

  it("derives purchaseToSaleRatio for GST-registered MSMEs", () => {
    const withGst = cases.find((m) => m.gst && m.gst.some((g) => g.totalOutward > 0));
    expect(withGst).toBeDefined();
    const f = computeFeatures(withGst!);
    expect(f.hasPurchaseData).toBe(true);
    expect(f.purchaseToSaleRatio).toBeGreaterThan(0);
  });

  it("reports no purchase data when GST is absent", () => {
    const noGst = cases.find((m) => !m.gst);
    if (noGst) {
      const f = computeFeatures(noGst);
      expect(f.hasPurchaseData).toBe(false);
    }
  });
});

describe("sector-specific operational intensity", () => {
  it("implies more ₹ per kWh for light services than for power-heavy milling", () => {
    expect(rupeesPerKwh("Consulting")).toBeGreaterThan(rupeesPerKwh("Rice Milling"));
  });

  it("returns positive fallbacks for an unknown sector", () => {
    expect(rupeesPerKwh("Totally Unknown Sector")).toBeGreaterThan(0);
    expect(rupeesTurnoverPerFuel("Totally Unknown Sector")).toBeGreaterThan(0);
  });
});
