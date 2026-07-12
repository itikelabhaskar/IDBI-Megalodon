// Pure workflow gate helpers (testable without React).

import type { ConfidenceLevel, Decision } from "./types";

/** Low confidence (or Incomplete engine call) forces four-eyes — no STP sanction. */
export function requiresForcedChecker(
  confidence: ConfidenceLevel,
  engineDecision: Decision,
): boolean {
  return confidence === "Low" || engineDecision === "Incomplete";
}

/** Maker may record any decision, but Approve under Low confidence still routes to checker (always). */
export function makerGateMessage(
  confidence: ConfidenceLevel,
  chosen: Decision,
): string | null {
  if (confidence === "Low" && chosen === "Approve") {
    return "Low assessment confidence — Approve must go through Risk Admin (four-eyes). Reason is mandatory.";
  }
  if (chosen === "Incomplete") {
    return "Incomplete evidence — route to checker to confirm data-gathering before any credit call.";
  }
  return null;
}
