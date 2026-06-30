import { describe, it, expect } from "vitest";
import { detectReversedPairs, benfordOf, computeFraudAnalytics } from "./fraud-analytics";
import { generateDataset } from "../data/generate";
import type { BankTxn } from "../data/raw-types";

function tx(amount: number, direction: "CR" | "DR", isReturn = false): BankTxn {
  return {
    txnDate: "2026-01-10",
    amount,
    direction,
    balancePost: 0,
    channel: "NEFT",
    narration: "x",
    narrationTag: "MISC",
    isReturn,
  };
}

describe("statistical fraud analytics", () => {
  it("detects matched in/out reversed pairs (round-tripping)", () => {
    const txns = [tx(500000, "CR"), tx(500000, "DR"), tx(123456, "CR")];
    const rp = detectReversedPairs(txns);
    expect(rp.count).toBe(1);
    expect(rp.value).toBe(500000);
  });

  it("ignores returned instruments and unmatched amounts", () => {
    const txns = [tx(999999, "CR", true), tx(999999, "DR", true), tx(700000, "CR")];
    expect(detectReversedPairs(txns).count).toBe(0);
  });

  it("computes a Benford leading-digit distribution that sums to ~1", () => {
    const { digits, deviation } = benfordOf([100, 150, 200, 300, 1200, 9000, 2500, 4000]);
    const sum = digits.reduce((s, d) => s + d.observed, 0);
    expect(Math.round(sum * 10) / 10).toBe(1);
    expect(deviation).toBeGreaterThanOrEqual(0);
    expect(digits.find((d) => d.digit === 1)!.expected).toBeCloseTo(0.301, 2);
  });

  it("flags the fraud archetype's round-tripping but not a clean trader", () => {
    const data = generateDataset(300);
    const fraud = data.find((m) => m.profile.archetype === "FRAUD_SUSPECT")!;
    const stable = data.find((m) => m.profile.archetype === "STABLE_TRADER")!;
    expect(computeFraudAnalytics(fraud).reversedPairCount).toBeGreaterThanOrEqual(1);
    expect(computeFraudAnalytics(stable).reversedPairCount).toBe(0);
  });
});
