// Feature set the ML viability model is trained on. The numeric parameters
// (mean / std / weight) are fitted offline and persisted in model.json — kept
// separate so the training script can import these definitions without needing
// the fitted artefact to exist yet.

import type { FeatureVector } from "./features";

export interface TermDef {
  key: string;
  label: string;
  value: (f: FeatureVector) => number;
  available: (f: FeatureVector) => boolean;
  signToDefault: 1 | -1; // monotonic constraint: +1 = risk-increasing, -1 = risk-reducing
}

export const TERM_DEFS: TermDef[] = [
  {
    key: "gstOnTimeRatio",
    label: "GST filing punctuality",
    value: (f) => f.gstOnTimeRatio,
    available: (f) => f.hasGst,
    signToDefault: -1,
  },
  {
    key: "bankCreditVolatility",
    label: "Cash-flow volatility",
    value: (f) => f.bankCreditVolatility,
    available: () => true,
    signToDefault: 1,
  },
  {
    key: "emiBounceCount",
    label: "EMI/cheque bounces",
    value: (f) => f.emiBounceCount,
    available: () => true,
    signToDefault: 1,
  },
  {
    key: "gstBankTurnoverGap",
    label: "GST-vs-bank mismatch",
    value: (f) => f.gstBankTurnoverGap,
    available: (f) => f.hasGst,
    signToDefault: 1,
  },
  {
    key: "upiRefundRatio",
    label: "UPI refund ratio",
    value: (f) => f.upiRefundRatio,
    available: (f) => f.hasUpi,
    signToDefault: 1,
  },
  {
    key: "debtServiceRatio",
    label: "Debt-service ratio",
    value: (f) => f.debtServiceRatio,
    available: (f) => f.hasBureau,
    signToDefault: 1,
  },
  {
    key: "dpdDays",
    label: "Worst DPD",
    value: (f) => f.dpdDays,
    available: (f) => f.hasBureau,
    signToDefault: 1,
  },
  {
    key: "epfoMissingMonthRatio",
    label: "EPFO contribution gaps",
    value: (f) => f.epfoMissingMonthRatio,
    available: (f) => f.hasEpfo,
    signToDefault: 1,
  },
  {
    key: "gstConcentration",
    label: "Buyer concentration",
    value: (f) => f.gstConcentration,
    available: (f) => f.hasGst,
    signToDefault: 1,
  },
  {
    key: "upiTrend",
    label: "Digital-payments momentum",
    value: (f) => f.upiTrend,
    available: (f) => f.hasUpi,
    signToDefault: -1,
  },
  {
    key: "powerTrend",
    label: "Power-consumption momentum",
    value: (f) => f.powerTrend,
    available: (f) => f.hasPower,
    signToDefault: -1,
  },
  {
    key: "turnoverPowerGap",
    label: "Power-vs-turnover mismatch",
    value: (f) => f.turnoverPowerGap,
    available: (f) => f.hasPower && f.hasGst,
    signToDefault: 1,
  },
];
