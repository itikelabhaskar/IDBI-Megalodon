import type { RiskBand, Decision } from "./types";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrCompact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatInr(value: number): string {
  return inrFormatter.format(value);
}

export function formatInrCompact(value: number): string {
  // e.g. ₹12.5L, ₹1.2Cr — Intl handles Indian compact units.
  return inrCompact.format(value);
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
  BUREAU: "Bureau",
};
