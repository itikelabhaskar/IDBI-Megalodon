// Confidence / data-quality assessment.
//
// Separate from WHETHER an MSME is a good credit: this measures how much an
// officer should TRUST the assessment, built from (1) data completeness,
// (2) history depth/recency, and (3) cross-source agreement (triangulation
// consistency). A thin, stale, or internally-contradictory file yields Low
// confidence even if the HealthScore is high — exactly the honesty a bank wants
// when lending to credit-invisible MSMEs.

import type { RawMsme } from "../data/raw-types";
import type { FeatureVector } from "./features";
import type { ConfidenceAssessment, ConfidenceFactor, ConfidenceLevel } from "../types";

const TIME_SERIES = new Set(["GST", "AA_BANK", "UPI", "EPFO", "POWER"]);

export function assessConfidence(raw: RawMsme, f: FeatureVector): ConfidenceAssessment {
  const factors: ConfidenceFactor[] = [];
  const sources = raw.dataCompleteness;
  const available = sources.filter((s) => s.available);
  const availableCount = available.length;
  const totalCount = sources.length || 6;

  // 1. Completeness — up to 40 pts.
  const completenessPts = Math.round((availableCount / totalCount) * 40);
  factors.push({
    label: "Data completeness",
    detail: `${availableCount} of ${totalCount} sources consented`,
    impact: availableCount >= 5 ? "positive" : availableCount <= 3 ? "negative" : "neutral",
  });

  // 2. History depth — up to 25 pts, from the thinnest available time-series feed.
  const depths = available
    .filter((s) => TIME_SERIES.has(s.source))
    .map((s) => s.monthsCovered ?? 0);
  const minDepth = depths.length ? Math.min(...depths) : 0;
  const depthPts = Math.round(Math.min(1, minDepth / 12) * 25);
  factors.push({
    label: "History depth",
    detail: depths.length ? `${minDepth} months on the thinnest feed` : "No time-series history",
    impact: minDepth >= 9 ? "positive" : minDepth <= 3 ? "negative" : "neutral",
  });

  // 3. Cross-source agreement — up to 35 pts; triangulation consistency.
  let agreementPts = f.hasGst ? 35 : 18;
  if (f.hasGst) {
    const gap = Math.abs(f.gstBankTurnoverGap);
    if (gap > 0.5) {
      agreementPts -= 18;
      factors.push({
        label: "GST vs bank",
        detail: `Declared turnover and bank credits diverge ${Math.round(gap * 100)}%`,
        impact: "negative",
      });
    } else if (gap > 0.25) {
      agreementPts -= 8;
      factors.push({
        label: "GST vs bank",
        detail: `Moderate ${Math.round(gap * 100)}% turnover-vs-credit gap`,
        impact: "neutral",
      });
    } else {
      factors.push({
        label: "GST vs bank",
        detail: "Declared turnover reconciles with bank credits",
        impact: "positive",
      });
    }
    if (f.hasPower) {
      const pg = f.turnoverPowerGap;
      if (pg > 0.5) {
        agreementPts -= 12;
        factors.push({
          label: "Power vs turnover",
          detail: `Electricity-implied activity ${Math.round(pg * 100)}% below declared turnover`,
          impact: "negative",
        });
      } else if (pg <= 0.2) {
        factors.push({
          label: "Power vs turnover",
          detail: "Electricity consumption corroborates declared turnover",
          impact: "positive",
        });
      }
    }
  }
  agreementPts = Math.max(0, agreementPts);

  if (!f.hasGst && !f.hasBureau) {
    factors.push({
      label: "Thin file",
      detail: "No GST or bureau — inference leans on bank, UPI and power signals",
      impact: "negative",
    });
  }

  const score = Math.max(0, Math.min(100, completenessPts + depthPts + agreementPts));
  const level: ConfidenceLevel = score >= 75 ? "High" : score >= 50 ? "Medium" : "Low";
  return { level, score, factors };
}
