// Sector-aware operational authenticity for power and fuel rails.
// HealthLens naming — intensity · regularity · payment consistency bands.

import type { AuthenticityAssessment, AuthenticityBand } from "../types";
import type { FeatureVector } from "./features";

function bandFromScore(s: number | null): AuthenticityBand {
  if (s === null) return "Unavailable";
  if (s >= 80) return "Strong";
  if (s >= 60) return "Adequate";
  return "Weak";
}

function feedScore(trend: number, gap: number, hasGst: boolean, highGap: number): number {
  let s = 70;
  if (trend > 0.15) s += 20;
  else if (trend > 0.05) s += 10;
  else if (trend < -0.15) s -= 15;
  else if (trend < -0.05) s -= 7;
  if (hasGst) {
    if (gap > highGap) s -= 30;
    else if (gap > highGap * 0.6) s -= 12;
  }
  return Math.max(0, Math.min(100, s));
}

/** Manufacturing leans on power; trader/logistics lean on fuel. */
export function assessAuthenticity(f: FeatureVector, sector: string): AuthenticityAssessment {
  const powerScore = f.hasPower
    ? feedScore(f.powerTrend, f.turnoverPowerGap, f.hasGst, 0.5)
    : null;
  const fuelScore = f.hasFuel
    ? feedScore(f.fuelTrend, f.fuelTurnoverGap, f.hasGst, 0.6)
    : null;

  const powerBand = bandFromScore(powerScore);
  const fuelBand = bandFromScore(fuelScore);

  const mfg = /manufactur|textile|engineer|pharma|chemical|metal/i.test(sector);
  const logistics = /logistics|transport|trader|trading|wholesale|retail/i.test(sector);

  let primary: number | null = null;
  if (mfg && powerScore !== null) primary = powerScore;
  else if (logistics && fuelScore !== null) primary = fuelScore;
  else if (powerScore !== null && fuelScore !== null)
    primary = Math.round((powerScore + fuelScore) / 2);
  else primary = powerScore ?? fuelScore;

  const band = bandFromScore(primary);
  let summary: string;
  if (band === "Unavailable")
    summary = "No power or fuel rail — operational authenticity not assessed.";
  else if (mfg)
    summary = `Manufacturing authenticity ${band.toLowerCase()} (power load vs declared turnover).`;
  else if (logistics)
    summary = `Trade/logistics authenticity ${band.toLowerCase()} (fuel / ops spend vs turnover).`;
  else summary = `Operational authenticity ${band.toLowerCase()} from available power/fuel rails.`;

  return { band, powerBand, fuelBand, summary };
}
