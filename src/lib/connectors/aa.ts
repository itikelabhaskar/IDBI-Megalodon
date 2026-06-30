// AA bank connector stub — exposes the synthetic bank feed in a ReBIT/Account
// Aggregator-style Profile / Summary / Transactions envelope (plan.md §6, §11;
// perplexity2 §5.3, §5.8). Promoter PAN / mobile are masked (DPDP minimisation).
// In a pilot this stub is swapped for IDBI's live FIU module without touching the
// downstream feature engine.

import type { RawMsme } from "../data/raw-types";

export interface AaHolder {
  name: string;
  pan: string; // masked
  mobile: string; // masked
  ckycCompliance: boolean;
}

export interface AaTransaction {
  type: "CREDIT" | "DEBIT";
  mode: string;
  amount: number;
  currentBalance: number;
  transactionTimestamp: string;
  valueDate: string;
  txnId: string;
  narration: string;
  reference: string;
}

export interface AaBankPayload {
  Profile: { Holders: { Holder: AaHolder[] } };
  Summary: {
    currentBalance: number;
    currency: "INR";
    balanceDateTime: string;
    type: "SAVINGS" | "CURRENT" | "OD" | "CC";
    branch: string;
    facility: "OD" | "CC" | "NA";
    status: "ACTIVE";
    drawingLimit: number;
  };
  Transactions: {
    startDate: string;
    endDate: string;
    Transaction: AaTransaction[];
  };
}

function maskPan(gstin: string | null): string {
  // GSTIN positions 2..11 (0-based) carry the PAN; mask all but the last 4.
  if (gstin && gstin.length >= 12) return `XXXXX${gstin.slice(7, 12)}`;
  return "XXXXX0000X";
}

function maskMobile(id: string): string {
  const last4 = String(1000 + (id.split("").reduce((s, c) => s + c.charCodeAt(0), 0) % 9000));
  return `XXXXXX${last4}`;
}

export function fetchAaBank(raw: RawMsme): AaBankPayload {
  const txns = raw.bank.transactions;
  const last = txns[txns.length - 1];
  const facilityType = raw.profile.existingFacilityType;
  return {
    Profile: {
      Holders: {
        Holder: [
          {
            name: raw.profile.legalName,
            pan: maskPan(raw.profile.gstin),
            mobile: maskMobile(raw.profile.msmeId),
            ckycCompliance: true,
          },
        ],
      },
    },
    Summary: {
      currentBalance: last ? last.balancePost : raw.bank.openingBalance,
      currency: "INR",
      balanceDateTime: "2026-05-31T23:59:59Z",
      type: facilityType === "Cash Credit" ? "CC" : facilityType === "OD" ? "OD" : "CURRENT",
      branch: raw.profile.clusterCity,
      facility: facilityType === "Cash Credit" ? "CC" : facilityType === "OD" ? "OD" : "NA",
      status: "ACTIVE",
      drawingLimit: raw.profile.currentLimit,
    },
    Transactions: {
      startDate: txns[0]?.txnDate ?? "2025-06-01",
      endDate: last?.txnDate ?? "2026-05-31",
      Transaction: txns.map((t, i) => ({
        type: t.direction === "CR" ? "CREDIT" : "DEBIT",
        mode: t.channel,
        amount: t.amount,
        currentBalance: t.balancePost,
        transactionTimestamp: `${t.txnDate}T10:00:00Z`,
        valueDate: t.txnDate,
        txnId: `T-${raw.profile.msmeId}-${i}`,
        narration: t.narration,
        reference: t.narrationTag,
      })),
    },
  };
}
