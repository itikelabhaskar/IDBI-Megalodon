// Canonical data contract for IDBI MSME HealthLens.
// Field names are FROZEN — engine outputs MsmeCase in this exact shape.

export type RiskBand = "A" | "B" | "C" | "D";
export type Decision = "Approve" | "Refer" | "Reject" | "Incomplete";
export type BusinessNeed =
  | "WorkingCapital"
  | "POFinance"
  | "RenewalReview"
  | "LimitEnhancement"
  | "ManualReview"
  | "PathToCredit";
export type ProductRoute =
  | "i-MSME Express"
  | "i-Prompt Renewal"
  | "GeM Sahay"
  | "CGTMSE"
  | "Digital MSME Onboarding"
  | "Manual Review"
  | "Mudra"
  | "SVANidhi";
export type DataSource = "GST" | "AA_BANK" | "UPI" | "EPFO" | "BUREAU" | "POWER" | "FUEL";

/** Operational authenticity band for power/fuel corroboration (HealthLens naming). */
export type AuthenticityBand = "Strong" | "Adequate" | "Weak" | "Unavailable";

export interface AuthenticityAssessment {
  band: AuthenticityBand;
  powerBand: AuthenticityBand;
  fuelBand: AuthenticityBand;
  summary: string;
}

export interface SubScores {
  // 0–100, or null when the source is missing (show as N/A)
  gst: number | null;
  bank: number | null;
  upi: number | null;
  epfo: number | null;
  compliance: number | null;
  bureau: number | null;
  operations: number | null; // power/fuel-consumption / operational-activity signal
}

export interface ReasonCode {
  code: string;
  polarity: "positive" | "negative";
  label: string;
}

export interface Contribution {
  feature: string;
  label: string;
  weight: number; // signed −1..1, explains mlProbabilityProxy ONLY
}

export interface DataCompleteness {
  source: DataSource;
  available: boolean;
  monthsCovered?: number;
}

export interface FraudFlag {
  code: string;
  severity: "info" | "warn" | "high";
  label: string;
}

export interface TrendPoint {
  period: string;
  value: number;
}

export interface CashflowPoint {
  period: string;
  inflow: number;
  outflow: number;
  closingBalance: number;
}

export interface UpiPoint {
  period: string;
  inValue: number;
  inCount: number;
  refundRatio: number;
}

export interface BuyerShare {
  name: string;
  share: number; // 0–1
}

export interface PathToCreditAction {
  action: string;
  rationale: string;
  /** Optional scheme id when this action is part of scheme readiness coaching. */
  scheme?: string;
  /** What's still missing for that scheme (officer-facing checklist). */
  gaps?: string[];
}

export interface AuditEvent {
  ts: string;
  actor: string;
  action: string;
  detail?: string;
  hash?: string; // tamper-evident chain: hash of this event + prevHash
  prevHash?: string; // hash of the previous event ("GENESIS" for the first)
}

export type ConfidenceLevel = "High" | "Medium" | "Low";

export interface ConfidenceFactor {
  label: string;
  detail: string;
  impact: "positive" | "negative" | "neutral";
}

// How much an officer should trust this assessment, independent of WHETHER it is a
// good or bad credit. Built from data completeness, recency, and cross-source
// agreement — NOT a credit-quality signal.
export interface ConfidenceAssessment {
  level: ConfidenceLevel;
  score: number; // 0–100
  factors: ConfidenceFactor[];
}

export type ClusterRiskBand = "Low" | "Moderate" | "Elevated" | "High";

// Geospatial cluster benchmark — turns the clusterCity label into a real,
// peer-relative risk index derived from the HealthScore distribution of MSMEs in
// the same cluster (no outcome labels are used).
export interface ClusterRisk {
  cluster: string;
  index: number; // 0–100, higher = riskier cluster
  band: ClusterRiskBand;
  peerCount: number;
  avgHealthScore: number;
}

export interface BenfordDigit {
  digit: number; // 1–9
  observed: number; // 0–1 share of leading digit
  expected: number; // 0–1 Benford expectation
}

// Statistical fraud-screen analytics over the bank feed — replaces the old
// sentinel-value circular-flow hack with measurable signals.
export interface FraudAnalytics {
  reversedPairCount: number; // matched in/out pairs that net to ~zero (round-tripping)
  reversedPairValue: number; // ₹ value cycled through reversed pairs
  roundAmountRatio: number; // 0–1 share of credits that are suspiciously round
  benfordDeviation: number; // mean absolute deviation of leading-digit dist from Benford
  benford: BenfordDigit[];
}

export interface MsmeCase {
  id: string;
  legalName: string;
  constitution: string;
  sector: string;
  clusterCity: string;
  gstin: string | null;
  udyamId: string | null;
  vintageMonths: number;
  womenOwned: boolean;
  ntcNtb: boolean;
  existingIdbiCustomer: boolean;
  requestedAmount: number;

  healthScore: number; // 0–100  (PRIMARY score that drives the decision)
  creditStyleScore: number; // 300–900
  riskBand: RiskBand;
  subScores: SubScores;
  mlProbabilityProxy: number; // 0–1 (secondary AI signal)
  contributions: Contribution[]; // explains mlProbabilityProxy ONLY
  confidence: ConfidenceAssessment; // trust in the assessment (completeness/recency/agreement)
  authenticity: AuthenticityAssessment; // power/fuel sector authenticity band

  decision: Decision;
  recommendedLimit: number; // rupees, capped 2,500,000
  tenorMonths: number;
  detectedBusinessNeed: BusinessNeed;
  productRoute: ProductRoute;
  productRouteReason: string;

  reasonCodes: ReasonCode[];
  fraudFlags: FraudFlag[];
  pathToCredit: PathToCreditAction[];

  dataCompleteness: DataCompleteness[];
  peerClusterPercentile: number; // 0–100
  clusterRisk: ClusterRisk; // geospatial cluster benchmark
  fraudAnalytics: FraudAnalytics; // statistical fraud-screen metrics

  gstTrend: TrendPoint[];
  cashflow: CashflowPoint[];
  upiTrend: UpiPoint[];
  powerConsumption: TrendPoint[]; // monthly electricity units (kWh)
  fuelConsumption: TrendPoint[]; // monthly fuel / operational spend proxy (₹)
  buyerConcentration: BuyerShare[];
  /** Mean top-counterparty share from UPI months (0–1), null when no UPI rail. */
  upiTopCounterpartyShare: number | null;

  audit: AuditEvent[];
  scoredInSeconds: number;
}
