import { describe, it, expect } from "vitest";
import type { RawMsme, RawProfile } from "../data/raw-types";
import type { FeatureVector } from "./features";
import type { SubScores } from "../types";
import { generateMsme, generateDataset } from "../data/generate";
import {
  computeHealthScore,
  creditStyleScore,
  riskBand,
  computeSubScores,
  SUBSCORE_WEIGHTS,
} from "./scorecard";
import {
  hardFlags,
  breDecision,
  recommendedLimit,
  detectBusinessNeed,
  routeProduct,
  gemGatesPass,
  pathToCredit,
} from "./decision";
import { scoreMl } from "./ml";
import { scoreCase, scoreDataset } from "./score";

const VALID_GSTIN = "27AAPFU0939F1ZV";

function feat(over: Partial<FeatureVector> = {}): FeatureVector {
  return {
    hasGst: true,
    hasUpi: true,
    hasEpfo: true,
    hasBureau: true,
    gstMonthlyTurnoverAvg: 2_000_000,
    gstTurnoverCov: 0.1,
    gstOnTimeRatio: 0.95,
    gstZeroReturnRatio: 0,
    gstConcentration: 0.3,
    bankMonthlyCreditAvg: 1_900_000,
    bankCreditVolatility: 0.1,
    emiBounceCount: 0,
    negativeBalanceDaysRatio: 0.01,
    cashVsDigitalRatio: 0,
    hasCircular: false,
    upiTrend: 0.2,
    upiRefundRatio: 0.01,
    upiConcentration: 0.1,
    epfoMissingMonthRatio: 0,
    epfoEmployeeGrowth: 0.1,
    debtServiceRatio: 0.1,
    dpdDays: 0,
    gstBankTurnoverGap: 0.05,
    hasPower: true,
    powerConsumptionAvg: 770,
    powerTrend: 0.1,
    powerImpliedTurnover: 2_000_000,
    turnoverPowerGap: 0.05,
    hasFuel: true,
    fuelSpendAvg: 28_000,
    fuelTrend: 0.05,
    fuelImpliedActivity: 1_848_000,
    fuelTurnoverGap: 0.08,
    seasonalSectorFlag: false,
    ...over,
  };
}

function profile(over: Partial<RawProfile> = {}): RawProfile {
  return {
    msmeId: "MSME-T1",
    legalName: "Test Co Pvt Ltd",
    constitution: "Private Limited",
    sector: "General Trading",
    clusterCity: "Pune, MH",
    gstin: VALID_GSTIN,
    udyamId: "UDYAM-MH-26-1234567",
    vintageMonths: 60,
    womenOwned: false,
    ntcNtb: false,
    existingIdbiCustomer: true,
    requestedAmount: 2_000_000,
    seasonalSector: false,
    archetype: "STABLE_TRADER",
    gemSeller: false,
    gemRating: 0,
    activePoCount: 0,
    activePoValue: 0,
    poTenorDays: 0,
    existingFacilityType: null,
    currentLimit: 0,
    limitUtilizationPct: 0,
    renewalDueFlag: false,
    ...over,
  };
}

function rawWith(over: Partial<RawProfile>): RawMsme {
  return {
    profile: profile(over),
    gst: null,
    bank: { accountId: "AC1", ifsc: "IDIB0001", openingBalance: 0, transactions: [] },
    upi: null,
    epfo: null,
    power: null,
    fuel: null,
    bureau: null,
    dataCompleteness: [],
    latentDefaultPropensity: 0.1,
    syntheticDefault: 0,
    anomalyTags: [],
  };
}

describe("scorecard math", () => {
  it("sub-score weights sum to exactly 1", () => {
    const sum = Object.values(SUBSCORE_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(Math.round(sum * 1000) / 1000).toBe(1);
  });

  it("maps bands from HealthScore thresholds only", () => {
    expect(riskBand(80)).toBe("A");
    expect(riskBand(79)).toBe("B");
    expect(riskBand(65)).toBe("B");
    expect(riskBand(64)).toBe("C");
    expect(riskBand(50)).toBe("C");
    expect(riskBand(49)).toBe("D");
  });

  it("maps the 300–900 credit-style score consistently", () => {
    expect(creditStyleScore(82)).toBe(792);
    expect(creditStyleScore(0)).toBe(300);
    expect(creditStyleScore(100)).toBe(900);
  });

  it("re-normalises weights when sub-scores are missing", () => {
    const sub: SubScores = {
      gst: null,
      bank: 80,
      upi: null,
      epfo: null,
      compliance: 90,
      bureau: null,
      operations: null,
    };
    // (0.30*80 + 0.10*90) / (0.30 + 0.10) = 33 / 0.40 = 82.5 → 83
    expect(computeHealthScore(sub)).toBe(83);
  });

  it("does not let the seasonal flag wrongly penalise predictable volatility", () => {
    const volatile = feat({ bankCreditVolatility: 0.6 });
    const raw = rawWith({});
    const seasonal = computeSubScores({ ...volatile, seasonalSectorFlag: true }, raw).bank!;
    const nonSeasonal = computeSubScores({ ...volatile, seasonalSectorFlag: false }, raw).bank!;
    expect(seasonal).toBeGreaterThan(nonSeasonal); // seasonality softens the volatility penalty
  });
});

describe("BRE decision + limit", () => {
  it("approves clean band A/B and refers band C", () => {
    const f = feat();
    expect(breDecision("A", f, hardFlags(f))).toBe("Approve");
    expect(breDecision("B", f, hardFlags(f))).toBe("Approve");
    expect(breDecision("C", f, hardFlags(f))).toBe("Refer");
    expect(breDecision("D", f, hardFlags(f))).toBe("Reject");
  });

  it("rejects on hard policy breaches regardless of band", () => {
    expect(breDecision("A", feat({ dpdDays: 90 }), hardFlags(feat({ dpdDays: 90 })))).toBe(
      "Reject",
    );
    expect(
      breDecision("A", feat({ emiBounceCount: 7 }), hardFlags(feat({ emiBounceCount: 7 }))),
    ).toBe("Reject");
    const fraud = feat({ gstBankTurnoverGap: 0.7 });
    expect(breDecision("A", fraud, hardFlags(fraud))).toBe("Reject");
  });

  it("refers (not approves) band B with mild red flags", () => {
    const mild = feat({ emiBounceCount: 4 }); // not >6, but >2 ⇒ not clean
    expect(breDecision("B", mild, hardFlags(mild))).toBe("Refer");
  });

  it("computes a cash-flow limit capped at ₹25 lakh and reduced by high DSR", () => {
    const f = feat();
    expect(recommendedLimit("A", f, hardFlags(f))).toBe(1_150_000); // round(min(2.0M,1.9M)*0.6) → 1.14M → 1.15M bucket
    expect(recommendedLimit("D", f, hardFlags(f))).toBe(0);
    const huge = feat({ gstMonthlyTurnoverAvg: 50_000_000, bankMonthlyCreditAvg: 50_000_000 });
    expect(recommendedLimit("A", huge, hardFlags(huge))).toBe(2_500_000); // cap
    const stressed = feat({ debtServiceRatio: 0.35 });
    expect(recommendedLimit("A", stressed, hardFlags(stressed))).toBeLessThan(
      recommendedLimit("A", f, hardFlags(f)),
    );
  });
});

describe("product routing (plan.md §8)", () => {
  it("routes ETB GST small-ticket to i-MSME Express", () => {
    const raw = rawWith({ existingIdbiCustomer: true });
    const r = routeProduct(raw, feat(), "Approve", "WorkingCapital", hardFlags(feat()), 1_200_000);
    expect(r.route).toBe("i-MSME Express");
  });

  it("does NOT route NTC/NTB to i-MSME Express", () => {
    const raw = rawWith({ existingIdbiCustomer: false, ntcNtb: true });
    const r = routeProduct(raw, feat(), "Approve", "WorkingCapital", hardFlags(feat()), 700_000);
    expect(r.route).not.toBe("i-MSME Express");
    expect(r.route).toBe("Digital MSME Onboarding");
  });

  it("routes existing renewal profile to i-Prompt Renewal", () => {
    const raw = rawWith({
      existingIdbiCustomer: true,
      existingFacilityType: "Cash Credit",
      renewalDueFlag: true,
      requestedAmount: 2_000_000,
    });
    const need = detectBusinessNeed(raw, feat(), "Approve");
    const r = routeProduct(raw, feat(), "Approve", need, hardFlags(feat()), 1_500_000);
    expect(r.route).toBe("i-Prompt Renewal");
  });

  it("routes a GeM seller to GeM Sahay ONLY when every gate passes", () => {
    const ok = rawWith({
      gemSeller: true,
      gstin: VALID_GSTIN,
      udyamId: "UDYAM-MH-26-1",
      vintageMonths: 30,
      gemRating: 4,
      activePoCount: 2,
      activePoValue: 1_000_000,
      poTenorDays: 60,
    });
    expect(gemGatesPass(ok, hardFlags(feat()))).toBe(true);
    expect(
      routeProduct(ok, feat(), "Approve", "POFinance", hardFlags(feat()), 1_000_000).route,
    ).toBe("GeM Sahay");

    // fail a single gate → not GeM, eligibility gap, decision downgraded
    const badRating = rawWith({ ...ok.profile, gemRating: 3 });
    expect(gemGatesPass(badRating, hardFlags(feat()))).toBe(false);
    const r = routeProduct(badRating, feat(), "Approve", "POFinance", hardFlags(feat()), 1_000_000);
    expect(r.route).toBe("Manual Review");
    expect(r.eligibilityGap).toBe(true);
    expect(r.decision).toBe("Refer");

    // each numeric gate independently fails
    expect(gemGatesPass(rawWith({ ...ok.profile, vintageMonths: 18 }), hardFlags(feat()))).toBe(
      false,
    );
    expect(gemGatesPass(rawWith({ ...ok.profile, activePoCount: 4 }), hardFlags(feat()))).toBe(
      false,
    );
    expect(
      gemGatesPass(rawWith({ ...ok.profile, activePoValue: 2_500_000 }), hardFlags(feat())),
    ).toBe(false);
    expect(gemGatesPass(rawWith({ ...ok.profile, poTenorDays: 120 }), hardFlags(feat()))).toBe(
      false,
    );
  });

  it("routes rejected applications to manual review", () => {
    const raw = rawWith({ existingIdbiCustomer: true });
    expect(routeProduct(raw, feat(), "Reject", "PathToCredit", hardFlags(feat()), 0).route).toBe(
      "Manual Review",
    );
  });
});

describe("business need + path-to-credit", () => {
  it("detects a valid business need", () => {
    const valid = [
      "WorkingCapital",
      "POFinance",
      "RenewalReview",
      "LimitEnhancement",
      "ManualReview",
      "PathToCredit",
    ];
    expect(valid).toContain(
      detectBusinessNeed(rawWith({ gemSeller: true, activePoCount: 1 }), feat(), "Approve"),
    );
    expect(detectBusinessNeed(rawWith({}), feat(), "Reject")).toBe("PathToCredit");
    expect(
      detectBusinessNeed(
        rawWith({ existingFacilityType: "OD", renewalDueFlag: true }),
        feat(),
        "Approve",
      ),
    ).toBe("RenewalReview");
  });

  it("generates path-to-credit actions for refer/reject from negative reason codes", () => {
    const reasons = [{ code: "GST_DELAY_HIGH", polarity: "negative" as const, label: "x" }];
    expect(pathToCredit(reasons, "Approve")).toHaveLength(0);
    const actions = pathToCredit(reasons, "Refer");
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.length).toBeLessThanOrEqual(5);
  });
});

describe("ML viability layer", () => {
  it("is deterministic and ranks a healthy profile above a risky one", () => {
    const healthy = scoreMl(feat());
    const again = scoreMl(feat());
    expect(again.viability).toBe(healthy.viability);
    const risky = scoreMl(
      feat({ emiBounceCount: 8, gstBankTurnoverGap: 0.6, debtServiceRatio: 0.6, dpdDays: 90 }),
    );
    expect(healthy.viability).toBeGreaterThan(risky.viability);
    expect(healthy.contributions.length).toBeGreaterThan(0);
  });
});

describe("end-to-end on the synthetic population", () => {
  const raws = generateDataset(400);
  const cases = scoreDataset(raws);
  const archById = new Map(raws.map((m) => [m.profile.msmeId, m.profile.archetype]));

  it("produces a valid, internally consistent MsmeCase for every record", () => {
    for (const c of cases) {
      expect(c.healthScore).toBeGreaterThanOrEqual(0);
      expect(c.healthScore).toBeLessThanOrEqual(100);
      expect(c.creditStyleScore).toBe(300 + c.healthScore * 6); // ML never replaces HealthScore mapping
      expect(c.mlProbabilityProxy).toBeGreaterThanOrEqual(0);
      expect(c.mlProbabilityProxy).toBeLessThanOrEqual(1);
      expect(["A", "B", "C", "D"]).toContain(c.riskBand);
      expect(["Approve", "Refer", "Reject"]).toContain(c.decision);
      expect(c.peerClusterPercentile).toBeGreaterThanOrEqual(0);
      expect(c.peerClusterPercentile).toBeLessThanOrEqual(100);
    }
  });

  it("rejects fraud-suspect profiles (GST-vs-bank mismatch)", () => {
    const fraud = cases.filter((c) => archById.get(c.id) === "FRAUD_SUSPECT");
    expect(fraud.length).toBeGreaterThan(0);
    expect(fraud.every((c) => c.decision === "Reject")).toBe(true);
  });

  it("approves the majority of stable traders", () => {
    const stable = cases.filter((c) => archById.get(c.id) === "STABLE_TRADER");
    const approved = stable.filter((c) => c.decision === "Approve").length;
    expect(approved / stable.length).toBeGreaterThan(0.5);
  });

  it("never routes NTC no-GST profiles to i-MSME Express", () => {
    const ntc = cases.filter((c) => archById.get(c.id) === "NTC_NO_GST");
    expect(ntc.length).toBeGreaterThan(0);
    expect(ntc.every((c) => c.productRoute !== "i-MSME Express")).toBe(true);
  });

  it("scores deterministically for a fixed input", () => {
    const a = scoreCase(generateMsme(3));
    const b = scoreCase(generateMsme(3));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("demonstrates approve, refer, and reject across the population (acceptance §17)", () => {
    const decisions = new Set(cases.map((c) => c.decision));
    expect(decisions.has("Approve")).toBe(true);
    expect(decisions.has("Refer")).toBe(true);
    expect(decisions.has("Reject")).toBe(true);
  });

  it("differentiates thin-file/NTC risk instead of blanket-approving", () => {
    const ntc = cases.filter((c) => archById.get(c.id) === "NTC_NO_GST");
    expect(ntc.some((c) => c.decision === "Refer")).toBe(true); // some referred (discernment)
    expect(ntc.some((c) => c.decision === "Approve")).toBe(true); // viable still approved (inclusion)
  });
});
