import type { MsmeCase } from "./types";
import { leadQuality, sourceLabel } from "./format";

export type OfficerAction = {
  label: "Export CAM" | "Review route" | "Check fraud" | "Resolve data gap" | "Path to credit";
  description: string;
  rank: number;
};

export type PolicyGateStatus = "Pass" | "Review" | "High concern";

export type PolicyGate = {
  label: string;
  status: PolicyGateStatus;
  detail: string;
};

export type TriangulationVerdict = {
  label: string;
  status: PolicyGateStatus;
  detail: string;
};

export function sourceCoverage(c: MsmeCase) {
  const available = c.dataCompleteness.filter((d) => d.available);
  const missing = c.dataCompleteness.filter((d) => !d.available);
  return {
    available: available.length,
    total: c.dataCompleteness.length,
    missing: missing.map((d) => sourceLabel[d.source] ?? d.source),
  };
}

export function primaryStrength(c: MsmeCase): string {
  const positive = c.reasonCodes.find((r) => r.polarity === "positive");
  if (positive) return positive.label;
  if (c.peerClusterPercentile >= 70) return "Above local peer behaviour benchmark";
  if (leadQuality(c).label === "Inclusion lead")
    return "Thin-file applicant kept in the review path";
  return "Consented sources support a scoreable MSME profile";
}

export function primaryConcern(c: MsmeCase): string {
  const high = c.fraudFlags.find((f) => f.severity === "high");
  if (high) return high.label;
  const productGap = c.reasonCodes.find((r) => r.code === "PRODUCT_ELIGIBILITY_GAP");
  if (productGap) return productGap.label;
  const negative = c.reasonCodes.find((r) => r.polarity === "negative");
  if (negative) return negative.label;
  const coverage = sourceCoverage(c);
  if (coverage.missing.length) return `${coverage.missing.join(" / ")} evidence unavailable`;
  return "No material adverse signal detected";
}

export function missingEvidence(c: MsmeCase): string {
  const missing = sourceCoverage(c).missing;
  return missing.length ? `${missing.join(" / ")} not available` : "Full alternate-data coverage";
}

export function nextOfficerAction(c: MsmeCase): OfficerAction {
  const coverage = sourceCoverage(c);
  if (c.fraudFlags.some((f) => f.severity === "high")) {
    return {
      label: "Check fraud",
      description: "Review triangulation flags before any sanction action",
      rank: 5,
    };
  }
  if (c.decision === "Reject") {
    return {
      label: "Path to credit",
      description: "Share corrective actions and keep the applicant out of straight-through flow",
      rank: 4,
    };
  }
  if (coverage.missing.length >= 2) {
    return {
      label: "Resolve data gap",
      description: `Request ${coverage.missing.slice(0, 2).join(" / ")} evidence before decisioning`,
      rank: 3,
    };
  }
  if (c.decision === "Refer" || c.productRoute === "Manual Review") {
    return {
      label: "Review route",
      description: "Check product eligibility, policy gates and officer override need",
      rank: 2,
    };
  }
  return {
    label: "Export CAM",
    description: "Recommendation is ready for officer review and memo export",
    rank: 1,
  };
}

export function attentionBullets(c: MsmeCase): string[] {
  const bullets = [primaryStrength(c), primaryConcern(c), missingEvidence(c)];
  if (c.ntcNtb) bullets.push("NTC/NTB applicant retained for inclusion review");
  if (c.peerClusterPercentile >= 70) bullets.push("Above local cluster peer percentile");
  const action = nextOfficerAction(c);
  bullets.push(`Next action: ${action.label}`);
  return Array.from(new Set(bullets)).slice(0, 5);
}

export function policyGates(c: MsmeCase): PolicyGate[] {
  const hasReason = (code: string) => c.reasonCodes.some((r) => r.code === code);
  const hasFlag = (code: string) => c.fraudFlags.some((f) => f.code === code);
  return [
    {
      label: "Bounce history",
      status: hasReason("BOUNCE_EXCESSIVE") ? "High concern" : "Pass",
      detail: hasReason("BOUNCE_EXCESSIVE")
        ? "More than 6 EMI/cheque bounces"
        : "No hard bounce trigger",
    },
    {
      label: "Bureau / DSR",
      status: hasReason("BUREAU_STRESSED") ? "Review" : "Pass",
      detail: hasReason("BUREAU_STRESSED")
        ? "Existing EMI load needs officer review"
        : "No bureau stress trigger",
    },
    {
      label: "GST-bank match",
      status: hasFlag("GST_BANK_MISMATCH") ? "High concern" : "Pass",
      detail: hasFlag("GST_BANK_MISMATCH")
        ? "Declared turnover exceeds matching bank credits"
        : "GST and bank credits are within tolerance",
    },
    {
      label: "Power-turnover match",
      status: hasFlag("POWER_TURNOVER_MISMATCH") ? "High concern" : "Pass",
      detail: hasFlag("POWER_TURNOVER_MISMATCH")
        ? "Utility activity below declared turnover"
        : "Utility activity supports operations",
    },
    {
      label: "Product eligibility",
      status: hasReason("PRODUCT_ELIGIBILITY_GAP") ? "Review" : "Pass",
      detail: hasReason("PRODUCT_ELIGIBILITY_GAP")
        ? "Best-fit product gates not fully met"
        : "No product gate exception",
    },
  ];
}

export function triangulationVerdicts(c: MsmeCase): TriangulationVerdict[] {
  const flag = (code: string) => c.fraudFlags.find((f) => f.code === code);
  const warn = (code: string) =>
    c.fraudFlags.find((f) => f.code === code || f.label.includes(code));
  const gstBank = flag("GST_BANK_MISMATCH");
  const power = flag("POWER_TURNOVER_MISMATCH");
  const upi = c.fraudFlags.find((f) => f.code === "UPI_REFUND_SPIKE");
  const payroll = c.fraudFlags.find((f) => f.code === "PAYROLL_DIVERGENCE");
  const purchase = c.fraudFlags.find((f) => f.code === "PURCHASE_SALE_MISMATCH");
  return [
    {
      label: "GST vs bank",
      status: gstBank ? "High concern" : "Pass",
      detail: gstBank?.label ?? "Declared turnover and bank credits align",
    },
    {
      label: "Power vs turnover",
      status: power ? "High concern" : "Pass",
      detail: power?.label ?? "Utility activity supports declared operations",
    },
    {
      label: "Purchase vs sale",
      status: purchase ? "Review" : "Pass",
      detail: purchase?.label ?? "Inward purchases are consistent with declared sales",
    },
    {
      label: "UPI refund quality",
      status: upi ? "Review" : "Pass",
      detail: upi?.label ?? "Refund ratio within review tolerance",
    },
    {
      label: "Payroll consistency",
      status: payroll ? "Review" : "Pass",
      detail: payroll?.label ?? "No payroll divergence flag",
    },
  ];
}

export type SlaState = "On track" | "Due soon" | "Breached";
export interface CaseAgeing {
  receivedAt: string;
  hoursAgo: number;
  sla: SlaState;
}

// Deterministic per-case ageing so the queue shows realistic turnaround pressure
// (the "near real-time" ask implies an SLA). Target: first decision within 24h.
export function caseAgeing(id: string): CaseAgeing {
  const h = [...id].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7);
  const hoursAgo = h % 96; // 0–95h
  const sla: SlaState = hoursAgo <= 24 ? "On track" : hoursAgo <= 48 ? "Due soon" : "Breached";
  const receivedAt = new Date(Date.now() - hoursAgo * 3_600_000).toISOString();
  return { receivedAt, hoursAgo, sla };
}

export function ageingLabel(hoursAgo: number): string {
  if (hoursAgo < 1) return "just now";
  if (hoursAgo < 24) return `${hoursAgo}h ago`;
  const d = Math.floor(hoursAgo / 24);
  const h = hoursAgo % 24;
  return h ? `${d}d ${h}h ago` : `${d}d ago`;
}
