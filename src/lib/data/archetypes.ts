// Archetype catalogue — the eight behavioural profiles from the research
// (perplexity2.md §3.2). Each archetype shapes the distributions the generator
// samples from. The archetype is the shared latent that makes red-flag features
// correlate with the default label WITHOUT either being a function of the other.

import type { Rng } from "./rng";
import type { ArchetypeId, Constitution } from "./raw-types";

export interface ArchetypeConfig {
  id: ArchetypeId;
  label: string;
  weight: number; // population sampling weight
  sectors: string[];
  constitution: Constitution[];
  womenOwnedP: number;
  ntc: boolean;
  existingIdbiP: number;
  seasonal: boolean;

  basePropensity: number; // base latent default propensity (0–1)
  propensityNoise: number; // sd of latent noise

  gstPresentP: number;
  gstBase: number; // median monthly outward (₹)
  gstGrowth: number; // monthly growth rate
  gstVol: number; // log-normal sigma
  gstDelayRate: number; // base prob of a delayed filing
  zeroReturnRate: number;
  buyerConcentration: number; // base top-3 buyer share
  purchaseRatio: number; // inward/purchases as a fraction of declared sales

  bankRatio: number; // bank SALE credit / GST outward (low ⇒ mismatch)
  outflowRatio: number; // monthly debit / credit
  bounceBase: number; // expected EMI bounces over 12m at r=1

  upiPresentP: number;
  upiBase: number; // monthly UPI in-value (₹)
  upiRefundRate: number;
  upiGrowth: number;

  epfoPresentP: number;
  epfoEmployees: number;
  epfoMissedRate: number;

  bureauPresentP: number;
  bureauEmiRatio: number; // existing EMI / monthly credit
  bureauDpd: ("0" | "30" | "60" | "90+")[];

  gemSellerP: number;
  requestedMin: number;
  requestedMax: number;

  anomalyP: number; // prob this MSME carries labelled anomalies
  anomalyKinds: string[]; // anomaly tags this archetype can express
}

const BASE: Omit<ArchetypeConfig, "id" | "label" | "weight"> = {
  sectors: ["General Trading"],
  constitution: ["Proprietorship", "Partnership", "Private Limited"],
  womenOwnedP: 0.18,
  ntc: false,
  existingIdbiP: 0.5,
  seasonal: false,
  basePropensity: 0.15,
  propensityNoise: 0.07,
  gstPresentP: 1,
  gstBase: 1_200_000,
  gstGrowth: 0.008,
  gstVol: 0.12,
  gstDelayRate: 0.08,
  zeroReturnRate: 0.03,
  buyerConcentration: 0.35,
  purchaseRatio: 0.7,
  bankRatio: 0.95,
  outflowRatio: 0.86,
  bounceBase: 1,
  upiPresentP: 0.8,
  upiBase: 180_000,
  upiRefundRate: 0.012,
  upiGrowth: 0.01,
  epfoPresentP: 0.7,
  epfoEmployees: 12,
  epfoMissedRate: 0.03,
  bureauPresentP: 0.8,
  bureauEmiRatio: 0.06,
  bureauDpd: ["0", "0", "0", "30"],
  gemSellerP: 0.1,
  requestedMin: 800_000,
  requestedMax: 2_500_000,
  anomalyP: 0.12,
  anomalyKinds: [],
};

function def(
  id: ArchetypeId,
  label: string,
  weight: number,
  overrides: Partial<ArchetypeConfig>,
): ArchetypeConfig {
  return { id, label, weight, ...BASE, ...overrides };
}

export const ARCHETYPES: ArchetypeConfig[] = [
  def("STABLE_TRADER", "Stable GST-registered trader", 18, {
    sectors: ["Electronics Wholesale", "Auto Components Manufacturing", "Pharma Distribution"],
    existingIdbiP: 0.8,
    basePropensity: 0.08,
    gstBase: 2_000_000,
    gstVol: 0.1,
    gstDelayRate: 0.04,
    buyerConcentration: 0.28,
    purchaseRatio: 0.78,
    bankRatio: 0.97,
    bounceBase: 0.5,
    epfoEmployees: 14,
    bureauDpd: ["0", "0", "0", "0"],
  }),
  def("THIN_FILE_MICRO", "Thin-file new GST micro retailer", 14, {
    sectors: ["FMCG Distribution", "Kirana Retail", "Mobile Accessories"],
    womenOwnedP: 0.35,
    existingIdbiP: 0.25,
    ntc: true,
    basePropensity: 0.28,
    gstBase: 450_000,
    gstVol: 0.22,
    gstDelayRate: 0.2,
    zeroReturnRate: 0.08,
    buyerConcentration: 0.6,
    bankRatio: 0.9,
    epfoPresentP: 0.1,
    bureauPresentP: 0.15,
    requestedMin: 300_000,
    requestedMax: 900_000,
    anomalyP: 0.15,
    anomalyKinds: ["DATA_THIN"],
  }),
  def("SEASONAL_AGRO", "Seasonal agro / textile processor", 13, {
    sectors: ["Rice Milling", "Cotton Textile Weaving", "Food Processing"],
    seasonal: true,
    basePropensity: 0.2,
    gstBase: 2_500_000,
    gstVol: 0.18,
    gstGrowth: 0.004,
    bankRatio: 0.92,
    bounceBase: 1.5,
    epfoEmployees: 30,
    epfoMissedRate: 0.16,
    bureauEmiRatio: 0.09,
    bureauDpd: ["0", "0", "30", "30"],
    gemSellerP: 0.05,
    anomalyP: 0.15,
    anomalyKinds: ["SEASONAL_DIP"],
  }),
  def("UPI_MERCHANT", "High-volume UPI merchant", 12, {
    sectors: ["Restaurant", "QSR Chain", "Salon & Wellness"],
    existingIdbiP: 0.45,
    basePropensity: 0.12,
    gstBase: 1_600_000,
    gstGrowth: 0.02,
    bankRatio: 0.96,
    purchaseRatio: 0.45,
    bounceBase: 0.6,
    upiPresentP: 1,
    upiBase: 600_000,
    upiRefundRate: 0.013,
    upiGrowth: 0.03,
    epfoEmployees: 22,
  }),
  def("CASHFLOW_STRESS", "Cash-flow stress with delayed GST", 11, {
    sectors: ["Textile Trading", "Construction Materials", "Apparel Wholesale"],
    basePropensity: 0.55,
    propensityNoise: 0.1,
    gstBase: 2_600_000,
    gstVol: 0.24,
    gstDelayRate: 0.42,
    zeroReturnRate: 0.16,
    buyerConcentration: 0.7,
    bankRatio: 0.85,
    bounceBase: 9,
    upiRefundRate: 0.05,
    epfoMissedRate: 0.25,
    bureauEmiRatio: 0.12,
    bureauDpd: ["30", "60", "60", "90+"],
    anomalyP: 0.33,
    anomalyKinds: ["BOUNCE_EXCESSIVE", "GST_DELAY_HIGH"],
  }),
  def("FRAUD_SUSPECT", "Fraud-suspect GST / bank mismatch", 7, {
    sectors: ["Trading (unclassified)", "Scrap & Recycling", "General Merchant"],
    existingIdbiP: 0.1,
    basePropensity: 0.7,
    propensityNoise: 0.08,
    gstBase: 3_000_000,
    gstVol: 0.3,
    buyerConcentration: 0.8,
    purchaseRatio: 0.2,
    bankRatio: 0.3, // headline mismatch: GST high, bank credits weak
    bounceBase: 4,
    upiPresentP: 0.4,
    epfoPresentP: 0.1,
    bureauPresentP: 0.3,
    anomalyP: 1,
    anomalyKinds: ["GST_BANK_MISMATCH", "CIRCULAR_FLOW"],
  }),
  def("WOMEN_SERVICE", "Women-owned service business", 13, {
    sectors: ["Digital Marketing Agency", "Boutique Services", "Consulting"],
    womenOwnedP: 1,
    existingIdbiP: 0.5,
    basePropensity: 0.12,
    gstBase: 900_000,
    gstVol: 0.1,
    gstDelayRate: 0.05,
    bankRatio: 0.98,
    purchaseRatio: 0.22,
    bounceBase: 0.4,
    upiBase: 90_000,
    epfoEmployees: 6,
    bureauDpd: ["0", "0", "0", "0"],
    requestedMin: 500_000,
    requestedMax: 1_500_000,
  }),
  def("NTC_NO_GST", "NTC / NTB no-GST micro enterprise", 12, {
    sectors: ["Home Food Business", "D2C Crafts", "Tuition Services"],
    womenOwnedP: 0.4,
    ntc: true,
    existingIdbiP: 0.15,
    basePropensity: 0.3,
    gstPresentP: 0, // no GST
    bankRatio: 0.94,
    upiPresentP: 1,
    upiBase: 220_000,
    upiGrowth: 0.025,
    epfoPresentP: 0,
    bureauPresentP: 0.2,
    requestedMin: 200_000,
    requestedMax: 700_000,
    anomalyP: 0.13,
    anomalyKinds: ["DATA_THIN"],
  }),
];

/** Weighted random archetype pick. */
export function pickArchetype(rng: Rng): ArchetypeConfig {
  const total = ARCHETYPES.reduce((s, a) => s + a.weight, 0);
  let x = rng.float(0, total);
  for (const a of ARCHETYPES) {
    x -= a.weight;
    if (x <= 0) return a;
  }
  return ARCHETYPES[ARCHETYPES.length - 1];
}
