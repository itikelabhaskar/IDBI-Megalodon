// API / integration endpoint stubs (plan.md §11). Each function is a pure,
// deterministic "endpoint" returning the exact contract shape; the JSDoc records
// the HTTP method + path it maps to for a future IDBI sandbox / ULI / OCEN swap.
// The UI consumes these directly today; they become server routes in a pilot.

import type { MsmeCase } from "../types";
import { getAllCases, getCaseById, getRawById } from "../data/dataset";
import { scoreCase } from "../scoring/score";
import type {
  UliHealthCardResponse,
  CamPayload,
  AaConsentRequest,
  AaConsentResponse,
  AaConsentStatus,
  OcenAck,
  OcenDecision,
} from "./schemas";

export * from "./schemas";

const DISCLAIMER =
  "HealthLens is a decision-support and configurable recommendation engine. IDBI remains the regulated entity and final decision owner. Figures shown are synthetic prototype data.";

const posCodes = (c: MsmeCase) =>
  c.reasonCodes.filter((r) => r.polarity === "positive").map((r) => r.code);
const negCodes = (c: MsmeCase) =>
  c.reasonCodes.filter((r) => r.polarity === "negative").map((r) => r.code);
const sourcesUsed = (c: MsmeCase) =>
  c.dataCompleteness.filter((d) => d.available).map((d) => d.source);

const subScoresApi = (c: MsmeCase) => ({
  gst: c.subScores.gst,
  cashflow: c.subScores.bank,
  upi: c.subScores.upi,
  epfo: c.subScores.epfo,
  compliance: c.subScores.compliance,
  bureau: c.subScores.bureau,
  operations: c.subScores.operations,
});

/** GET /api/cases — list scored MSME cases for the credit-officer queue. */
export function listCases(): MsmeCase[] {
  return getAllCases();
}

/** GET /api/cases/:id — full scored case. */
export function getCase(id: string): MsmeCase | { error: string } {
  return getCaseById(id) ?? { error: `Case ${id} not found` };
}

/** POST /api/score — (re)score a case. In a pilot this scores a posted raw payload. */
export function scoreById(id: string): MsmeCase | { error: string } {
  const raw = getRawById(id);
  return raw ? scoreCase(raw) : { error: `Case ${id} not found` };
}

/** POST /api/uli/msme/health-card — ULI/OCEN-compatible scoring microservice. */
export function uliHealthCard(req: {
  msme_id: string;
  request_id?: string;
  product_code?: string;
  data_sources?: string[];
}): UliHealthCardResponse | { error: string } {
  const c = getCaseById(req.msme_id);
  if (!c) return { error: `Case ${req.msme_id} not found` };
  return {
    request_id: req.request_id ?? `REQ-${c.id}`,
    msme_id: c.id,
    health_score: c.healthScore,
    credit_style_score: c.creditStyleScore,
    risk_band: c.riskBand,
    sub_scores: subScoresApi(c),
    decision: c.decision,
    recommended_limit: c.recommendedLimit,
    recommended_tenor_months: c.tenorMonths,
    business_need: c.detectedBusinessNeed,
    product_route: c.productRoute,
    reason_codes_positive: posCodes(c),
    reason_codes_negative: negCodes(c),
    data_sources_used: sourcesUsed(c),
    fraud_flags: c.fraudFlags.map((f) => f.code),
    confidence: { level: c.confidence.level, score: c.confidence.score },
    cluster_risk: {
      cluster: c.clusterRisk.cluster,
      band: c.clusterRisk.band,
      index: c.clusterRisk.index,
    },
    audit_id: `AUD-${c.id}`,
  };
}

/** POST /api/cam — generate a printable Credit Assessment Memo payload. */
export function generateCam(
  id: string,
  override?: { reason: string },
): CamPayload | { error: string } {
  const c = getCaseById(id);
  if (!c) return { error: `Case ${id} not found` };
  return {
    cam_id: `CAM-${c.id}`,
    generated_at: "2026-06-28T09:15:00Z",
    borrower: {
      msme_id: c.id,
      legal_name: c.legalName,
      constitution: c.constitution,
      sector: c.sector,
      cluster: c.clusterCity,
      gstin: c.gstin,
      udyam_id: c.udyamId,
      vintage_months: c.vintageMonths,
      women_owned: c.womenOwned,
      ntc_ntb: c.ntcNtb,
      existing_idbi_customer: c.existingIdbiCustomer,
    },
    data_sources_used: sourcesUsed(c),
    health_score: c.healthScore,
    credit_style_score: c.creditStyleScore,
    risk_band: c.riskBand,
    sub_scores: subScoresApi(c),
    decision: c.decision,
    recommended_limit: c.recommendedLimit,
    tenor_months: c.tenorMonths,
    product_route: c.productRoute,
    product_route_reason: c.productRouteReason,
    business_need: c.detectedBusinessNeed,
    reason_codes_positive: posCodes(c),
    reason_codes_negative: negCodes(c),
    fraud_flags: c.fraudFlags,
    confidence: { level: c.confidence.level, score: c.confidence.score },
    cluster_risk: {
      cluster: c.clusterRisk.cluster,
      band: c.clusterRisk.band,
      index: c.clusterRisk.index,
    },
    fraud_analytics: {
      reversed_pair_count: c.fraudAnalytics.reversedPairCount,
      round_amount_ratio: c.fraudAnalytics.roundAmountRatio,
      benford_deviation: c.fraudAnalytics.benfordDeviation,
    },
    path_to_credit: c.pathToCredit,
    officer_override: { applied: !!override, reason: override?.reason ?? null },
    audit: c.audit,
    disclaimer: DISCLAIMER,
  };
}

/** POST /api/aa/consent-request — Sahamati-style consent artefact request. */
export function aaConsentRequest(req: AaConsentRequest): AaConsentResponse {
  const hash = req.customer_id.split("").reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const consentId = `CONSENT-${hash.toString(36).toUpperCase().slice(0, 8)}`;
  return {
    consent_id: consentId,
    status: "PENDING_CUSTOMER_AUTH",
    redirect_url: `https://aa-sandbox.example/auth?consentId=${consentId}`,
  };
}

/** GET /api/aa/consent-status/:id — mock consent status (post customer auth). */
export function aaConsentStatus(consentId: string): AaConsentStatus {
  const status = consentId.includes("REVOKE") ? "REVOKED" : "ACTIVE";
  return { consent_id: consentId, status, data_life_days: 30, fetch_type: "ONETIME" };
}

/** POST /api/ocen/loan-applications — async LSP intake acknowledgement. */
export function ocenLoanApplication(req: { msme_id: string; lsp_id?: string }): OcenAck {
  return {
    request_id: `OCEN-${req.msme_id}`,
    status: "ACCEPTED",
    received_at: "2026-06-28T09:14:00Z",
    callback_url: "/api/ocen/webhook/decision",
  };
}

/** POST /api/ocen/webhook/decision — async decision callback (JWS-signable). */
export function ocenWebhookDecision(
  requestId: string,
  msmeId: string,
): OcenDecision | { error: string } {
  const c = getCaseById(msmeId);
  if (!c) return { error: `Case ${msmeId} not found` };
  return {
    request_id: requestId,
    msme_id: c.id,
    decision: c.decision,
    risk_band: c.riskBand,
    recommended_limit: c.recommendedLimit,
    health_card_url: `/cases/${c.id}`,
    cam_url: `/cases/${c.id}/cam`,
    signed: true,
  };
}
