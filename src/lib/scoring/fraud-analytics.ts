// Statistical fraud-screen analytics over the bank feed.
//
// Replaces the previous sentinel-value circular-flow detector (which keyed off a
// hard-coded ₹999999 marker) with measurable, defensible signals a transaction-
// monitoring analyst would actually use:
//   - reversed in/out pairs (round-tripping / mirror transfers that net to zero),
//   - round-amount ratio (structuring tell),
//   - Benford leading-digit conformance of genuine sale credits.

import type { RawMsme, BankTxn } from "../data/raw-types";
import type { FraudAnalytics, BenfordDigit } from "../types";

export interface ReversedPairs {
  count: number;
  value: number;
}

/**
 * Detect matched credit/debit pairs of equal value (a transfer in and an equal
 * transfer straight back out). For two independent business amounts to coincide
 * exactly is improbable, so equal CR/DR amounts are a strong round-tripping tell.
 */
export function detectReversedPairs(txns: BankTxn[]): ReversedPairs {
  const cr = new Map<number, number>();
  const dr = new Map<number, number>();
  for (const t of txns) {
    if (t.isReturn) continue;
    const m = t.direction === "CR" ? cr : dr;
    m.set(t.amount, (m.get(t.amount) ?? 0) + 1);
  }
  let count = 0;
  let value = 0;
  for (const [amt, c] of cr) {
    const pairs = Math.min(c, dr.get(amt) ?? 0);
    if (pairs > 0) {
      count += pairs;
      value += pairs * amt;
    }
  }
  return { count, value };
}

/** Circular-flow flag for the BRE fraud gate (≥ 1 reversed pair). */
export function detectCircular(txns: BankTxn[]): boolean {
  return detectReversedPairs(txns).count >= 1;
}

// Benford's-law expectation for leading digit d: log10(1 + 1/d).
const BENFORD_EXPECTED = Array.from({ length: 10 }, (_, d) => (d >= 1 ? Math.log10(1 + 1 / d) : 0));

function leadingDigit(n: number): number {
  let x = Math.abs(Math.trunc(n));
  while (x >= 10) x = Math.trunc(x / 10);
  return x;
}

const round3 = (x: number) => Math.round(x * 1000) / 1000;

export function benfordOf(amounts: number[]): { digits: BenfordDigit[]; deviation: number } {
  const counts = new Array(10).fill(0);
  let total = 0;
  for (const a of amounts) {
    const d = leadingDigit(a);
    if (d >= 1 && d <= 9) {
      counts[d]++;
      total++;
    }
  }
  const digits: BenfordDigit[] = [];
  let dev = 0;
  for (let d = 1; d <= 9; d++) {
    const observed = total ? counts[d] / total : 0;
    const expected = BENFORD_EXPECTED[d];
    digits.push({ digit: d, observed: round3(observed), expected: round3(expected) });
    dev += Math.abs(observed - expected);
  }
  return { digits, deviation: total ? round3(dev / 9) : 0 };
}

// A "round" structuring tell: exact multiples of ₹1 lakh.
const isRound = (n: number) => n > 0 && n % 100_000 === 0;

export function computeFraudAnalytics(raw: RawMsme): FraudAnalytics {
  const txns = raw.bank.transactions;
  const rp = detectReversedPairs(txns);
  const credits = txns.filter((t) => t.direction === "CR" && !t.isReturn);
  const roundAmountRatio = credits.length
    ? credits.filter((t) => isRound(t.amount)).length / credits.length
    : 0;
  const saleAmounts = txns
    .filter((t) => t.direction === "CR" && !t.isReturn && t.narrationTag === "SALE")
    .map((t) => t.amount);
  const { digits, deviation } = benfordOf(saleAmounts);
  return {
    reversedPairCount: rp.count,
    reversedPairValue: rp.value,
    roundAmountRatio: round3(roundAmountRatio),
    benfordDeviation: deviation,
    benford: digits,
  };
}
