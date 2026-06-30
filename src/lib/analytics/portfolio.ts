// Portfolio analytics for the governance screen — the champion-challenger
// headline (plan.md Screen 8 / §17), segment fairness slices, and curated demo
// cases. The simulated bad-rate uses the HIDDEN synthetic_default label from the
// raw data (never a model feature), so it is an honest outcome measure.

import type { MsmeCase } from "../types";
import { getAllCases, getRaws } from "../data/dataset";

/**
 * Traditional baseline proxy: the document / bureau-heavy status quo that
 * rejects thin-file, NTC, or short-vintage MSMEs regardless of cash-flow.
 */
export function traditionalApproves(c: MsmeCase): boolean {
  const has = (s: string) => c.dataCompleteness.find((d) => d.source === s)?.available ?? false;
  return has("GST") && has("BUREAU") && !c.ntcNtb && c.vintageMonths >= 24;
}

export interface ChampionChallenger {
  population: number;
  thinFileTotal: number;
  rescued: number; // thin-file the baseline rejects but HealthLens keeps in the funnel
  rescuedPct: number; // of the thin-file pool
  healthLensApprovals: number;
  traditionalApprovals: number;
  healthLensApprovedBadRate: number; // % simulated default among HealthLens approvals
  traditionalApprovedBadRate: number; // % simulated default among baseline approvals
}

export function championChallenger(): ChampionChallenger {
  const cases = getAllCases();
  const defaultById = new Map(getRaws().map((m) => [m.profile.msmeId, m.syntheticDefault]));
  const isDefault = (c: MsmeCase) => defaultById.get(c.id) ?? 0;
  const badRate = (arr: MsmeCase[]) =>
    arr.length
      ? Math.round((arr.reduce((s, c) => s + isDefault(c), 0) / arr.length) * 1000) / 10
      : 0;

  const thinFile = cases.filter((c) => c.ntcNtb || c.dataCompleteness.some((d) => !d.available));
  const rescued = thinFile.filter((c) => !traditionalApproves(c) && c.decision !== "Reject");
  const hlApproved = cases.filter((c) => c.decision === "Approve");
  const tradApproved = cases.filter(traditionalApproves);

  return {
    population: cases.length,
    thinFileTotal: thinFile.length,
    rescued: rescued.length,
    rescuedPct: thinFile.length ? Math.round((rescued.length / thinFile.length) * 100) : 0,
    healthLensApprovals: hlApproved.length,
    traditionalApprovals: tradApproved.length,
    healthLensApprovedBadRate: badRate(hlApproved),
    traditionalApprovedBadRate: badRate(tradApproved),
  };
}

export interface FairnessSlice {
  segment: string;
  n: number;
  approvalRate: number; // %
}

export function fairnessSlices(): FairnessSlice[] {
  const cases = getAllCases();
  const slice = (segment: string, pred: (c: MsmeCase) => boolean): FairnessSlice => {
    const g = cases.filter(pred);
    const appr = g.filter((c) => c.decision === "Approve").length;
    return {
      segment,
      n: g.length,
      approvalRate: g.length ? Math.round((appr / g.length) * 100) : 0,
    };
  };
  return [
    slice("Women-owned", (c) => c.womenOwned),
    slice("Other-owned", (c) => !c.womenOwned),
    slice("NTC / NTB", (c) => c.ntcNtb),
    slice("Existing borrower", (c) => !c.ntcNtb),
    slice("GST-registered", (c) => c.gstin !== null),
    slice("No GST on file", (c) => c.gstin === null),
  ];
}

export interface RejectReason {
  code: string;
  label: string;
  count: number;
}

export function topRejectReasons(limit = 6): RejectReason[] {
  const cases = getAllCases().filter((c) => c.decision !== "Approve");
  const tally = new Map<string, { label: string; count: number }>();
  for (const c of cases) {
    for (const r of c.reasonCodes) {
      if (r.polarity !== "negative") continue;
      const e = tally.get(r.code) ?? { label: r.label, count: 0 };
      e.count++;
      tally.set(r.code, e);
    }
  }
  return [...tally.entries()]
    .map(([code, v]) => ({ code, label: v.label, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export interface DemoCase {
  id: string;
  title: string;
  note: string;
}

/** A curated, reliable demo set covering approve / refer / reject / thin-file / fraud. */
export function getDemoCases(): DemoCase[] {
  const cases = getAllCases();
  const archById = new Map(getRaws().map((m) => [m.profile.msmeId, m.profile.archetype]));
  const arch = (id: string) => archById.get(id);
  const pick = (pred: (c: MsmeCase) => boolean, title: string, note: string): DemoCase | null => {
    const c = cases.find(pred);
    return c ? { id: c.id, title, note } : null;
  };
  return [
    pick(
      (c) => arch(c.id) === "STABLE_TRADER" && c.decision === "Approve",
      "Stable GST trader",
      "Clear approve · Band A/B",
    ),
    pick(
      (c) => arch(c.id) === "NTC_NO_GST" && c.decision === "Refer",
      "Thin-file NTC retailer",
      "Refer · path-to-credit",
    ),
    pick(
      (c) => arch(c.id) === "SEASONAL_AGRO" && c.decision === "Refer",
      "Seasonal agro processor",
      "Refer · seasonality",
    ),
    pick(
      (c) => arch(c.id) === "FRAUD_SUSPECT",
      "Fraud-suspect mismatch",
      "Reject · GST-bank mismatch",
    ),
    pick(
      (c) => arch(c.id) === "WOMEN_SERVICE" && c.decision === "Approve",
      "Women-owned services",
      "Approve · cash-flow",
    ),
  ].filter((d): d is DemoCase => d !== null);
}
