import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// Permanent claim-audit (plan.md §12): the app code must never ship the
// forbidden marketing/claims. Scans all non-test source under src/.

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const FORBIDDEN: RegExp[] = [
  /guaranteed approval/i,
  /fully automated final sanction/i,
  /\b9\d%\s*accura/i,
  /replaces?\s+(the\s+)?credit officers?/i,
  /\bCIBIL\b/,
];

describe("compliance — no forbidden claims in app code", () => {
  const files = walk("src").filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f));

  it("ships none of the forbidden marketing/claim phrases", () => {
    const offenders: string[] = [];
    for (const f of files) {
      const text = readFileSync(f, "utf8");
      for (const rx of FORBIDDEN) if (rx.test(text)) offenders.push(`${f} :: ${rx}`);
    }
    expect(offenders).toEqual([]);
  });
});
