// Policy weight transparency — how each present HealthScore sub-score contributes.
// Not a peer WOE clone: uses our SUBSCORE_WEIGHTS with missing-rail re-normalisation.

import type { SubScores } from "@/lib/types";
import { SUBSCORE_WEIGHTS } from "./scorecard";

export interface PolicyWeightRow {
  key: keyof SubScores;
  label: string;
  /** Policy weight after re-normalisation (0–1). */
  weight: number;
  /** Sub-score 0–100, or null if rail absent. */
  score: number | null;
  /** Contribution to HealthScore (weight × score), 0 if absent. */
  contribution: number;
  present: boolean;
}

const LABELS: Record<keyof SubScores, string> = {
  gst: "GST compliance & filing",
  bank: "Bank cash-flow behaviour",
  upi: "UPI payment behaviour",
  epfo: "EPFO continuity",
  compliance: "KYC / Udyam / completeness",
  bureau: "Bureau-lite (thin when NTC)",
  operations: "Operations (power / fuel)",
};

/** Effective policy weights and contributions for the officer / auditor pane. */
export function policyWeightRows(sub: SubScores, ntcOpsBoost = false): PolicyWeightRow[] {
  const weights: Record<keyof SubScores, number> = { ...SUBSCORE_WEIGHTS };
  if (ntcOpsBoost) {
    weights.operations = 0.22;
    weights.gst = 0.12;
    weights.bureau = 0.03;
    weights.bank = 0.28;
    weights.upi = 0.15;
    weights.epfo = 0.1;
    weights.compliance = 0.1;
  }
  let den = 0;
  (Object.keys(weights) as (keyof SubScores)[]).forEach((k) => {
    if (sub[k] !== null) den += weights[k];
  });
  if (den === 0) den = 1;

  return (Object.keys(weights) as (keyof SubScores)[]).map((k) => {
    const present = sub[k] !== null;
    const weight = present ? weights[k] / den : 0;
    const score = sub[k];
    return {
      key: k,
      label: LABELS[k],
      weight,
      score,
      contribution: present && score !== null ? weight * score : 0,
      present,
    };
  });
}
