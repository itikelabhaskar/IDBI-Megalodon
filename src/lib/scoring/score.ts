// Pipeline composition (plan.md §7, exact order):
// features → sub-scores → HealthScore → credit-style → ML viability → band →
// BRE decision → recommended limit → product routing (with eligibility gap) →
// reason codes / fraud flags / path-to-credit → chart series + audit.

import type { RawMsme } from "../data/raw-types";
import type {
  MsmeCase,
  TrendPoint,
  CashflowPoint,
  UpiPoint,
  BuyerShare,
  AuditEvent,
  RiskBand,
  ClusterRisk,
  ClusterRiskBand,
} from "../types";
import { computeFeatures } from "./features";
import { computeSubScores, computeHealthScore, creditStyleScore, riskBand } from "./scorecard";
import { scoreMl } from "./ml";
import { reasonCodes, fraudFlags } from "./reasons";
import { assessConfidence } from "./confidence";
import { computeFraudAnalytics } from "./fraud-analytics";
import { chainAudit } from "../audit-hash";
import {
  hardFlags,
  breDecision,
  recommendedLimit,
  detectBusinessNeed,
  routeProduct,
  pathToCredit,
} from "./decision";

function buildGstTrend(raw: RawMsme): TrendPoint[] {
  return raw.gst ? raw.gst.map((g) => ({ period: g.period, value: g.totalOutward })) : [];
}

function buildCashflow(raw: RawMsme): CashflowPoint[] {
  const order: string[] = [];
  const byMonth = new Map<string, { inflow: number; outflow: number; closing: number }>();
  for (const t of raw.bank.transactions) {
    const p = t.txnDate.slice(0, 7);
    if (!byMonth.has(p)) {
      byMonth.set(p, { inflow: 0, outflow: 0, closing: 0 });
      order.push(p);
    }
    const m = byMonth.get(p)!;
    if (t.direction === "CR" && !t.isReturn && t.narrationTag === "SALE") m.inflow += t.amount;
    if (t.direction === "DR" && !t.isReturn) m.outflow += t.amount;
    m.closing = t.balancePost;
  }
  return order.map((p) => {
    const m = byMonth.get(p)!;
    return { period: p, inflow: m.inflow, outflow: m.outflow, closingBalance: m.closing };
  });
}

function buildUpi(raw: RawMsme): UpiPoint[] {
  return raw.upi
    ? raw.upi.map((u) => ({
        period: u.period,
        inValue: u.inValue,
        inCount: u.inCount,
        refundRatio: u.inValue > 0 ? Math.round((u.refundsValue / u.inValue) * 1000) / 1000 : 0,
      }))
    : [];
}

function buildPower(raw: RawMsme): TrendPoint[] {
  return raw.power ? raw.power.map((p) => ({ period: p.month, value: p.unitsKwh })) : [];
}

function buildFuel(raw: RawMsme): TrendPoint[] {
  return raw.fuel ? raw.fuel.map((p) => ({ period: p.month, value: p.spend })) : [];
}

function clusterBand(avg: number): ClusterRiskBand {
  if (avg >= 70) return "Low";
  if (avg >= 58) return "Moderate";
  if (avg >= 48) return "Elevated";
  return "High";
}

function makeClusterRisk(cluster: string, scores: number[]): ClusterRisk {
  const avg = scores.length ? scores.reduce((s, x) => s + x, 0) / scores.length : 0;
  return {
    cluster,
    index: Math.max(0, Math.min(100, Math.round(100 - avg))),
    band: clusterBand(avg),
    peerCount: scores.length,
    avgHealthScore: Math.round(avg),
  };
}

function buildBuyers(raw: RawMsme, concentration: number): BuyerShare[] {
  if (!raw.gst) return [];
  const top = Math.min(0.95, concentration);
  const others = Math.max(0, 1 - top);
  const round = (x: number) => Math.round(x * 100) / 100;
  return [
    { name: "Anchor buyer", share: round(top * 0.5) },
    { name: "Buyer 2", share: round(top * 0.3) },
    { name: "Buyer 3", share: round(top * 0.2) },
    { name: "Other buyers", share: round(others) },
  ];
}

function scoredSeconds(raw: RawMsme): number {
  const avail = raw.dataCompleteness.filter((d) => d.available).length;
  return Math.round((5 + avail * 2.6) * 10) / 10;
}

function buildAudit(raw: RawMsme, healthScore: number, band: RiskBand, secs: number): AuditEvent[] {
  const available = raw.dataCompleteness.filter((d) => d.available);
  const fis = available.map((d) => d.source).join(", ");
  return chainAudit([
    {
      ts: "2026-06-28T09:14:00Z",
      actor: "system",
      action: "AA consent received",
      detail: `FI types: ${fis}`,
    },
    {
      ts: "2026-06-28T09:14:22Z",
      actor: "system",
      action: "Data fetched",
      detail: `${available.length} sources in ${secs}s`,
    },
    {
      ts: "2026-06-28T09:14:23Z",
      actor: "engine",
      action: "HealthScore computed",
      detail: `${healthScore} (Band ${band})`,
    },
  ]);
}

/** Score a single MSME into the frozen MsmeCase contract. */
export function scoreCase(raw: RawMsme): MsmeCase {
  const f = computeFeatures(raw);
  const subScores = computeSubScores(f, raw);
  const healthScore = computeHealthScore(subScores);
  const band = riskBand(healthScore);
  const ml = scoreMl(f);
  const flags = hardFlags(f);

  const decision0 = breDecision(band, f, flags);
  const limit = recommendedLimit(band, f, flags);
  const need = detectBusinessNeed(raw, f, decision0);
  const routing = routeProduct(raw, f, decision0, need, flags, limit);
  const decision = routing.decision;

  const reasons = reasonCodes(f);
  if (routing.eligibilityGap)
    reasons.push({
      code: "PRODUCT_ELIGIBILITY_GAP",
      polarity: "negative",
      label: "Best-fit product eligibility not met; routed to manual review",
    });
  const path = pathToCredit(reasons, decision);
  const secs = scoredSeconds(raw);

  return {
    id: raw.profile.msmeId,
    legalName: raw.profile.legalName,
    constitution: raw.profile.constitution,
    sector: raw.profile.sector,
    clusterCity: raw.profile.clusterCity,
    gstin: raw.profile.gstin,
    udyamId: raw.profile.udyamId,
    vintageMonths: raw.profile.vintageMonths,
    womenOwned: raw.profile.womenOwned,
    ntcNtb: raw.profile.ntcNtb,
    existingIdbiCustomer: raw.profile.existingIdbiCustomer,
    requestedAmount: raw.profile.requestedAmount,

    healthScore,
    creditStyleScore: creditStyleScore(healthScore),
    riskBand: band,
    subScores,
    mlProbabilityProxy: Math.round(ml.viability * 1000) / 1000,
    contributions: ml.contributions,
    confidence: assessConfidence(raw, f),

    decision,
    recommendedLimit: decision === "Reject" ? 0 : limit,
    tenorMonths:
      routing.route === "GeM Sahay" ? Math.max(1, Math.round(raw.profile.poTenorDays / 30)) : 12,
    detectedBusinessNeed: need,
    productRoute: routing.route,
    productRouteReason: routing.reason,

    reasonCodes: reasons,
    fraudFlags: fraudFlags(f),
    pathToCredit: path,

    dataCompleteness: raw.dataCompleteness,
    peerClusterPercentile: 50, // overwritten by scoreDataset
    clusterRisk: makeClusterRisk(raw.profile.clusterCity, [healthScore]), // overwritten by scoreDataset
    fraudAnalytics: computeFraudAnalytics(raw),

    gstTrend: buildGstTrend(raw),
    cashflow: buildCashflow(raw),
    upiTrend: buildUpi(raw),
    powerConsumption: buildPower(raw),
    fuelConsumption: buildFuel(raw),
    buyerConcentration: buildBuyers(raw, f.gstConcentration),

    audit: buildAudit(raw, healthScore, band, secs),
    scoredInSeconds: secs,
  };
}

/** Score a whole population and fill peer/cluster percentiles within each sector. */
export function scoreDataset(raws: RawMsme[]): MsmeCase[] {
  const cases = raws.map(scoreCase);
  const bySector = new Map<string, MsmeCase[]>();
  for (const c of cases) {
    const arr = bySector.get(c.sector);
    if (arr) arr.push(c);
    else bySector.set(c.sector, [c]);
  }
  for (const group of bySector.values()) {
    for (const c of group) {
      const atOrBelow = group.filter((x) => x.healthScore <= c.healthScore).length;
      c.peerClusterPercentile = Math.round((atOrBelow / group.length) * 100);
    }
  }

  // Geospatial cluster risk — aggregate the HealthScore distribution per cluster
  // city (no outcome labels), so every case carries its cluster's benchmark.
  const byCluster = new Map<string, MsmeCase[]>();
  for (const c of cases) {
    const arr = byCluster.get(c.clusterCity);
    if (arr) arr.push(c);
    else byCluster.set(c.clusterCity, [c]);
  }
  for (const [city, group] of byCluster) {
    const risk = makeClusterRisk(
      city,
      group.map((c) => c.healthScore),
    );
    for (const c of group) c.clusterRisk = risk;
  }
  return cases;
}
