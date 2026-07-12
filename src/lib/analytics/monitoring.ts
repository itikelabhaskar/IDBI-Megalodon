// Mode B — book monitoring signals from series already on the Health Card.
// Thin, honest watchlist — not a PD-track rebrand.

import type { MsmeCase, TrendPoint } from "../types";

export type ScoreTrendHint = "Rising" | "Stable" | "Falling";

function seriesSlope(points: { value: number }[]): number {
  if (points.length < 4) return 0;
  const first = points.slice(0, 3).reduce((s, p) => s + p.value, 0) / 3;
  const last = points.slice(-3).reduce((s, p) => s + p.value, 0) / 3;
  if (first === 0) return last > 0 ? 0.1 : 0;
  return (last - first) / Math.abs(first);
}

/** Simple momentum hint from GST turnover or bank cash-flow inflows. */
export function scoreTrendHint(c: MsmeCase): ScoreTrendHint {
  const gst: TrendPoint[] = c.gstTrend;
  const bank = c.cashflow.map((p) => ({ value: p.inflow }));
  const slope = gst.length >= 4 ? seriesSlope(gst) : seriesSlope(bank);
  if (slope > 0.08) return "Rising";
  if (slope < -0.08) return "Falling";
  return "Stable";
}

export interface MonitoringSignals {
  scoreTrend: ScoreTrendHint;
  renewalDue: boolean;
  watchlist: boolean;
  reasons: string[];
}

/** Mode B monitoring pane inputs for a single Health Card. */
export function monitoringSignals(c: MsmeCase): MonitoringSignals {
  const reasons: string[] = [];
  const scoreTrend = scoreTrendHint(c);
  if (scoreTrend === "Falling") reasons.push("Cash-flow / GST momentum falling");

  const renewalDue =
    c.detectedBusinessNeed === "RenewalReview" ||
    c.reasonCodes.some((r) => /RENEWAL|LIMIT_UTIL/i.test(r.code));
  if (renewalDue) reasons.push("Renewal or limit-review cue on file");

  const highFraud = c.fraudFlags.some((f) => f.severity === "high");
  const weakAuth = c.authenticity.band === "Weak";
  const watchlist = c.decision === "Reject" || highFraud || weakAuth;
  if (c.decision === "Reject") reasons.push("Engine decision Reject");
  if (highFraud) reasons.push("High-severity fraud flag");
  if (weakAuth) reasons.push("Operational authenticity Weak");

  return { scoreTrend, renewalDue, watchlist, reasons };
}
