// Zod schemas for the API/integration boundary. These define the exact payload
// shapes the endpoint stubs return, so responses can be validated at runtime and
// the contract is explicit for a future IDBI sandbox swap (plan.md §11).

import { z } from "zod";

const band = z.enum(["A", "B", "C", "D"]);
const decision = z.enum(["Approve", "Refer", "Reject"]);

export const SubScoresApiSchema = z.object({
  gst: z.number().nullable(),
  cashflow: z.number().nullable(),
  upi: z.number().nullable(),
  epfo: z.number().nullable(),
  compliance: z.number().nullable(),
  bureau: z.number().nullable(),
  operations: z.number().nullable(),
});

// POST /api/uli/msme/health-card
export const UliHealthCardResponseSchema = z.object({
  request_id: z.string(),
  msme_id: z.string(),
  health_score: z.number(),
  credit_style_score: z.number(),
  risk_band: band,
  sub_scores: SubScoresApiSchema,
  decision,
  recommended_limit: z.number(),
  recommended_tenor_months: z.number(),
  business_need: z.string(),
  product_route: z.string(),
  reason_codes_positive: z.array(z.string()),
  reason_codes_negative: z.array(z.string()),
  data_sources_used: z.array(z.string()),
  fraud_flags: z.array(z.string()),
  audit_id: z.string(),
});
export type UliHealthCardResponse = z.infer<typeof UliHealthCardResponseSchema>;

// POST /api/cam
export const CamSchema = z.object({
  cam_id: z.string(),
  generated_at: z.string(),
  borrower: z.object({
    msme_id: z.string(),
    legal_name: z.string(),
    constitution: z.string(),
    sector: z.string(),
    cluster: z.string(),
    gstin: z.string().nullable(),
    udyam_id: z.string().nullable(),
    vintage_months: z.number(),
    women_owned: z.boolean(),
    ntc_ntb: z.boolean(),
    existing_idbi_customer: z.boolean(),
  }),
  data_sources_used: z.array(z.string()),
  health_score: z.number(),
  credit_style_score: z.number(),
  risk_band: band,
  sub_scores: SubScoresApiSchema,
  decision,
  recommended_limit: z.number(),
  tenor_months: z.number(),
  product_route: z.string(),
  product_route_reason: z.string(),
  business_need: z.string(),
  reason_codes_positive: z.array(z.string()),
  reason_codes_negative: z.array(z.string()),
  fraud_flags: z.array(z.object({ code: z.string(), severity: z.string(), label: z.string() })),
  path_to_credit: z.array(z.object({ action: z.string(), rationale: z.string() })),
  officer_override: z.object({ applied: z.boolean(), reason: z.string().nullable() }),
  audit: z.array(
    z.object({
      ts: z.string(),
      actor: z.string(),
      action: z.string(),
      detail: z.string().optional(),
    }),
  ),
  disclaimer: z.string(),
});
export type CamPayload = z.infer<typeof CamSchema>;

// POST /api/aa/consent-request
export const AaConsentRequestSchema = z.object({
  customer_id: z.string(),
  fi_types: z.array(z.string()),
  data_range: z.object({ from: z.string(), to: z.string() }),
  data_life: z.object({ unit: z.string(), value: z.number() }),
  frequency: z.object({ unit: z.string(), value: z.number() }),
  purpose_code: z.string(),
  purpose_text: z.string(),
});
export type AaConsentRequest = z.infer<typeof AaConsentRequestSchema>;

export const AaConsentResponseSchema = z.object({
  consent_id: z.string(),
  status: z.literal("PENDING_CUSTOMER_AUTH"),
  redirect_url: z.string(),
});
export type AaConsentResponse = z.infer<typeof AaConsentResponseSchema>;

// GET /api/aa/consent-status/:id
export const AaConsentStatusSchema = z.object({
  consent_id: z.string(),
  status: z.enum(["PENDING_CUSTOMER_AUTH", "ACTIVE", "REVOKED"]),
  data_life_days: z.number(),
  fetch_type: z.string(),
});
export type AaConsentStatus = z.infer<typeof AaConsentStatusSchema>;

// POST /api/ocen/loan-applications
export const OcenAckSchema = z.object({
  request_id: z.string(),
  status: z.literal("ACCEPTED"),
  received_at: z.string(),
  callback_url: z.string(),
});
export type OcenAck = z.infer<typeof OcenAckSchema>;

// POST /api/ocen/webhook/decision
export const OcenDecisionSchema = z.object({
  request_id: z.string(),
  msme_id: z.string(),
  decision,
  risk_band: band,
  recommended_limit: z.number(),
  health_card_url: z.string(),
  cam_url: z.string(),
  signed: z.boolean(),
});
export type OcenDecision = z.infer<typeof OcenDecisionSchema>;
