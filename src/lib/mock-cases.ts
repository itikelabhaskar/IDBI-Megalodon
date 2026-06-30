// Data facade for the UI screens.
//
// Despite the legacy filename, these are NOT hand-authored mocks: every case is
// produced by the deterministic synthetic-data generator + scoring engine
// (src/lib/data + src/lib/scoring) and served through the API layer. Kept here so
// the screens that import `@/lib/mock-cases` need no changes.

import type { MsmeCase } from "./types";
import { getAllCases, getCaseById } from "./data/dataset";

/** All scored MSME cases for the credit-officer queue, governance and portfolio. */
export function listCases(): MsmeCase[] {
  return getAllCases();
}

/** A single scored case by id (undefined if not found). */
export function getCase(id: string): MsmeCase | undefined {
  return getCaseById(id);
}
