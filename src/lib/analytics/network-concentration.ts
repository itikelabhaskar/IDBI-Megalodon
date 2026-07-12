// Trade & payment concentration — HealthLens network view from GST buyers + UPI share.
// Not an entity-graph clone: concentration risk for the officer fraud tab.

import type { MsmeCase } from "@/lib/types";

export interface ConcentrationNode {
  name: string;
  share: number; // 0–1
  rail: "GST buyer" | "UPI counterparty";
}

export interface NetworkConcentration {
  nodes: ConcentrationNode[];
  topShare: number;
  topName: string;
  band: "Diversified" | "Watch" | "Concentrated";
  summary: string;
}

function bandFor(top: number): NetworkConcentration["band"] {
  if (top >= 0.55) return "Concentrated";
  if (top >= 0.35) return "Watch";
  return "Diversified";
}

/** Build concentration nodes from GST buyer shares and UPI top-counterparty share. */
export function networkConcentration(c: MsmeCase): NetworkConcentration {
  const nodes: ConcentrationNode[] = [];
  for (const b of (c.buyerConcentration ?? []).slice(0, 5)) {
    if (b.share > 0) nodes.push({ name: b.name, share: b.share, rail: "GST buyer" });
  }
  if (c.upiTopCounterpartyShare != null && c.upiTopCounterpartyShare > 0) {
    nodes.push({
      name: "Largest UPI counterparty",
      share: c.upiTopCounterpartyShare,
      rail: "UPI counterparty",
    });
  }

  nodes.sort((a, b) => b.share - a.share);
  const top = nodes[0];
  const topShare = top?.share ?? 0;
  const topName = top?.name ?? "—";
  const band = bandFor(topShare);
  const summary =
    nodes.length === 0
      ? "No buyer or UPI concentration signals on this Health Card."
      : band === "Concentrated"
        ? `High concentration — ${topName} at ${Math.round(topShare * 100)}% of observed share. Verify dependency risk before sanction.`
        : band === "Watch"
          ? `Moderate concentration — top node ${topName} at ${Math.round(topShare * 100)}%.`
          : `Diversified trade/payment mix — top node at ${Math.round(topShare * 100)}%.`;

  return { nodes: nodes.slice(0, 6), topShare, topName, band, summary };
}
