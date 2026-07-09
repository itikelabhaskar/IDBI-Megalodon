// Deterministic synthetic MSME generator.
//
// Leakage-free design (plan.md §6, perplexity2 §4.9):
//   - each MSME has a hidden `latentDefaultPropensity` r (archetype + noise),
//   - the training label `syntheticDefault` is a STOCHASTIC Bernoulli draw from r,
//   - observable signals (filings, bounces, mismatch) are drawn from the same r
//     plus INDEPENDENT noise — never as a function of the label.
// So features correlate with default through the shared latent, but no feature is
// a deterministic function of the label.
//
// Internal consistency: bank running balances reconcile by construction, GST and
// bank SALE credits track each other for non-fraud profiles, and GSTINs carry a
// valid checksum.

import { Rng } from "./rng";
import { makeGstin } from "./gstin";
import { ARCHETYPES, pickArchetype, type ArchetypeConfig } from "./archetypes";
import type {
  RawMsme,
  RawProfile,
  GstMonthly,
  BankAccount,
  BankTxn,
  UpiMonthly,
  EpfoMonthly,
  PowerMonthly,
  FuelMonthly,
  BureauLite,
  ArchetypeId,
} from "./raw-types";
import type { DataSource } from "../types";

export const DEFAULT_SEED = 20260709;

const CLUSTERS: { label: string; state: string }[] = [
  { label: "Pune, MH", state: "27" },
  { label: "Surat, GJ", state: "24" },
  { label: "Indore, MP", state: "23" },
  { label: "Nagpur, MH", state: "27" },
  { label: "Coimbatore, TN", state: "33" },
  { label: "Ludhiana, PB", state: "03" },
  { label: "Hyderabad, TS", state: "36" },
  { label: "Ahmedabad, GJ", state: "24" },
  { label: "Jaipur, RJ", state: "08" },
  { label: "Ichalkaranji, MH", state: "27" },
];

function months(n = 12): string[] {
  const end = new Date(2026, 4, 1); // May 2026
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

function seasonalFactor(monthIndex: number, on: boolean): number {
  if (!on) return 1;
  // peak around harvest/festive months; amplitude 0.45
  return 1 + 0.45 * Math.sin((2 * Math.PI * (monthIndex + 2)) / 12);
}

function day(period: string, rng: Rng): string {
  return `${period}-${String(rng.int(2, 27)).padStart(2, "0")}`;
}

function genGst(
  rng: Rng,
  arch: ArchetypeConfig,
  periods: string[],
  r: number,
  anomalyTags: string[],
): GstMonthly[] {
  return periods.map((period, i) => {
    const dip = anomalyTags.includes("SEASONAL_DIP") && i >= 7 && i <= 9 ? 0.4 : 1;
    const base = arch.gstBase * Math.pow(1 + arch.gstGrowth, i) * seasonalFactor(i, arch.seasonal);
    const totalOutward = Math.max(0, Math.round(rng.lognormal(base, arch.gstVol) * dip));
    const zeroReturn = rng.bool(arch.zeroReturnRate);
    const delayed = rng.bool(Math.min(0.95, arch.gstDelayRate + r * 0.45));
    const outward = zeroReturn ? 0 : totalOutward;
    // Inward / purchases (ITC base). Derived DETERMINISTICALLY from sales so it
    // consumes no RNG draws — keeping the dataset (and fitted model.json) stable.
    // Month-of-year adds a mild wobble; fraud archetypes buy little vs claimed sales.
    const wob = 0.9 + ((period.charCodeAt(5) + period.charCodeAt(6)) % 20) / 100;
    const totalInward = Math.round(outward * arch.purchaseRatio * wob);
    return {
      period,
      totalOutward: outward,
      totalInward,
      totalTax: zeroReturn ? 0 : Math.round(totalOutward * 0.18),
      filingDate: day(period, rng),
      delayedFlag: delayed,
      zeroReturnFlag: zeroReturn,
      top3BuyerShare: Rng.clamp(arch.buyerConcentration + rng.normal(0, 0.05), 0.1, 0.95),
    };
  });
}

function genBank(
  rng: Rng,
  arch: ArchetypeConfig,
  periods: string[],
  gst: GstMonthly[] | null,
  r: number,
  anomalyTags: string[],
): { account: BankAccount; bounces: number } {
  const ratio = anomalyTags.includes("GST_BANK_MISMATCH")
    ? rng.float(0.22, 0.4)
    : Rng.clamp(arch.bankRatio + rng.normal(0, 0.04), 0.6, 1.1);
  // when there is no GST, anchor monthly turnover on UPI-scale activity
  const monthlyBaseNoGst = arch.upiBase * 1.6;
  let balance = Math.round(arch.gstBase * rng.float(0.1, 0.35)) + 50_000;
  const opening = balance;
  const emi = Math.round(arch.gstBase * arch.bureauEmiRatio * rng.float(0.8, 1.2));
  const txns: BankTxn[] = [];
  let bounces = 0;

  periods.forEach((period, i) => {
    const gstOutward = gst
      ? gst[i].totalOutward
      : Math.round(rng.lognormal(monthlyBaseNoGst, 0.18));
    const monthCredit = Math.max(0, Math.round(gstOutward * ratio * (1 + rng.normal(0, 0.06))));

    // 2–4 SALE credits summing to ~monthCredit
    const nCr = rng.int(2, 4);
    let remaining = monthCredit;
    for (let k = 0; k < nCr; k++) {
      const amt = k === nCr - 1 ? remaining : Math.round(monthCredit * rng.float(0.2, 0.45));
      remaining -= amt;
      if (amt <= 0) continue;
      balance += amt;
      txns.push({
        txnDate: day(period, rng),
        amount: amt,
        direction: "CR",
        balancePost: balance,
        channel: rng.pick(["UPI", "NEFT", "IMPS", "RTGS"]),
        narration: "Customer receipt",
        narrationTag: "SALE",
        isReturn: false,
      });
    }

    // circular / round-amount anomaly: matched in/out that nets to zero
    if (anomalyTags.includes("CIRCULAR_FLOW") && rng.bool(0.6)) {
      const round = 999999;
      balance += round;
      txns.push({
        txnDate: day(period, rng),
        amount: round,
        direction: "CR",
        balancePost: balance,
        channel: "RTGS",
        narration: "Inter-party transfer",
        narrationTag: "MISC",
        isReturn: false,
      });
      balance -= round;
      txns.push({
        txnDate: day(period, rng),
        amount: round,
        direction: "DR",
        balancePost: balance,
        channel: "RTGS",
        narration: "Inter-party transfer",
        narrationTag: "MISC",
        isReturn: false,
      });
    }

    // supplier outflow
    const supplier = Math.max(
      0,
      Math.round(monthCredit * arch.outflowRatio * (1 + rng.normal(0, 0.05))),
    );
    balance -= supplier;
    txns.push({
      txnDate: day(period, rng),
      amount: supplier,
      direction: "DR",
      balancePost: balance,
      channel: rng.pick(["NEFT", "RTGS", "IMPS"]),
      narration: "Supplier payment",
      narrationTag: "SUPPLIER",
      isReturn: false,
    });

    // EMI servicing — bounce probability rises with latent risk
    const bounceP = Math.min(
      0.9,
      r * (0.45 + arch.bounceBase * 0.16) + (anomalyTags.includes("BOUNCE_EXCESSIVE") ? 0.2 : 0),
    );
    if (rng.bool(bounceP)) {
      bounces++;
      txns.push({
        txnDate: day(period, rng),
        amount: emi,
        direction: "DR",
        balancePost: balance, // returned instrument — balance unchanged
        channel: "NEFT",
        narration: "EMI return (insufficient funds)",
        narrationTag: "EMI",
        isReturn: true,
      });
    } else {
      balance -= emi;
      txns.push({
        txnDate: day(period, rng),
        amount: emi,
        direction: "DR",
        balancePost: balance,
        channel: "NEFT",
        narration: "EMI debit",
        narrationTag: "EMI",
        isReturn: false,
      });
    }

    // tax outflow
    const tax = gst ? Math.round(gst[i].totalTax * rng.float(0.7, 1)) : 0;
    if (tax > 0) {
      balance -= tax;
      txns.push({
        txnDate: day(period, rng),
        amount: tax,
        direction: "DR",
        balancePost: balance,
        channel: "NEFT",
        narration: "GST challan",
        narrationTag: "TAX",
        isReturn: false,
      });
    }
  });

  return {
    account: {
      accountId: `AC${rng.int(10_000_000, 99_999_999)}`,
      ifsc: `IDIB000${rng.int(1000, 9999)}`,
      openingBalance: opening,
      transactions: txns,
    },
    bounces,
  };
}

function genUpi(
  rng: Rng,
  arch: ArchetypeConfig,
  periods: string[],
  r: number,
  anomalyTags: string[],
): UpiMonthly[] {
  const refundBase =
    arch.upiRefundRate + r * 0.05 + (anomalyTags.includes("BOUNCE_EXCESSIVE") ? 0.02 : 0);
  const growth = arch.upiGrowth - r * 0.05; // digital-payments momentum fades with latent risk
  return periods.map((period, i) => {
    const inValue = Math.round(rng.lognormal(arch.upiBase * Math.pow(1 + growth, i), 0.12));
    const inCount = Math.round((inValue / 1500) * rng.float(0.85, 1.15));
    return {
      period,
      inCount,
      inValue,
      outCount: Math.round(inCount * 0.15),
      outValue: Math.round(inValue * 0.12),
      refundsValue: Math.round(inValue * Rng.clamp(refundBase + rng.normal(0, 0.004), 0, 0.2)),
      topCounterpartyShare: Rng.clamp(0.08 + rng.normal(0, 0.03), 0.02, 0.6),
    };
  });
}

function genEpfo(rng: Rng, arch: ArchetypeConfig, periods: string[]): EpfoMonthly[] {
  let employees = Math.max(1, Math.round(arch.epfoEmployees * rng.float(0.8, 1.2)));
  return periods.map((month) => {
    if (rng.bool(0.1)) employees = Math.max(1, employees + rng.int(-1, 1));
    return {
      month,
      employeeCount: employees,
      wageBase: employees * Math.round(rng.float(15_000, 28_000)),
      contributionPaid: !rng.bool(arch.epfoMissedRate),
    };
  });
}

function genBureau(rng: Rng, arch: ArchetypeConfig, r: number): BureauLite {
  // DPD worsens and existing-EMI load grows with the latent risk.
  const x = r + rng.normal(0, 0.12);
  const dpd: BureauLite["maxDpdBucket"] = x > 0.7 ? "90+" : x > 0.5 ? "60" : x > 0.32 ? "30" : "0";
  const emiRatio = arch.bureauEmiRatio * (0.6 + r * 1.4);
  return {
    totalExistingEmi: Math.round(arch.gstBase * emiRatio * rng.float(0.8, 1.2)),
    numActiveLoans: rng.int(0, 3),
    maxDpdBucket: dpd,
  };
}

// kWh consumed per ₹1 lakh of turnover (sector operational intensity). Power-
// intensive sectors (milling, manufacturing) are higher; services are lower.
const KWH_PER_LAKH: Record<ArchetypeId, number> = {
  STABLE_TRADER: 48,
  THIN_FILE_MICRO: 30,
  SEASONAL_AGRO: 55,
  UPI_MERCHANT: 46,
  CASHFLOW_STRESS: 50,
  FRAUD_SUSPECT: 38,
  WOMEN_SERVICE: 26,
  NTC_NO_GST: 30,
};
const POWER_PRESENT_P: Record<ArchetypeId, number> = {
  STABLE_TRADER: 0.9,
  THIN_FILE_MICRO: 0.85,
  SEASONAL_AGRO: 0.95,
  UPI_MERCHANT: 0.9,
  CASHFLOW_STRESS: 0.9,
  FRAUD_SUSPECT: 0.7,
  WOMEN_SERVICE: 0.85,
  NTC_NO_GST: 0.9,
};

function genPower(
  rng: Rng,
  arch: ArchetypeConfig,
  periods: string[],
  gst: GstMonthly[] | null,
  r: number,
  anomalyTags: string[],
): PowerMonthly[] {
  const intensity = KWH_PER_LAKH[arch.id];
  const noGstBase = arch.upiBase * 1.6;
  const fraud = anomalyTags.includes("GST_BANK_MISMATCH");
  const n = periods.length;
  const units = periods.map((_, i) => {
    const turnover = gst ? gst[i].totalOutward : rng.lognormal(noGstBase, 0.15);
    const real = fraud ? turnover * 0.3 : turnover; // fraud: real activity far below claimed turnover
    // Distressed firms (high latent r) show a contracting power-consumption trend
    // — operations winding down ahead of default. This makes power a genuinely
    // predictive alternate signal rather than a mirror of declared turnover.
    const decline = 1 - r * 0.35 * (n > 1 ? i / (n - 1) : 0);
    const u =
      (real / 100_000) *
      intensity *
      decline *
      (1 + rng.normal(0, 0.05)) *
      seasonalFactor(i, arch.seasonal);
    return Math.max(0, Math.round(u));
  });
  const peak = Math.max(...units, 1);
  const sanctioned = Math.max(5, Math.round(peak / 450));
  return periods.map((period, i) => ({
    month: period,
    unitsKwh: units[i],
    sanctionedLoadKw: sanctioned,
    billAmount: Math.round(units[i] * rng.float(8.5, 10.5)),
  }));
}

// Fuel spend as a share of turnover (₹ fuel per ₹1 lakh of turnover). Logistics-
// and transport-heavy trading/agro sectors burn more; services almost none.
const FUEL_INTENSITY: Record<ArchetypeId, number> = {
  STABLE_TRADER: 1800,
  THIN_FILE_MICRO: 900,
  SEASONAL_AGRO: 2200,
  UPI_MERCHANT: 600,
  CASHFLOW_STRESS: 2000,
  FRAUD_SUSPECT: 800,
  WOMEN_SERVICE: 500,
  NTC_NO_GST: 1200,
};
const FUEL_PRESENT_P: Record<ArchetypeId, number> = {
  STABLE_TRADER: 0.7,
  THIN_FILE_MICRO: 0.4,
  SEASONAL_AGRO: 0.8,
  UPI_MERCHANT: 0.4,
  CASHFLOW_STRESS: 0.7,
  FRAUD_SUSPECT: 0.5,
  WOMEN_SERVICE: 0.3,
  NTC_NO_GST: 0.5,
};

function genFuel(
  rng: Rng,
  arch: ArchetypeConfig,
  periods: string[],
  gst: GstMonthly[] | null,
  r: number,
  anomalyTags: string[],
): FuelMonthly[] {
  const intensity = FUEL_INTENSITY[arch.id];
  const noGstBase = arch.upiBase * 1.6;
  const pricePerLitre = 95;
  const n = periods.length;
  // Mirror genPower: GST_BANK_MISMATCH fraud profiles have real activity far
  // below declared turnover, so fuel spend must also track the suppressed base
  // — otherwise the fraud tab shows power mismatch + fuel "Pass" on the same case.
  const fraud = anomalyTags.includes("GST_BANK_MISMATCH");
  return periods.map((month, i) => {
    const turnover = gst ? gst[i].totalOutward : rng.lognormal(noGstBase, 0.15);
    const real = fraud ? turnover * 0.3 : turnover;
    // Like power, real operating spend contracts as latent stress rises.
    const decline = 1 - r * 0.3 * (n > 1 ? i / (n - 1) : 0);
    const spend = Math.max(
      0,
      Math.round(
        (real / 100_000) *
          intensity *
          decline *
          (1 + rng.normal(0, 0.06)) *
          seasonalFactor(i, arch.seasonal),
      ),
    );
    return { month, spend, litres: Math.round(spend / pricePerLitre) };
  });
}

/** Generate one fully-formed synthetic MSME. */
export function generateMsme(index: number, masterSeed = DEFAULT_SEED): RawMsme {
  const rng = new Rng(masterSeed + index * 1009 + 7);
  const arch = pickArchetype(rng);
  const periods = months();

  // hidden latent risk + stochastic label (leakage-free)
  const r = Rng.clamp(arch.basePropensity + rng.normal(0, arch.propensityNoise), 0.02, 0.98);
  const syntheticDefault = rng.bernoulli(r);

  const isAnomaly = arch.anomalyP >= 1 ? true : rng.bool(arch.anomalyP);
  const anomalyTags: string[] = isAnomaly ? [...arch.anomalyKinds] : [];

  const cluster = rng.pick(CLUSTERS);
  const gstPresent = rng.bool(arch.gstPresentP);
  const gstin = gstPresent ? makeGstin(cluster.state, rng) : null;

  const gst = gstPresent ? genGst(rng, arch, periods, r, anomalyTags) : null;
  const { account } = genBank(rng, arch, periods, gst, r, anomalyTags);
  const upi = rng.bool(arch.upiPresentP) ? genUpi(rng, arch, periods, r, anomalyTags) : null;
  const epfo = rng.bool(arch.epfoPresentP) ? genEpfo(rng, arch, periods) : null;
  const bureau = rng.bool(arch.bureauPresentP) ? genBureau(rng, arch, r) : null;
  const power = rng.bool(POWER_PRESENT_P[arch.id])
    ? genPower(rng, arch, periods, gst, r, anomalyTags)
    : null;

  const womenOwned = rng.bool(arch.womenOwnedP);
  const vintageMonths = arch.ntc ? rng.int(8, 26) : rng.int(28, 120);
  const gemSeller = rng.bool(arch.gemSellerP) && gstPresent;

  const profile: RawProfile = {
    msmeId: `MSME-${10_000 + index}`,
    legalName: companyName(rng, arch.sectors[0], womenOwned),
    constitution: rng.pick(arch.constitution),
    sector: rng.pick(arch.sectors),
    clusterCity: cluster.label,
    gstin,
    udyamId:
      gstPresent || rng.bool(0.6)
        ? `UDYAM-${cluster.state}-${rng.int(10, 35)}-${rng.int(1_000_000, 9_999_999)}`
        : null,
    vintageMonths,
    womenOwned,
    ntcNtb: arch.ntc,
    existingIdbiCustomer: rng.bool(arch.existingIdbiP),
    requestedAmount: Math.round(rng.int(arch.requestedMin, arch.requestedMax) / 50_000) * 50_000,
    seasonalSector: arch.seasonal,
    archetype: arch.id,
    gemSeller,
    gemRating: gemSeller ? rng.int(3, 5) : 0,
    activePoCount: gemSeller ? rng.int(1, 3) : 0,
    activePoValue: gemSeller ? rng.int(40_000, 2_000_000) : 0,
    poTenorDays: gemSeller ? rng.int(21, 105) : 0,
    existingFacilityType: rng.bool(arch.existingIdbiP)
      ? rng.pick(["Cash Credit", "OD", "Term Loan"])
      : null,
    currentLimit: 0,
    limitUtilizationPct: 0,
    renewalDueFlag: false,
  };
  if (profile.existingFacilityType) {
    profile.currentLimit = Math.round(profile.requestedAmount * rng.float(0.6, 1.1));
    profile.limitUtilizationPct = Math.round(rng.float(0.3, 0.95) * 100);
    profile.renewalDueFlag = rng.bool(0.4);
  }

  // Fuel is generated LAST so it consumes no RNG draws ahead of any scored
  // feature — keeping the dataset (and the fitted model.json) byte-identical.
  const fuel = rng.bool(FUEL_PRESENT_P[arch.id])
    ? genFuel(rng, arch, periods, gst, r, anomalyTags)
    : null;

  const dataCompleteness: { source: DataSource; available: boolean; monthsCovered?: number }[] = [
    { source: "GST", available: !!gst, monthsCovered: gst ? gst.length : undefined },
    { source: "AA_BANK", available: true, monthsCovered: periods.length },
    { source: "UPI", available: !!upi, monthsCovered: upi ? upi.length : undefined },
    { source: "EPFO", available: !!epfo, monthsCovered: epfo ? epfo.length : undefined },
    { source: "POWER", available: !!power, monthsCovered: power ? power.length : undefined },
    { source: "FUEL", available: !!fuel, monthsCovered: fuel ? fuel.length : undefined },
    { source: "BUREAU", available: !!bureau },
  ];

  return {
    profile,
    gst,
    bank: account,
    upi,
    epfo,
    power,
    fuel,
    bureau,
    dataCompleteness,
    latentDefaultPropensity: r,
    syntheticDefault,
    anomalyTags,
  };
}

/** Generate a deterministic dataset of `count` MSMEs. */
export function generateDataset(count = 600, masterSeed = DEFAULT_SEED): RawMsme[] {
  return Array.from({ length: count }, (_, i) => generateMsme(i, masterSeed));
}

const FIRST = [
  "Saraswati",
  "Hansraj",
  "Kavita",
  "Annapurna",
  "Veer",
  "Sunrise",
  "Ganesh",
  "Meera",
  "Royal",
  "Sapphire",
  "Lakshmi",
  "Apex",
];
const TAIL = [
  "Traders",
  "Enterprises",
  "Industries",
  "Agencies",
  "Components",
  "Textiles",
  "Foods",
  "Services",
  "Exports",
  "Solutions",
];

function companyName(rng: Rng, sectorHint: string, women: boolean): string {
  const head = rng.pick(FIRST);
  const tail = rng.pick(TAIL);
  const suffix = rng.pick(["Pvt Ltd", "& Co.", "LLP", ""]);
  void sectorHint;
  void women;
  return `${head} ${tail}${suffix ? " " + suffix : ""}`.trim();
}
