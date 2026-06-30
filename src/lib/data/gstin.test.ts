import { describe, it, expect } from "vitest";
import { gstinCheckDigit, isValidGstin, makeGstin } from "./gstin";
import { Rng } from "./rng";

describe("GSTIN checksum", () => {
  it("computes the known check digit for a reference GSTIN", () => {
    // 27AAPFU0939F1ZV is a widely used GSTIN format example; check digit = V.
    expect(gstinCheckDigit("27AAPFU0939F1Z")).toBe("V");
  });

  it("validates a correct GSTIN and rejects a corrupted one", () => {
    expect(isValidGstin("27AAPFU0939F1ZV")).toBe(true);
    expect(isValidGstin("27AAPFU0939F1ZX")).toBe(false); // wrong checksum
    expect(isValidGstin("27AAPFU0939F1Z")).toBe(false); // too short
    expect(isValidGstin("ZZAAPFU0939F1ZV")).toBe(false); // bad state code
  });

  it("generates only valid GSTINs across many seeds", () => {
    const states = ["27", "23", "29", "36", "07"];
    for (let seed = 1; seed <= 500; seed++) {
      const rng = new Rng(seed);
      const gstin = makeGstin(rng.pick(states), rng);
      expect(isValidGstin(gstin)).toBe(true);
    }
  });
});

describe("seeded RNG determinism", () => {
  it("produces identical sequences for identical seeds", () => {
    const a = new Rng(42);
    const b = new Rng(42);
    const seqA = Array.from({ length: 20 }, () => a.float());
    const seqB = Array.from({ length: 20 }, () => b.float());
    expect(seqA).toEqual(seqB);
  });
});
