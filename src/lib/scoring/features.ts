// Feature engineering — turns a RawMsme's alternate-data into the model/feature
// vector the scorecard, BRE and ML layers consume (plan.md §7, perplexity2 §4.2).
//
// Features are computed purely from observable data. They are NEVER read from the
// hidden latent or the synthetic_default label (see the leakage-free design).

import type { RawMsme } from "../data/raw-types";
import { detectReversedPairs } from "./fraud-analytics";

// Average ₹ of turnover represented by 1 kWh of electricity consumed. Used to
// translate power usage into an implied turnover (thin-file inference) and to
// triangulate declared GST turnover against real operational activity.
export const RUPEES_PER_KWH = 2600;

// Average ₹ of turnover represented by ₹1 of fuel spend (inverse of a blended
// fuel-intensity across logistics/trading sectors). Used to translate fuel spend
// into implied operating activity for thin-file traders.
export const RUPEES_TURNOVER_PER_FUEL = 66;

export interface FeatureVector {
  hasGst: boolean;
  hasUpi: boolean;
  hasEpfo: boolean;
  hasBureau: boolean;

  // GST
  gstMonthlyTurnoverAvg: number;
  gstTurnoverCov: number;
  gstOnTimeRatio: number;
  gstZeroReturnRatio: number;
  gstConcentration: number;

  // Bank cash-flow (genuine SALE credits)
  bankMonthlyCreditAvg: number;
  bankCreditVolatility: number;
  emiBounceCount: number;
  negativeBalanceDaysRatio: number;
  cashVsDigitalRatio: number;
  hasCircular: boolean;

  // UPI
  upiTrend: number; // (last-3 avg − first-3 avg) / first-3 avg
  upiRefundRatio: number;
  upiConcentration: number;

  // EPFO
  epfoMissingMonthRatio: number;
  epfoEmployeeGrowth: number;

  // Bureau-lite
  debtServiceRatio: number;
  dpdDays: number; // 0 / 30 / 60 / 90

  // Power / operations (electricity-consumption alternate signal)
  hasPower: boolean;
  powerConsumptionAvg: number; // mean monthly kWh
  powerTrend: number; // (last-3 avg − first-3 avg) / first-3 avg
  powerImpliedTurnover: number; // powerConsumptionAvg × RUPEES_PER_KWH (monthly)
  turnoverPowerGap: number; // (gstTurnover − powerImplied) / gstTurnover — high ⇒ activity below claimed turnover

  // Fuel / operations (fuel-spend alternate signal for traders & logistics)
  hasFuel: boolean;
  fuelSpendAvg: number; // mean monthly fuel spend (₹)
  fuelTrend: number; // (last-3 avg − first-3 avg) / first-3 avg
  fuelImpliedActivity: number; // fuelSpendAvg × RUPEES_TURNOVER_PER_FUEL (monthly)
  fuelTurnoverGap: number; // (gstTurnover − fuelImplied) / gstTurnover

  // Cross-source triangulation
  gstBankTurnoverGap: number; // (gstTotal − bankSaleTotal) / gstTotal — high ⇒ mismatch
  seasonalSectorFlag: boolean;
}

const mean = (a: number[]): number => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const std = (a: number[]): number => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(mean(a.map((x) => (x - m) ** 2)));
};
const cov = (a: number[]): number => {
  const m = mean(a);
  return m === 0 ? 0 : std(a) / m;
};

function dpdToDays(bucket: "0" | "30" | "60" | "90+"): number {
  return bucket === "90+" ? 90 : Number(bucket);
}

export function computeFeatures(raw: RawMsme): FeatureVector {
  const hasGst = !!raw.gst;
  const hasUpi = !!raw.upi;
  const hasEpfo = !!raw.epfo;
  const hasBureau = !!raw.bureau;

  // ---- Bank monthly aggregation (genuine SALE credits + closing balances) ----
  const byMonth = new Map<string, { sale: number; debit: number }>();
  let negBalance = 0;
  let cashCr = 0;
  let allCr = 0;
  let emiBounceCount = 0;

  for (const t of raw.bank.transactions) {
    const period = t.txnDate.slice(0, 7);
    const m = byMonth.get(period) ?? { sale: 0, debit: 0 };
    if (t.direction === "CR" && !t.isReturn) {
      allCr += t.amount;
      if (t.channel === "CASH") cashCr += t.amount;
      if (t.narrationTag === "SALE") m.sale += t.amount;
    }
    if (t.direction === "DR" && !t.isReturn) m.debit += t.amount;
    if (t.narrationTag === "EMI" && t.isReturn) emiBounceCount++;
    if (t.balancePost < 0) negBalance++;
    byMonth.set(period, m);
  }

  // Circular-flow / round-tripping is now detected statistically (matched in/out
  // pairs of equal value), not via a hard-coded sentinel amount.
  const hasCircular = detectReversedPairs(raw.bank.transactions).count >= 1;

  const monthlySale = [...byMonth.values()].map((m) => m.sale);
  const bankMonthlyCreditAvg = mean(monthlySale);
  const bankCreditVolatility = cov(monthlySale);
  const negativeBalanceDaysRatio = raw.bank.transactions.length
    ? negBalance / raw.bank.transactions.length
    : 0;
  const cashVsDigitalRatio = allCr ? cashCr / allCr : 0;

  // ---- GST ----
  const gstOutward = hasGst ? raw.gst!.map((g) => g.totalOutward) : [];
  const gstMonthlyTurnoverAvg = mean(gstOutward);
  const gstTurnoverCov = cov(gstOutward);
  const gstOnTimeRatio = hasGst
    ? 1 - raw.gst!.filter((g) => g.delayedFlag).length / raw.gst!.length
    : 0;
  const gstZeroReturnRatio = hasGst
    ? raw.gst!.filter((g) => g.zeroReturnFlag).length / raw.gst!.length
    : 0;
  const gstConcentration = hasGst ? mean(raw.gst!.map((g) => g.top3BuyerShare)) : 0;

  const gstTotal = gstOutward.reduce((s, x) => s + x, 0);
  const saleTotal = monthlySale.reduce((s, x) => s + x, 0);
  const gstBankTurnoverGap = hasGst && gstTotal > 0 ? (gstTotal - saleTotal) / gstTotal : 0;

  // ---- UPI ----
  let upiTrend = 0;
  let upiRefundRatio = 0;
  let upiConcentration = 0;
  if (hasUpi) {
    const vals = raw.upi!.map((u) => u.inValue);
    const first3 = mean(vals.slice(0, 3));
    const last3 = mean(vals.slice(-3));
    upiTrend = first3 > 0 ? (last3 - first3) / first3 : 0;
    const inSum = vals.reduce((s, x) => s + x, 0);
    const refundSum = raw.upi!.reduce((s, u) => s + u.refundsValue, 0);
    upiRefundRatio = inSum > 0 ? refundSum / inSum : 0;
    upiConcentration = mean(raw.upi!.map((u) => u.topCounterpartyShare));
  }

  // ---- EPFO ----
  let epfoMissingMonthRatio = 0;
  let epfoEmployeeGrowth = 0;
  if (hasEpfo) {
    epfoMissingMonthRatio = raw.epfo!.filter((e) => !e.contributionPaid).length / raw.epfo!.length;
    const first = raw.epfo![0].employeeCount;
    const last = raw.epfo![raw.epfo!.length - 1].employeeCount;
    epfoEmployeeGrowth = first > 0 ? (last - first) / first : 0;
  }

  // ---- Bureau ----
  const debtServiceRatio = hasBureau
    ? raw.bureau!.totalExistingEmi / Math.max(1, bankMonthlyCreditAvg)
    : 0;
  const dpdDays = hasBureau ? dpdToDays(raw.bureau!.maxDpdBucket) : 0;

  // ---- Power / operations ----
  const hasPower = !!raw.power;
  let powerConsumptionAvg = 0;
  let powerTrend = 0;
  let powerImpliedTurnover = 0;
  let turnoverPowerGap = 0;
  if (hasPower) {
    const units = raw.power!.map((p) => p.unitsKwh);
    powerConsumptionAvg = mean(units);
    const pf3 = mean(units.slice(0, 3));
    const pl3 = mean(units.slice(-3));
    powerTrend = pf3 > 0 ? (pl3 - pf3) / pf3 : 0;
    powerImpliedTurnover = powerConsumptionAvg * RUPEES_PER_KWH;
    turnoverPowerGap =
      hasGst && gstMonthlyTurnoverAvg > 0
        ? (gstMonthlyTurnoverAvg - powerImpliedTurnover) / gstMonthlyTurnoverAvg
        : 0;
  }

  // ---- Fuel / operations ----
  const hasFuel = !!raw.fuel;
  let fuelSpendAvg = 0;
  let fuelTrend = 0;
  let fuelImpliedActivity = 0;
  let fuelTurnoverGap = 0;
  if (hasFuel) {
    const spend = raw.fuel!.map((p) => p.spend);
    fuelSpendAvg = mean(spend);
    const ff3 = mean(spend.slice(0, 3));
    const fl3 = mean(spend.slice(-3));
    fuelTrend = ff3 > 0 ? (fl3 - ff3) / ff3 : 0;
    fuelImpliedActivity = fuelSpendAvg * RUPEES_TURNOVER_PER_FUEL;
    fuelTurnoverGap =
      hasGst && gstMonthlyTurnoverAvg > 0
        ? (gstMonthlyTurnoverAvg - fuelImpliedActivity) / gstMonthlyTurnoverAvg
        : 0;
  }

  return {
    hasGst,
    hasUpi,
    hasEpfo,
    hasBureau,
    gstMonthlyTurnoverAvg,
    gstTurnoverCov,
    gstOnTimeRatio,
    gstZeroReturnRatio,
    gstConcentration,
    bankMonthlyCreditAvg,
    bankCreditVolatility,
    emiBounceCount,
    negativeBalanceDaysRatio,
    cashVsDigitalRatio,
    hasCircular,
    upiTrend,
    upiRefundRatio,
    upiConcentration,
    epfoMissingMonthRatio,
    epfoEmployeeGrowth,
    debtServiceRatio,
    dpdDays,
    hasPower,
    powerConsumptionAvg,
    powerTrend,
    powerImpliedTurnover,
    turnoverPowerGap,
    hasFuel,
    fuelSpendAvg,
    fuelTrend,
    fuelImpliedActivity,
    fuelTurnoverGap,
    gstBankTurnoverGap,
    seasonalSectorFlag: raw.profile.seasonalSector,
  };
}
