import { describe, it, expect } from "vitest";
import { generateDataset } from "./data/generate";
import { scoreDataset } from "./scoring/score";
import { policyGates, triangulationVerdicts } from "./case-insights";

describe("case-insights triangulation honesty", () => {
  const cases = scoreDataset(generateDataset(120));

  it("does not claim power supports turnover when the power feed is missing", () => {
    const noPower = cases.find(
      (c) =>
        !c.dataCompleteness.some((d) => d.source === "POWER" && d.available) &&
        !c.fraudFlags.some((f) => f.code === "POWER_TURNOVER_MISMATCH"),
    );
    expect(noPower).toBeDefined();
    const powerGate = triangulationVerdicts(noPower!).find((v) => v.label === "Power vs turnover");
    expect(powerGate?.status).toBe("Review");
    expect(powerGate?.detail.toLowerCase()).toContain("not consented");
  });

  it("flags fuel mismatch as Review when the fuel feed is present and mismatched", () => {
    const fuelMismatch = cases.find((c) =>
      c.fraudFlags.some((f) => f.code === "FUEL_TURNOVER_MISMATCH"),
    );
    expect(fuelMismatch).toBeDefined();
    const fuelGate = triangulationVerdicts(fuelMismatch!).find(
      (v) => v.label === "Fuel vs turnover",
    );
    expect(fuelGate?.status).toBe("Review");
    expect(policyGates(fuelMismatch!).find((g) => g.label === "Power / fuel operations")?.status).toBe(
      "Review",
    );
  });
});
