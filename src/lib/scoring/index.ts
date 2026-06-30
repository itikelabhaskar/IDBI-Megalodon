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
  type RoutingResult,
  type HardFlags,
} from "./decision";
export { scoreCase, scoreDataset } from "./score";
