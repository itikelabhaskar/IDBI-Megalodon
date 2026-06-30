// Single source of the scored MSME population for the API layer and the UI.
// Generated and scored once, then memoised, so every consumer (cases list, case
// detail, CAM, ULI endpoint, governance) sees an identical, deterministic dataset.

import { generateDataset } from "./generate";
import type { RawMsme } from "./raw-types";
import { scoreDataset } from "../scoring/score";
import type { MsmeCase } from "../types";

// Population served to the UI. The generator supports 500–1000 (see the
// data-quality tests); the deployed queue uses a lighter, snappy subset that
// still exhibits the full decision spread and rich portfolio/governance stats.
export const DATASET_SIZE = 240;

let rawsCache: RawMsme[] | null = null;
let casesCache: MsmeCase[] | null = null;

export function getRaws(): RawMsme[] {
  if (!rawsCache) rawsCache = generateDataset(DATASET_SIZE);
  return rawsCache;
}

export function getAllCases(): MsmeCase[] {
  if (!casesCache) casesCache = scoreDataset(getRaws());
  return casesCache;
}

export function getCaseById(id: string): MsmeCase | undefined {
  return getAllCases().find((c) => c.id === id);
}

export function getRawById(id: string): RawMsme | undefined {
  return getRaws().find((m) => m.profile.msmeId === id);
}
