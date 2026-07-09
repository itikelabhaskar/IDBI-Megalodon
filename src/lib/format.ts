import type { RiskBand, Decision, MsmeCase } from "./types";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatInr(value: number): string {
  return inrFormatter.format(value);
}

// Deterministic Indian compact currency (₹..K / ₹..L / ₹..Cr). Hand-rolled
// rather than Intl `notation: "compact"` because ICU formats round values
// inconsistently between Node (SSR) and the browser (e.g. "₹90.0L" vs "₹90L"),
// which causes React hydration mismatches.
export function formatInrCompact(value: number): string {
  const sign = value < 0 ? "-" : "";
  const v = Math.abs(value);
  const fmt = (n: number, suffix: string) => `${sign}₹${n.toFixed(1).replace(/\.0$/, "")}${suffix}`;
  if (v >= 1e7) return fmt(v / 1e7, "Cr");
  if (v >= 1e5) return fmt(v / 1e5, "L");
  if (v >= 1e3) return fmt(v / 1e3, "K");
  return `${sign}₹${Math.round(v)}`;
}

export function formatPercent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPeriod(period: string): string {
  // "2025-04" -> "Apr '25"
  const [y, m] = period.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export const bandTokenBg: Record<RiskBand, string> = {
  A: "bg-band-a/15 text-band-a border-band-a/30",
  B: "bg-band-b/15 text-band-b border-band-b/30",
  C: "bg-band-c/15 text-band-c border-band-c/30",
  D: "bg-band-d/15 text-band-d border-band-d/30",
};

export const bandSolid: Record<RiskBand, string> = {
  A: "bg-band-a text-white",
  B: "bg-band-b text-white",
  C: "bg-band-c text-white",
  D: "bg-band-d text-white",
};

export const bandHex: Record<RiskBand, string> = {
  A: "#10b981",
  B: "#0ea5e9",
  C: "#f59e0b",
  D: "#ef4444",
};

export const decisionTone: Record<Decision, string> = {
  Approve: "bg-band-a/15 text-band-a border-band-a/30",
  Refer: "bg-band-c/15 text-band-c border-band-c/30",
  Reject: "bg-band-d/15 text-band-d border-band-d/30",
};

// Loud, filled variant for the single most important output — the credit decision.
export const decisionToneSolid: Record<Decision, string> = {
  Approve: "bg-band-a text-white border-band-a shadow-sm",
  Refer: "bg-band-c text-black/85 border-band-c shadow-sm",
  Reject: "bg-band-d text-white border-band-d shadow-sm",
};

// IDBI's AMA framing of the recommendation as a "yes-go / no-go" call, driven by
// the applicant's observed behaviour pattern.
export const goNoGo: Record<Decision, { label: string; hint: string }> = {
  Approve: { label: "Go", hint: "Behaviour pattern supports straight-through processing" },
  Refer: { label: "Conditional", hint: "Mixed behaviour pattern — refer for officer review" },
  Reject: { label: "No-Go", hint: "Behaviour pattern fails policy / fraud gates" },
};

export const sourceLabel: Record<string, string> = {
  GST: "GST",
  AA_BANK: "AA Bank",
  UPI: "UPI",
  EPFO: "EPFO",
  POWER: "Power",
  FUEL: "Fuel",
  BUREAU: "Bureau",
};

export type LeadQuality = {
  label: "Priority lead" | "Inclusion lead" | "Review lead" | "Watchlist";
  description: string;
  rank: number;
};

export function leadQuality(c: MsmeCase): LeadQuality {
  const highFraud = c.fraudFlags.some((f) => f.severity === "high");
  if (c.decision === "Reject" || highFraud) {
    return {
      label: "Watchlist",
      description: "No-Go or high-risk signal; needs path-to-credit / fraud review",
      rank: 0,
    };
  }
  if (c.ntcNtb) {
    return {
      label: "Inclusion lead",
      description: "Credit-invisible MSME kept in the officer review path",
      rank: 2,
    };
  }
  if (c.decision === "Approve" && c.healthScore >= 80 && c.peerClusterPercentile >= 60) {
    return {
      label: "Priority lead",
      description: "Go recommendation with above-cluster behaviour pattern",
      rank: 3,
    };
  }
  return {
    label: "Review lead",
    description: "Viable lead with conditions or officer checks",
    rank: 1,
  };
}
