// Single source of the scored MSME population for the API layer and the UI.
// Generated and scored once, then memoised, so every consumer (cases list, case
// detail, CAM, ULI endpoint, governance) sees an identical, deterministic dataset.

import { generateDataset } from "./generate";
import type { RawMsme } from "./raw-types";
import { scoreDataset } from "../scoring/score";
import { computeFeatures, type FeatureVector } from "../scoring/features";
import type { ScoreCtx } from "../scoring/scorecard";
import { simulateScore, type SimResult } from "../scoring/simulate";
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

export interface SimulatorSeed {
  features: FeatureVector;
  ctx: ScoreCtx;
  baseline: SimResult;
}

/** Base feature vector + context + baseline outcome for the what-if simulator. */
export function getSimulatorSeed(id: string): SimulatorSeed | undefined {
  const raw = getRawById(id);
  if (!raw) return undefined;
  const features = computeFeatures(raw);
  const ctx: ScoreCtx = {
    hasUdyam: !!raw.profile.udyamId,
    availableSources: raw.dataCompleteness.filter((d) => d.available).length,
  };
  return { features, ctx, baseline: simulateScore(features, ctx) };
}
