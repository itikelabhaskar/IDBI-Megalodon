import { describe, it, expect } from "vitest";
import { generateDataset, generateMsme, DEFAULT_SEED } from "./generate";
import { isValidGstin } from "./gstin";
import type { RawMsme } from "./raw-types";

const COUNT = 700;
const data: RawMsme[] = generateDataset(COUNT);

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : num / den;
}

describe("synthetic dataset — bank-grade data quality", () => {
  it("generates the requested population size (500–1000 supported)", () => {
    expect(data.length).toBe(COUNT);
    expect(COUNT).toBeGreaterThanOrEqual(500);
    expect(COUNT).toBeLessThanOrEqual(1000);
  });

  it("carries labelled anomalies in 15–20% of profiles", () => {
    const ratio = data.filter((m) => m.anomalyTags.length > 0).length / data.length;
    expect(ratio).toBeGreaterThanOrEqual(0.14);
    expect(ratio).toBeLessThanOrEqual(0.21);
  });

  it("reconciles every bank running balance with its transactions", () => {
    for (const m of data) {
      let bal = m.bank.openingBalance;
      for (const t of m.bank.transactions) {
        if (!t.isReturn) bal += t.direction === "CR" ? t.amount : -t.amount;
        expect(t.balancePost).toBe(bal); // returns must NOT move the balance
      }
    }
  });

  it("emits only checksum-valid GSTINs where GST is present", () => {
    for (const m of data) {
      if (m.profile.gstin) expect(isValidGstin(m.profile.gstin)).toBe(true);
    }
  });

  it("keeps GST and bank SALE credits aligned for non-fraud, but mismatched for fraud", () => {
    const ratios = (filter: (m: RawMsme) => boolean) => {
      const out: number[] = [];
      for (const m of data) {
        if (!filter(m) || !m.gst) continue;
        const gstOut = m.gst.reduce((s, g) => s + g.totalOutward, 0);
        const saleCr = m.bank.transactions
          .filter((t) => t.direction === "CR" && t.narrationTag === "SALE")
          .reduce((s, t) => s + t.amount, 0);
        if (gstOut > 0) out.push(saleCr / gstOut);
      }
      return out.reduce((a, b) => a + b, 0) / Math.max(1, out.length);
    };
    const nonFraud = ratios((m) => m.profile.archetype !== "FRAUD_SUSPECT");
    const fraud = ratios((m) => m.profile.archetype === "FRAUD_SUSPECT");
    expect(nonFraud).toBeGreaterThan(0.7);
    expect(nonFraud).toBeLessThan(1.3);
    expect(fraud).toBeLessThan(0.55); // headline GST-vs-bank mismatch
  });

  it("models missing data realistically (no GST for NTC no-GST; thin EPFO/bureau)", () => {
    const ntc = data.filter((m) => m.profile.archetype === "NTC_NO_GST");
    expect(ntc.length).toBeGreaterThan(0);
    expect(ntc.every((m) => m.gst === null && m.profile.gstin === null)).toBe(true);

    const anyMissingEpfo = data.some((m) => m.epfo === null);
    const anyMissingBureau = data.some((m) => m.bureau === null);
    expect(anyMissingEpfo).toBe(true);
    expect(anyMissingBureau).toBe(true);
  });

  it("is fully reproducible for a fixed seed", () => {
    const again = generateMsme(0, DEFAULT_SEED);
    expect(JSON.stringify(again)).toBe(JSON.stringify(data[0]));
  });

  it("LEAKAGE GUARD: red-flag signals correlate with the label but are not a function of it", () => {
    // bounce count (a raw-derived red flag) vs the training label
    const bounces = data.map((m) => m.bank.transactions.filter((t) => t.isReturn).length);
    const labels = data.map((m) => m.syntheticDefault);
    const corr = Math.abs(pearson(bounces, labels));
    expect(corr).toBeGreaterThan(0.05); // learnable signal
    expect(corr).toBeLessThan(0.99); // NOT a deterministic copy of the label (no leakage)

    // the hidden latent must never equal the label (it is a stochastic parent, not a feature)
    const exactMatches = data.filter(
      (m) => m.latentDefaultPropensity === m.syntheticDefault,
    ).length;
    expect(exactMatches).toBe(0);
  });

  it("tracks fuel in dataCompleteness alongside power", () => {
    for (const m of data) {
      const sources = m.dataCompleteness.map((d) => d.source);
      expect(sources).toContain("FUEL");
      expect(sources).toContain("POWER");
      expect(m.dataCompleteness.find((d) => d.source === "FUEL")?.available).toBe(!!m.fuel);
    }
  });

  it("suppresses fuel spend on GST_BANK_MISMATCH fraud the same way as power", () => {
    const fraudWithBoth = data.filter(
      (m) =>
        m.anomalyTags.includes("GST_BANK_MISMATCH") &&
        m.gst &&
        m.power &&
        m.fuel &&
        m.gst.reduce((s, g) => s + g.totalOutward, 0) > 0,
    );
    expect(fraudWithBoth.length).toBeGreaterThan(0);
    for (const m of fraudWithBoth) {
      const gstOut = m.gst!.reduce((s, g) => s + g.totalOutward, 0);
      const fuelSpend = m.fuel!.reduce((s, f) => s + f.spend, 0);
      // Fuel intensity is ₹/lakh; honest spend ≈ intensity * (gst/1e5). Fraud uses 0.3× base.
      const intensity = fuelSpend / (gstOut / 100_000);
      expect(intensity).toBeLessThan(1200); // well below honest trader intensities (~1800+)
    }
  });
});
