// Reason codes and fraud flags (plan.md §7 reason codes, perplexity2 §4.7).
// Each is an enumerated label with a plain-language explanation for the officer.

import type { ReasonCode, FraudFlag } from "../types";
import type { FeatureVector } from "./features";

export function reasonCodes(f: FeatureVector): ReasonCode[] {
  const out: ReasonCode[] = [];
  const pos = (code: string, label: string) => out.push({ code, polarity: "positive", label });
  const neg = (code: string, label: string) => out.push({ code, polarity: "negative", label });

  // Positive
  if (f.hasGst && f.gstOnTimeRatio >= 0.9)
    pos("GST_ON_TIME_STRONG", "GST returns filed on time in ≥ 90% of months");
  if (f.bankCreditVolatility < 0.2)
    pos("CASHFLOW_STABLE", "Monthly inflows vary less than 20% around average");
  if (f.emiBounceCount === 0)
    pos("LOW_BOUNCE_HISTORY", "No EMI or cheque bounces in the last 12 months");
  if (f.hasUpi && f.upiTrend > 0.1)
    pos("UPI_GROWTH_STRONG", "Digital payment volumes growing steadily over 12 months");
  if (f.hasEpfo && f.epfoMissingMonthRatio < 0.1 && f.epfoEmployeeGrowth >= 0)
    pos("PAYROLL_STABLE", "EPFO contributions consistent with stable or rising headcount");
  if (f.hasPower && f.powerTrend >= -0.05 && (!f.hasGst || f.turnoverPowerGap <= 0.2))
    pos(
      "POWER_ACTIVITY_CONFIRMED",
      f.hasGst
        ? "Electricity consumption is consistent with declared turnover"
        : "Electricity usage confirms active operations; turnover inferred from power for this thin-file applicant",
    );

  // Negative
  if (!f.hasGst)
    neg("GST_MISSING", "No GST data — decision based on bank cash flows and digital payments");
  if (f.hasGst && f.gstOnTimeRatio < 0.7)
    neg("GST_DELAY_HIGH", "GST returns delayed in more than 30% of months");
  if (f.hasGst && f.gstConcentration > 0.7)
    neg("GST_CONCENTRATION_HIGH", "Top three buyers contribute more than 70% of sales");
  if (f.bankCreditVolatility > 0.5 && !f.seasonalSectorFlag)
    neg("CASHFLOW_VOLATILE", "Cash inflows highly volatile vs sector norms");
  if (f.emiBounceCount > 6)
    neg("BOUNCE_EXCESSIVE", "More than 6 EMI/cheque bounces in the last 12 months");
  if (f.hasUpi && f.upiRefundRatio > 0.05)
    neg("UPI_REFUND_HIGH", "Refunds above 5% of digital sales (possible quality issues)");
  if (f.hasEpfo && f.epfoMissingMonthRatio >= 0.25)
    neg("EPFO_MISSED", "EPFO contributions missed for 3 or more months in the last year");
  if (f.hasBureau && f.debtServiceRatio > 0.4)
    neg("BUREAU_STRESSED", "Existing EMI obligations exceed 40% of average monthly inflows");
  if (f.hasGst && f.gstBankTurnoverGap > 0.5)
    neg("GST_BANK_MISMATCH", "Declared GST turnover far exceeds matching bank credits");
  if (f.hasGst && f.turnoverPowerGap > 0.5)
    neg(
      "POWER_TURNOVER_MISMATCH",
      "Electricity usage far below declared turnover — operations may be overstated",
    );
  if (f.hasPower && f.powerTrend < -0.2)
    neg(
      "POWER_DECLINING",
      "Electricity consumption falling sharply — operations may be contracting",
    );
  if (f.hasCircular)
    neg("CIRCULAR_FLOW_SUSPECT", "Repeated round-amount / circular transfers detected");

  return out;
}

export function fraudFlags(f: FeatureVector): FraudFlag[] {
  const out: FraudFlag[] = [];
  if (f.hasGst && f.gstBankTurnoverGap > 0.5)
    out.push({
      code: "GST_BANK_MISMATCH",
      severity: "high",
      label: `GST turnover ${Math.round(f.gstBankTurnoverGap * 100)}% above matching bank credits`,
    });
  if (f.hasGst && f.turnoverPowerGap > 0.5)
    out.push({
      code: "POWER_TURNOVER_MISMATCH",
      severity: "high",
      label: `Power-implied activity ${Math.round(f.turnoverPowerGap * 100)}% below declared turnover`,
    });
  if (f.hasCircular)
    out.push({
      code: "CIRCULAR_FLOW",
      severity: "high",
      label: "Round-amount circular transfers detected in the bank feed",
    });
  if (f.hasUpi && f.upiRefundRatio > 0.05)
    out.push({
      code: "UPI_REFUND_SPIKE",
      severity: "warn",
      label: `UPI refunds at ${(f.upiRefundRatio * 100).toFixed(1)}% of inflows`,
    });
  if (f.hasEpfo && f.epfoEmployeeGrowth < -0.2)
    out.push({
      code: "PAYROLL_DIVERGENCE",
      severity: "warn",
      label: "Falling EPFO headcount despite claimed business activity",
    });
  return out;
}
