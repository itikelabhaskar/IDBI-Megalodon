// Raw synthetic entities — the alternate-data "ground truth" the scoring engine
// (Phase 2) consumes. These mirror the shapes a real AA / GSTN / UPI / EPFO /
// bureau feed would deliver, kept internally consistent so the data does not
// look fake to a banker.

import type { DataSource } from "../types";

export type Constitution = "Proprietorship" | "Partnership" | "Private Limited" | "LLP";

export type ArchetypeId =
  | "STABLE_TRADER"
  | "THIN_FILE_MICRO"
  | "SEASONAL_AGRO"
  | "UPI_MERCHANT"
  | "CASHFLOW_STRESS"
  | "FRAUD_SUSPECT"
  | "WOMEN_SERVICE"
  | "NTC_NO_GST";

export interface RawProfile {
  msmeId: string;
  legalName: string;
  constitution: Constitution;
  sector: string;
  clusterCity: string;
  gstin: string | null;
  udyamId: string | null;
  vintageMonths: number;
  womenOwned: boolean;
  ntcNtb: boolean;
  existingIdbiCustomer: boolean;
  requestedAmount: number;
  seasonalSector: boolean;
  archetype: ArchetypeId;
  // GeM / renewal routing fields
  gemSeller: boolean;
  gemRating: number; // 0–5
  activePoCount: number;
  activePoValue: number;
  poTenorDays: number;
  existingFacilityType: string | null;
  currentLimit: number;
  limitUtilizationPct: number;
  renewalDueFlag: boolean;
}

export interface GstMonthly {
  period: string; // YYYY-MM
  totalOutward: number;
  totalTax: number;
  filingDate: string;
  delayedFlag: boolean;
  zeroReturnFlag: boolean;
  top3BuyerShare: number; // 0–1
}

export type BankChannel = "UPI" | "NEFT" | "IMPS" | "RTGS" | "CASH" | "POS";
export type NarrationTag = "SALE" | "SUPPLIER" | "SALARY" | "EMI" | "TAX" | "MISC";

export interface BankTxn {
  txnDate: string; // YYYY-MM-DD
  amount: number;
  direction: "CR" | "DR";
  balancePost: number; // running balance AFTER this txn (returns leave it unchanged)
  channel: BankChannel;
  narration: string;
  narrationTag: NarrationTag;
  isReturn: boolean; // a bounced/returned instrument — does NOT move the balance
}

export interface BankAccount {
  accountId: string;
  ifsc: string;
  openingBalance: number;
  transactions: BankTxn[];
}

export interface UpiMonthly {
  period: string;
  inCount: number;
  inValue: number;
  outCount: number;
  outValue: number;
  refundsValue: number;
  topCounterpartyShare: number; // 0–1
}

export interface EpfoMonthly {
  month: string;
  employeeCount: number;
  wageBase: number;
  contributionPaid: boolean;
}

// Electricity / power-consumption feed (IDBI named this as a flagship alternate
// signal for thin-file manufacturing MSMEs). Used to confirm real operational
// activity and to triangulate declared turnover against power usage.
export interface PowerMonthly {
  month: string;
  unitsKwh: number;
  sanctionedLoadKw: number;
  billAmount: number;
}

export interface BureauLite {
  totalExistingEmi: number;
  numActiveLoans: number;
  maxDpdBucket: "0" | "30" | "60" | "90+";
}

export interface RawMsme {
  profile: RawProfile;
  gst: GstMonthly[] | null;
  bank: BankAccount; // AA bank feed
  upi: UpiMonthly[] | null;
  epfo: EpfoMonthly[] | null;
  power: PowerMonthly[] | null;
  bureau: BureauLite | null;
  dataCompleteness: { source: DataSource; available: boolean; monthsCovered?: number }[];

  // Hidden training signals — NEVER exposed as model features (see leakage-free design).
  latentDefaultPropensity: number; // 0–1, drives BOTH features and the label
  syntheticDefault: 0 | 1; // stochastic draw from the latent — the ML training label
  anomalyTags: string[]; // labelled anomalies for instant demo switching
}
