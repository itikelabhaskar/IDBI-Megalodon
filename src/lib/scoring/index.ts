// Public surface of the scoring engine.
export { computeFeatures, type FeatureVector } from "./features";
export {
  computeSubScores,
  computeHealthScore,
  creditStyleScore,
  riskBand,
  SUBSCORE_WEIGHTS,
} from "./scorecard";
export { scoreMl, MODEL, type MlModel, type MlResult } from "./ml";
export { reasonCodes, fraudFlags } from "./reasons";
export {
  hardFlags,
  breDecision,
  recommendedLimit,
  detectBusinessNeed,
  routeProduct,
  gemGatesPass,
  pathToCredit,
  evidenceInsufficient,
  schemeReadiness,
  type RoutingResult,
  type HardFlags,
  type SchemeReadiness,
} from "./decision";
export { scoreCase, scoreDataset } from "./score";
export { assessAuthenticity } from "./authenticity";
export { simulateScore, type SimResult } from "./simulate";
