// Runtime loader for the gradient-boosted CHALLENGER. Loads the fitted forest
// from gbm-model.json and scores a feature vector. Used by the governance
// calibration/champion-challenger analytics — never in the live decision path
// (the logistic champion + BRE remain the control).

import type { FeatureVector } from "./features";
import { TERM_DEFS } from "./ml-terms";
import type { GbmModel } from "./gbm-core";
import { predictPDefault } from "./gbm-core";
import fitted from "./gbm-model.json";

export const MODEL_GBM = fitted as unknown as GbmModel;

export interface GbmResult {
  pDefault: number; // 0–1 probability of default
  viability: number; // 1 − pDefault
}

export function scoreGbm(f: FeatureVector, model: GbmModel = MODEL_GBM): GbmResult {
  const x = TERM_DEFS.map((t, j) => (t.available(f) ? t.value(f) : model.impute[j]));
  const pDefault = predictPDefault(model, x);
  return { pDefault, viability: 1 - pDefault };
}
