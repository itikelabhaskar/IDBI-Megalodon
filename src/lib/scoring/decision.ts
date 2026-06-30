// Decisioning layer — BRE decision, recommended limit, business-need detection,
// IDBI product routing (with strict GeM Sahay gates), and path-to-credit.
// Follows plan.md §7 (decision logic / limit) and §8 (product routing).

import type { RawMsme } from "../data/raw-types";
import type {
  Decision,
  RiskBand,
  BusinessNeed,
  ProductRoute,
  ReasonCode,
  PathToCreditAction,
} from "../types";
import type { FeatureVector } from "./features";

export interface HardFlags {
  bouncesExcessive: boolean; // > 6 in 12m
  dpd90: boolean;
  fraudStrong: boolean; // GST-vs-bank mismatch, power-vs-turnover mismatch, or circular flow
  dsrHigh: boolean; // debt-service ratio > 0.4
}

export function hardFlags(f: FeatureVector): HardFlags {
  return {
    bouncesExcessive: f.emiBounceCount > 6,
    dpd90: f.dpdDays >= 90,
    fraudStrong:
      (f.hasGst && f.gstBankTurnoverGap > 0.5) ||
      (f.hasGst && f.turnoverPowerGap > 0.5) ||
      f.hasCircular,
    dsrHigh: f.debtServiceRatio > 0.4,
  };
}

/** Approve / Refer / Reject — band thresholds gated by hard policy rules. */
export function breDecision(band: RiskBand, f: FeatureVector, flags: HardFlags): Decision {
  if (band === "D" || flags.dpd90 || flags.bouncesExcessive || flags.fraudStrong) return "Reject";
  const cleanForApprove =
    !flags.dsrHigh && f.emiBounceCount <= 2 && f.dpdDays <= 30 && f.debtServiceRatio <= 0.4;
  if ((band === "A" || band === "B") && cleanForApprove) return "Approve";
  return "Refer"; // band B with mild flags, or band C
}

/** Cash-flow-based working-capital limit, capped at ₹25 lakh. */
export function recommendedLimit(band: RiskBand, f: FeatureVector, flags: HardFlags): number {
  const inflow = f.hasGst
    ? Math.min(f.gstMonthlyTurnoverAvg, f.bankMonthlyCreditAvg)
    : f.bankMonthlyCreditAvg;
  const k = band === "A" ? 0.6 : band === "B" ? 0.5 : band === "C" ? 0.3 : 0;
  let limit = inflow * k;
  if (f.debtServiceRatio > 0.3 || flags.fraudStrong) limit *= 0.7;
  limit = Math.min(limit, 2_500_000);
  return Math.max(0, Math.round(limit / 50_000) * 50_000);
}

export function detectBusinessNeed(
  raw: RawMsme,
  f: FeatureVector,
  decision: Decision,
): BusinessNeed {
  if (decision === "Reject") return "PathToCredit";
  const p = raw.profile;
  if (p.gemSeller && p.activePoCount >= 1) return "POFinance";
  if (p.existingFacilityType && p.renewalDueFlag) return "RenewalReview";
  if (p.existingFacilityType && p.limitUtilizationPct > 85) return "LimitEnhancement";
  if (!f.hasGst && !f.hasBureau && decision === "Refer") return "ManualReview";
  return "WorkingCapital";
}

export interface RoutingResult {
  route: ProductRoute;
  reason: string;
  eligibilityGap: boolean;
  decision: Decision; // possibly downgraded after product-eligibility check
}

/** All GeM Sahay numeric eligibility gates (plan.md §8). */
export function gemGatesPass(raw: RawMsme, flags: HardFlags): boolean {
  const p = raw.profile;
  const perPo = p.activePoCount > 0 ? p.activePoValue / p.activePoCount : 0;
  return (
    p.gemSeller &&
    !!p.gstin &&
    !!p.udyamId &&
    p.vintageMonths >= 24 &&
    p.gemRating >= 4 &&
    p.activePoCount >= 1 &&
    p.activePoCount <= 3 &&
    perPo >= 40_000 &&
    perPo <= 1_000_000 &&
    p.activePoValue <= 2_000_000 &&
    p.poTenorDays >= 21 &&
    p.poTenorDays <= 105 &&
    !flags.fraudStrong
  );
}

export function routeProduct(
  raw: RawMsme,
  f: FeatureVector,
  decision: Decision,
  businessNeed: BusinessNeed,
  flags: HardFlags,
  recommended: number,
): RoutingResult {
  const p = raw.profile;

  // Rejected cases never straight-through to a product.
  if (decision === "Reject") {
    return {
      route: "Manual Review",
      reason:
        "Application rejected on policy/fraud grounds; routed for manual review and path-to-credit.",
      eligibilityGap: false,
      decision,
    };
  }

  // GeM Sahay — only when every numeric gate passes.
  if (businessNeed === "POFinance" || p.gemSeller) {
    if (gemGatesPass(raw, flags)) {
      return {
        route: "GeM Sahay",
        reason:
          "GeM seller with valid GST/Udyam, rating ≥ 4, and PO-backed working-capital need within scheme limits.",
        eligibilityGap: false,
        decision,
      };
    }
    if (p.gemSeller) {
      return {
        route: "Manual Review",
        reason:
          "GeM Sahay eligibility not met (a PO / rating / vintage gate failed); routed to manual review.",
        eligibilityGap: true,
        decision: decision === "Approve" ? "Refer" : decision,
      };
    }
  }

  // i-Prompt MSME Renewal — existing borrower, renewal/limit need, ₹10–50 lakh.
  const renewalAmt = Math.max(p.requestedAmount, p.currentLimit);
  if (
    p.existingIdbiCustomer &&
    p.existingFacilityType &&
    (businessNeed === "RenewalReview" || businessNeed === "LimitEnhancement" || p.renewalDueFlag) &&
    renewalAmt > 1_000_000 &&
    renewalAmt <= 5_000_000
  ) {
    return {
      route: "i-Prompt Renewal",
      reason:
        "Existing IDBI MSME borrower with a renewal/limit-review need and facility above ₹10 lakh.",
      eligibilityGap: false,
      decision,
    };
  }

  // i-MSME Express — ETB, GST-registered, ₹1–25 lakh unsecured working capital.
  if (p.existingIdbiCustomer && f.hasGst && recommended >= 100_000 && recommended <= 2_500_000) {
    return {
      route: "i-MSME Express",
      reason:
        "Existing IDBI customer, GST-registered, within the ₹1–25 lakh unsecured working-capital band.",
      eligibilityGap: false,
      decision,
    };
  }

  // New-to-bank viable MSMEs — never current i-MSME Express; onboard digitally / CGTMSE.
  if (!p.existingIdbiCustomer) {
    return {
      route: "Digital MSME Onboarding",
      reason:
        "New-to-bank MSME with a viable alternate-data profile; onboard digitally (CGTMSE-backed where collateral-free).",
      eligibilityGap: false,
      decision,
    };
  }

  // Fallback — collateral-free CGTMSE / manual review.
  return {
    route: "CGTMSE",
    reason: "Collateral-free CGTMSE-backed route / officer review.",
    eligibilityGap: false,
    decision,
  };
}

export function pathToCredit(reasons: ReasonCode[], decision: Decision): PathToCreditAction[] {
  if (decision === "Approve") return [];
  const has = (c: string) => reasons.some((r) => r.code === c);
  const actions: PathToCreditAction[] = [];
  if (has("GST_MISSING"))
    actions.push({
      action: "Complete GST registration and file 3 months of returns",
      rationale: "Unlocks the GST behaviour sub-score and i-MSME Express eligibility",
    });
  if (has("GST_DELAY_HIGH"))
    actions.push({
      action: "File GST returns on time for the next 3–6 months",
      rationale: "Lifts the GST behaviour and compliance sub-scores",
    });
  if (has("BOUNCE_EXCESSIVE"))
    actions.push({
      action: "Maintain zero EMI/cheque bounces for 3 months",
      rationale: "Removes the hard bounce reject trigger",
    });
  if (has("UPI_REFUND_HIGH"))
    actions.push({
      action: "Reduce UPI refunds below 3% of digital sales",
      rationale: "Improves the digital-payments quality signal",
    });
  if (has("EPFO_MISSED"))
    actions.push({
      action: "Regularise EPFO contributions",
      rationale: "Strengthens payroll-stability evidence",
    });
  if (has("BUREAU_STRESSED"))
    actions.push({
      action: "Reduce existing EMI load below 30% of monthly inflows",
      rationale: "Lowers the debt-service ratio and bureau stress",
    });
  if (has("GST_CONCENTRATION_HIGH"))
    actions.push({
      action: "Diversify sales beyond the top three buyers",
      rationale: "Reduces customer-concentration risk",
    });
  if (actions.length === 0)
    actions.push({
      action: "Maintain stable cash flows and a healthy minimum balance for 3 months",
      rationale: "Builds a stronger cash-flow track record",
    });
  return actions.slice(0, 5);
}
