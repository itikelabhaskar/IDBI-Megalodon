// Lightweight ML viability scorecard.
//
// A transparent logistic model over standardised features predicts the
// probability of default; `mlProbabilityProxy` is reported as VIABILITY
// (1 − P(default)) so higher = better, matching the demo convention.
//
// For a linear model the per-feature contribution is EXACT (weight × standardised
// value) — an honest additive explanation, not a SHAP approximation. The bars on
// the Explainability screen explain THIS probability only, never the HealthScore.
//
// Coefficients are FITTED on the synthetic train split (npm run train) with
// monotonic sign constraints and persisted in model.json; AUC/KS/Gini live in
// the model card. Term definitions (label / accessors / sign) live in ml-terms.ts.

import type { Contribution } from "../types";
import type { FeatureVector } from "./features";
import { TERM_DEFS } from "./ml-terms";
import fitted from "./model.json";

export interface ModelTerm {
  key: string;
  label: string;
  value: (f: FeatureVector) => number;
  available: (f: FeatureVector) => boolean;
  mean: number;
  std: number;
  weight: number; // sign points toward DEFAULT (positive ⇒ more likely to default)
}

export interface ModelMetrics {
  auc: number;
  ks: number;
  gini: number;
  trainN: number;
  testN: number;
  defaultRateTrain: number;
}

export interface MlModel {
  intercept: number;
  terms: ModelTerm[];
  metrics: ModelMetrics;
}

const fittedTerms = fitted.terms as Record<string, { mean: number; std: number; weight: number }>;

export const MODEL: MlModel = {
  intercept: fitted.intercept,
  metrics: fitted.metrics,
  terms: TERM_DEFS.map((t) => {
    const p = fittedTerms[t.key];
    return {
      key: t.key,
      label: t.label,
      value: t.value,
      available: t.available,
      mean: p.mean,
      std: p.std,
      weight: p.weight,
    };
  }),
};

const sigmoid = (z: number): number => 1 / (1 + Math.exp(-z));

export interface MlResult {
  viability: number; // 0–1, higher = better
  contributions: Contribution[]; // explains viability only
}

export function scoreMl(f: FeatureVector, model: MlModel = MODEL): MlResult {
  let logit = model.intercept;
  const raw: Contribution[] = [];
  for (const t of model.terms) {
    // missing feature ⇒ impute the mean (standardised value 0, no contribution)
    const z = t.available(f) ? (t.value(f) - t.mean) / t.std : 0;
    const termLogit = t.weight * z;
    logit += termLogit;
    // contribution to VIABILITY is the negative of the contribution to default
    raw.push({ feature: t.key, label: t.label, weight: -termLogit });
  }
  const pDefault = sigmoid(logit);
  const contributions = raw
    .filter((c) => Math.abs(c.weight) > 1e-6)
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    .slice(0, 6)
    .map((c) => ({ ...c, weight: Math.round(c.weight * 1000) / 1000 }));
  return { viability: 1 - pDefault, contributions };
}
