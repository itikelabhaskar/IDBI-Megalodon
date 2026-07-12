// Ablation + anti-gaming harness on the synthetic book — proves alt-data lift
// and fraud floor without inventing AUC theatre.

import type { MsmeCase, SubScores } from "../types";
import { getAllCases, getRaws } from "../data/dataset";
import { computeHealthScore } from "../scoring/scorecard";

export interface AblationSummary {
  sampleN: number;
  meanFullScore: number;
  meanStructuredOnly: number;
  meanDelta: number;
  fraudSuspectCatchRate: number;
  highFraudFlagCatchRate: number;
  note: string;
}

/** Structured rails only: GST + bank + bureau (+ compliance). Null out alt ops. */
function structuredOnlySubs(sub: SubScores): SubScores {
  return {
    gst: sub.gst,
    bank: sub.bank,
    bureau: sub.bureau,
    compliance: sub.compliance,
    upi: null,
    epfo: null,
    operations: null,
  };
}

/**
 * Structured-only vs full HealthScore delta on the scored population, plus
 * gaming catch rates for FRAUD_SUSPECT archetypes and high-severity fraud flags.
 */
export function ablationSummary(cases?: MsmeCase[]): AblationSummary {
  const sample = cases ?? getAllCases();
  const raws = getRaws();
  const archById = new Map(raws.map((m) => [m.profile.msmeId, m.profile.archetype]));

  let fullSum = 0;
  let structSum = 0;
  for (const c of sample) {
    fullSum += c.healthScore;
    structSum += computeHealthScore(structuredOnlySubs(c.subScores));
  }
  const n = sample.length || 1;
  const meanFullScore = Math.round((fullSum / n) * 10) / 10;
  const meanStructuredOnly = Math.round((structSum / n) * 10) / 10;

  const fraudSuspects = sample.filter((c) => archById.get(c.id) === "FRAUD_SUSPECT");
  const fraudCaught = fraudSuspects.filter(
    (c) =>
      c.decision === "Reject" || c.fraudFlags.some((f) => f.severity === "high"),
  ).length;

  const highFlagCases = sample.filter((c) =>
    c.fraudFlags.some((f) => f.severity === "high"),
  );
  const highCaught = highFlagCases.filter((c) => c.decision === "Reject").length;

  return {
    sampleN: sample.length,
    meanFullScore,
    meanStructuredOnly,
    meanDelta: Math.round((meanFullScore - meanStructuredOnly) * 10) / 10,
    fraudSuspectCatchRate: fraudSuspects.length
      ? Math.round((fraudCaught / fraudSuspects.length) * 100)
      : 0,
    highFraudFlagCatchRate: highFlagCases.length
      ? Math.round((highCaught / highFlagCases.length) * 100)
      : 0,
    note: "Synthetic-book ablation — structured (GST/bank/bureau) vs full card including UPI/EPFO/ops. Not a production AUC claim.",
  };
}
