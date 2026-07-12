// Inclusion funnel narrative — HealthLens language for NTC/NTB kept in the book.
// Contrasts bureau-thin auto-decline assumption vs alt-data Health Card outcomes.

import type { MsmeCase } from "@/lib/types";
import { creditInvisibleLift, type CreditInvisibleLift } from "./portfolio";

export interface InclusionFunnelStory extends CreditInvisibleLift {
  /** Assumed bureau-only reject rate for thin NTC (illustrative baseline). */
  bureauOnlyRejectPct: number;
  /** Cases that would have been auto-declined under bureau-only, now Approve/Refer. */
  rescuedToAdvance: number;
  /** Incomplete outcomes among NTC — evidence gate, not silent reject. */
  incompleteCount: number;
  headline: string;
}

/**
 * Build officer-facing inclusion story from the existing lift metric.
 * Bureau-only baseline is illustrative (thin-file auto-decline), not a live bureau pull.
 */
export function inclusionFunnelStory(cases: MsmeCase[]): InclusionFunnelStory {
  const lift = creditInvisibleLift(cases);
  const ntc = cases.filter((c) => c.ntcNtb);
  const incompleteCount = ntc.filter((c) => c.decision === "Incomplete").length;
  const rescuedToAdvance = lift.approveOrRefer;
  const bureauOnlyRejectPct = 100;
  return {
    ...lift,
    bureauOnlyRejectPct,
    rescuedToAdvance,
    incompleteCount,
    headline:
      lift.ntcCount === 0
        ? "No NTC/NTB cases in this synthetic book."
        : `${lift.inclusionLiftPct}% of credit-invisible MSMEs stay in the funnel under HealthLens — vs a bureau-thin path that would decline them by default.`,
  };
}
