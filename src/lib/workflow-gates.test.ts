import { describe, it, expect } from "vitest";
import { requiresForcedChecker, makerGateMessage } from "./workflow-gates";

describe("workflow-gates", () => {
  it("forces checker on Low confidence", () => {
    expect(requiresForcedChecker("Low", "Approve")).toBe(true);
    expect(requiresForcedChecker("Medium", "Approve")).toBe(false);
    expect(requiresForcedChecker("High", "Refer")).toBe(false);
  });

  it("forces checker when engine decision is Incomplete", () => {
    expect(requiresForcedChecker("High", "Incomplete")).toBe(true);
    expect(requiresForcedChecker("Medium", "Incomplete")).toBe(true);
  });

  it("surfaces maker messages for Low Approve and Incomplete", () => {
    expect(makerGateMessage("Low", "Approve")).toMatch(/four-eyes/i);
    expect(makerGateMessage("High", "Incomplete")).toMatch(/Incomplete/i);
    expect(makerGateMessage("High", "Approve")).toBeNull();
  });
});
