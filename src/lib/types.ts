// Canonical data contract for IDBI MSME HealthLens.
// Field names are FROZEN — engine outputs MsmeCase in this exact shape.

export type RiskBand = "A" | "B" | "C" | "D";
export type Decision = "Approve" | "Refer" | "Reject";
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
  | "Manual Review";
export type DataSource = "GST" | "AA_BANK" | "UPI" | "EPFO" | "BUREAU" | "POWER";

export interface SubScores {
  // 0–100, or null when the source is missing (show as N/A)
  gst: number | null;
  bank: number | null;
  upi: number | null;
  epfo: number | null;
  compliance: number | null;
  bureau: number | null;
  operations: number | null; // power-consumption / operational-activity signal
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
}

export interface AuditEvent {
  ts: string;
  actor: string;
  action: string;
  detail?: string;
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

  gstTrend: TrendPoint[];
  cashflow: CashflowPoint[];
  upiTrend: UpiPoint[];
  powerConsumption: TrendPoint[]; // monthly electricity units (kWh)
  buyerConcentration: BuyerShare[];

  audit: AuditEvent[];
  scoredInSeconds: number;
}
