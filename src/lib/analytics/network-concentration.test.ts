import { describe, it, expect } from "vitest";
import { networkConcentration } from "./network-concentration";
import type { MsmeCase } from "../types";

function base(partial: Partial<MsmeCase>): MsmeCase {
  return {
    id: "t1",
    name: "Stub",
    sector: "Trading",
    state: "MH",
    ntcNtb: false,
    decision: "Refer",
    healthScore: 65,
    band: "B",
    recommendedLimit: 0,
    productRoute: "Working capital",
    authenticity: { band: "Strong", summary: "ok", flags: [] },
    subScores: {
      gst: 70,
      bank: 70,
      upi: 70,
      epfo: 70,
      compliance: 70,
      bureau: 70,
      operations: 70,
    },
    reasonCodes: [],
    contributions: [],
    fraudFlags: [],
    pathToCredit: [],
    gstTrend: [],
    cashflow: [],
    powerConsumption: [],
    fuelConsumption: [],
    buyerConcentration: [],
    upiTopCounterpartyShare: null,
    mlProbabilityProxy: 0.5,
    confidence: 0.8,
    ...partial,
  } as MsmeCase;
}

describe("networkConcentration", () => {
  it("marks empty signals as Diversified with empty summary path", () => {
    const n = networkConcentration(base({}));
    expect(n.nodes).toHaveLength(0);
    expect(n.band).toBe("Diversified");
    expect(n.summary).toMatch(/No buyer/);
  });

  it("bands Watch vs Concentrated from top share", () => {
    const watch = networkConcentration(
      base({
        buyerConcentration: [
          { name: "Buyer A", share: 0.4 },
          { name: "Buyer B", share: 0.2 },
        ],
      }),
    );
    expect(watch.band).toBe("Watch");
    expect(watch.topName).toBe("Buyer A");

    const hot = networkConcentration(
      base({
        buyerConcentration: [{ name: "MegaBuyer", share: 0.7 }],
        upiTopCounterpartyShare: 0.25,
      }),
    );
    expect(hot.band).toBe("Concentrated");
    expect(hot.nodes.some((n) => n.rail === "UPI counterparty")).toBe(true);
  });

  it("sorts nodes by share descending", () => {
    const n = networkConcentration(
      base({
        buyerConcentration: [
          { name: "Low", share: 0.1 },
          { name: "High", share: 0.5 },
        ],
        upiTopCounterpartyShare: 0.3,
      }),
    );
    expect(n.nodes[0].name).toBe("High");
    expect(n.nodes.map((x) => x.share)).toEqual([...n.nodes.map((x) => x.share)].sort((a, b) => b - a));
  });
});
