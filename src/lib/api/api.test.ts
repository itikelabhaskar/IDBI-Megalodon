import { describe, it, expect } from "vitest";
import {
  listCases,
  getCase,
  scoreById,
  uliHealthCard,
  generateCam,
  aaConsentRequest,
  aaConsentStatus,
  ocenLoanApplication,
  ocenWebhookDecision,
  UliHealthCardResponseSchema,
  CamSchema,
  AaConsentResponseSchema,
  AaConsentStatusSchema,
  OcenAckSchema,
  OcenDecisionSchema,
} from "./index";
import { getAllCases, getRaws } from "../data/dataset";
import { fetchAaBank, fetchAllSources } from "../connectors";

const cases = getAllCases();
const sampleId = cases[0].id;

describe("API endpoint stubs (plan.md §11)", () => {
  it("GET /api/cases returns the memoised scored population", () => {
    const list = listCases();
    expect(list.length).toBeGreaterThan(0);
    expect(list).toBe(cases);
  });

  it("GET /api/cases/:id returns a case or a not-found error", () => {
    expect(getCase(sampleId)).toMatchObject({ id: sampleId });
    expect(getCase("MSME-NOPE")).toEqual({ error: expect.stringContaining("not found") });
  });

  it("POST /api/score re-scores a case", () => {
    expect(scoreById(sampleId)).toMatchObject({ id: sampleId });
    expect(scoreById("MSME-NOPE")).toEqual({ error: expect.stringContaining("not found") });
  });

  it("POST /api/uli/msme/health-card matches the ULI response schema", () => {
    const r = uliHealthCard({ msme_id: sampleId, request_id: "REQ-1" });
    expect("error" in r).toBe(false);
    expect(() => UliHealthCardResponseSchema.parse(r)).not.toThrow();
  });

  it("POST /api/cam matches the CAM schema and carries the disclaimer", () => {
    const cam = generateCam(sampleId, { reason: "Officer accepted with covenant" });
    const parsed = CamSchema.parse(cam);
    expect(parsed.disclaimer).toContain("IDBI remains the regulated entity");
    expect(parsed.officer_override.applied).toBe(true);
  });

  it("AA consent request + status match their schemas", () => {
    const req = aaConsentRequest({
      customer_id: "MSME-1042@aa",
      fi_types: ["BANK", "GST"],
      data_range: { from: "2025-06-01", to: "2026-05-31" },
      data_life: { unit: "DAY", value: 30 },
      frequency: { unit: "DAY", value: 1 },
      purpose_code: "103",
      purpose_text: "MSME working capital loan",
    });
    expect(() => AaConsentResponseSchema.parse(req)).not.toThrow();
    expect(req.status).toBe("PENDING_CUSTOMER_AUTH");

    const status = aaConsentStatus(req.consent_id);
    expect(() => AaConsentStatusSchema.parse(status)).not.toThrow();
    expect(status.status).toBe("ACTIVE");
    expect(aaConsentStatus("CONSENT-REVOKE").status).toBe("REVOKED");
  });

  it("OCEN intake + async webhook decision match their schemas", () => {
    const ack = ocenLoanApplication({ msme_id: sampleId });
    expect(() => OcenAckSchema.parse(ack)).not.toThrow();
    const dec = ocenWebhookDecision(ack.request_id, sampleId);
    expect("error" in dec).toBe(false);
    expect(() => OcenDecisionSchema.parse(dec)).not.toThrow();
  });
});

describe("connector stubs (ReBIT / AA fidelity)", () => {
  const raw = getRaws()[0];

  it("uses the ReBIT Profile / Summary / Transactions envelope", () => {
    const aa = fetchAaBank(raw);
    expect(aa.Profile.Holders.Holder.length).toBeGreaterThan(0);
    expect(aa.Summary.currency).toBe("INR");
    expect(aa.Transactions.Transaction.length).toBe(raw.bank.transactions.length);
  });

  it("masks promoter PAN and mobile (DPDP minimisation)", () => {
    const holder = fetchAaBank(raw).Profile.Holders.Holder[0];
    expect(holder.pan).toMatch(/^XXXXX/);
    expect(holder.mobile).toMatch(/^XXXXXX/);
  });

  it("keeps AA transaction balances faithful to the raw feed", () => {
    const aa = fetchAaBank(raw);
    aa.Transactions.Transaction.forEach((t, i) => {
      expect(t.currentBalance).toBe(raw.bank.transactions[i].balancePost);
    });
  });

  it("aggregates all consented sources", () => {
    const all = fetchAllSources(raw);
    expect(all.aaBank).toBeTruthy();
    expect(all).toHaveProperty("gstn");
    expect(all).toHaveProperty("upi");
    expect(all).toHaveProperty("epfo");
    expect(all).toHaveProperty("bureau");
    expect(all).toHaveProperty("fuel");
    expect(all).toHaveProperty("fastag");
    expect(all).toHaveProperty("eway");
  });
});
