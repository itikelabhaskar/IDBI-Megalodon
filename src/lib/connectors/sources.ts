// GSTN-as-FIP, UPI aggregator, EPFO, DISCOM power-feed and bureau-lite connector
// stubs. Each translates the synthetic raw entity into the external API shape a
// real data provider would return (plan.md §11, perplexity2 §5.2/§5.4/§5.5).
// Returns null when the MSME did not consent to / does not have that source.

import type { RawMsme } from "../data/raw-types";

export interface GstnReturn {
  period: string;
  return_type: "GSTR3B";
  total_outward: number;
  total_inward: number;
  total_tax: number;
  filing_date: string;
  delayed: boolean;
  zero_return: boolean;
  top3_buyer_share: number;
}
export interface GstnPayload {
  gstin: string;
  legal_name: string;
  returns: GstnReturn[];
}

export function fetchGstn(raw: RawMsme): GstnPayload | null {
  if (!raw.gst || !raw.profile.gstin) return null;
  return {
    gstin: raw.profile.gstin,
    legal_name: raw.profile.legalName,
    returns: raw.gst.map((g) => ({
      period: g.period,
      return_type: "GSTR3B",
      total_outward: g.totalOutward,
      total_inward: g.totalInward,
      total_tax: g.totalTax,
      filing_date: g.filingDate,
      delayed: g.delayedFlag,
      zero_return: g.zeroReturnFlag,
      top3_buyer_share: g.top3BuyerShare,
    })),
  };
}

export interface UpiAggregate {
  period: string;
  in_count: number;
  in_value: number;
  out_count: number;
  out_value: number;
  refunds_value: number;
  top_counterparty_share: number;
}
export interface UpiPayload {
  msme_id: string;
  monthly: UpiAggregate[];
}

export function fetchUpi(raw: RawMsme): UpiPayload | null {
  if (!raw.upi) return null;
  return {
    msme_id: raw.profile.msmeId,
    monthly: raw.upi.map((u) => ({
      period: u.period,
      in_count: u.inCount,
      in_value: u.inValue,
      out_count: u.outCount,
      out_value: u.outValue,
      refunds_value: u.refundsValue,
      top_counterparty_share: u.topCounterpartyShare,
    })),
  };
}

export interface EpfoMonth {
  month: string;
  employee_count: number;
  wage_base: number;
  contribution_paid: boolean;
}
export interface EpfoPayload {
  msme_id: string;
  establishment_id: string;
  monthly: EpfoMonth[];
}

export function fetchEpfo(raw: RawMsme): EpfoPayload | null {
  if (!raw.epfo) return null;
  return {
    msme_id: raw.profile.msmeId,
    establishment_id: `EST-${raw.profile.msmeId}`,
    monthly: raw.epfo.map((e) => ({
      month: e.month,
      employee_count: e.employeeCount,
      wage_base: e.wageBase,
      contribution_paid: e.contributionPaid,
    })),
  };
}

export interface BureauPayload {
  msme_id: string;
  total_existing_emi: number;
  num_active_loans: number;
  max_dpd_bucket: string;
}

export function fetchBureau(raw: RawMsme): BureauPayload | null {
  if (!raw.bureau) return null;
  return {
    msme_id: raw.profile.msmeId,
    total_existing_emi: raw.bureau.totalExistingEmi,
    num_active_loans: raw.bureau.numActiveLoans,
    max_dpd_bucket: raw.bureau.maxDpdBucket,
  };
}

export interface PowerMonth {
  month: string;
  units_kwh: number;
  sanctioned_load_kw: number;
  bill_amount: number;
}
export interface PowerPayload {
  msme_id: string;
  service_connection_id: string;
  discom: string;
  monthly: PowerMonth[];
}

/** DISCOM electricity-consumption feed — IDBI's flagship alternate signal. */
export function fetchPower(raw: RawMsme): PowerPayload | null {
  if (!raw.power) return null;
  return {
    msme_id: raw.profile.msmeId,
    service_connection_id: `SC-${raw.profile.msmeId}`,
    discom: "STATE_DISCOM",
    monthly: raw.power.map((p) => ({
      month: p.month,
      units_kwh: p.unitsKwh,
      sanctioned_load_kw: p.sanctionedLoadKw,
      bill_amount: p.billAmount,
    })),
  };
}

export interface FuelMonth {
  month: string;
  spend: number;
  litres: number;
}
export interface FuelPayload {
  msme_id: string;
  /** Connector honesty — prototype feed is synthetic-labelled. */
  mode: "Synthetic";
  labelled: true;
  monthly: FuelMonth[];
}

/** Fuel / ops-spend feed — trader & logistics activity proxy (AMA). */
export function fetchFuel(raw: RawMsme): FuelPayload | null {
  if (!raw.fuel) return null;
  return {
    msme_id: raw.profile.msmeId,
    mode: "Synthetic",
    labelled: true,
    monthly: raw.fuel.map((f) => ({
      month: f.month,
      spend: f.spend,
      litres: f.litres,
    })),
  };
}

export interface FastagMonth {
  month: string;
  toll_count: number;
  toll_amount: number;
}
export interface FastagPayload {
  msme_id: string;
  /** Sandbox mock derived from fuel activity — not a live FASTag API. */
  mode: "Synthetic";
  labelled: true;
  schema_note: "FASTag toll events (synthetic from fuel litres)";
  monthly: FastagMonth[];
}

/**
 * FASTag sandbox mock — synthetic, labelled. Derives toll intensity from fuel
 * litres so logistics cases can triangulate mobility without inventing a live rail.
 */
export function fetchFastag(raw: RawMsme): FastagPayload | null {
  if (!raw.fuel) return null;
  return {
    msme_id: raw.profile.msmeId,
    mode: "Synthetic",
    labelled: true,
    schema_note: "FASTag toll events (synthetic from fuel litres)",
    monthly: raw.fuel.map((f) => ({
      month: f.month,
      toll_count: Math.max(1, Math.round(f.litres / 80)),
      toll_amount: Math.round(f.spend * 0.15),
    })),
  };
}

export interface EwayMonth {
  month: string;
  bill_count: number;
  taxable_value: number;
}
export interface EwayPayload {
  msme_id: string;
  /** Sandbox mock derived from GST outwards — not a live e-way bill API. */
  mode: "Synthetic";
  labelled: true;
  schema_note: "E-way bills (synthetic from GST outward supplies)";
  monthly: EwayMonth[];
}

/**
 * E-way bill sandbox mock — synthetic, labelled. Uses GST outward supplies as
 * the movement proxy for trader / logistics triangulation demos.
 */
export function fetchEway(raw: RawMsme): EwayPayload | null {
  if (!raw.gst) return null;
  return {
    msme_id: raw.profile.msmeId,
    mode: "Synthetic",
    labelled: true,
    schema_note: "E-way bills (synthetic from GST outward supplies)",
    monthly: raw.gst.map((g) => ({
      month: g.period,
      bill_count: Math.max(1, Math.round(g.totalOutward / 500_000)),
      taxable_value: Math.round(g.totalOutward * 0.85),
    })),
  };
}
