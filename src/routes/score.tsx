import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { FeatureVector } from "@/lib/scoring/features";
import type { ScoreCtx } from "@/lib/scoring/scorecard";
import { simulateScore } from "@/lib/scoring/simulate";
import { creditStyleScore } from "@/lib/scoring/scorecard";
import { reasonCodes, fraudFlags } from "@/lib/scoring/reasons";
import { RiskBandChip } from "@/components/healthlens/risk-band-chip";
import { DecisionPill } from "@/components/healthlens/decision-pill";
import { formatInr, goNoGo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Gauge, Zap, RefreshCw, Sparkles } from "lucide-react";

export const Route = createFileRoute("/score")({
  head: () => ({
    meta: [
      { title: "Score new applicant · IDBI MSME HealthLens" },
      {
        name: "description",
        content: "Score a fresh MSME applicant from alternate-data inputs in real time.",
      },
    ],
  }),
  component: ScorePage,
});

interface FormState {
  hasGst: boolean;
  hasUpi: boolean;
  hasEpfo: boolean;
  hasBureau: boolean;
  hasPower: boolean;
  hasUdyam: boolean;
  gstTurnover: number;
  gstOnTime: number;
  bankCredit: number;
  volatility: number;
  bounces: number;
  upiTrend: number;
  upiRefund: number;
  powerTrend: number;
  dpdDays: number;
  debtService: number;
  concentration: number;
}

const DEFAULTS: FormState = {
  hasGst: true,
  hasUpi: true,
  hasEpfo: true,
  hasBureau: true,
  hasPower: true,
  hasUdyam: true,
  gstTurnover: 1_800_000,
  gstOnTime: 0.95,
  bankCredit: 1_700_000,
  volatility: 0.18,
  bounces: 0,
  upiTrend: 0.12,
  upiRefund: 0.015,
  powerTrend: 0.08,
  dpdDays: 0,
  debtService: 0.15,
  concentration: 0.35,
};

function buildFeatures(s: FormState): FeatureVector {
  const gstBankTurnoverGap =
    s.hasGst && s.gstTurnover > 0 ? (s.gstTurnover - s.bankCredit) / s.gstTurnover : 0;
  const powerAvg = (s.gstTurnover / 100_000) * 42;
  return {
    hasGst: s.hasGst,
    hasUpi: s.hasUpi,
    hasEpfo: s.hasEpfo,
    hasBureau: s.hasBureau,
    gstMonthlyTurnoverAvg: s.hasGst ? s.gstTurnover : 0,
    gstTurnoverCov: s.volatility,
    gstOnTimeRatio: s.hasGst ? s.gstOnTime : 0,
    gstZeroReturnRatio: 0,
    gstConcentration: s.concentration,
    hasPurchaseData: s.hasGst,
    purchaseToSaleRatio: 0.7,
    bankMonthlyCreditAvg: s.bankCredit,
    bankCreditVolatility: s.volatility,
    emiBounceCount: s.bounces,
    negativeBalanceDaysRatio: 0.02,
    cashVsDigitalRatio: 0.1,
    hasCircular: false,
    upiTrend: s.hasUpi ? s.upiTrend : 0,
    upiRefundRatio: s.hasUpi ? s.upiRefund : 0,
    upiConcentration: 0.1,
    epfoMissingMonthRatio: s.hasEpfo ? 0.05 : 0,
    epfoEmployeeGrowth: 0.03,
    debtServiceRatio: s.hasBureau ? s.debtService : 0,
    dpdDays: s.hasBureau ? s.dpdDays : 0,
    hasPower: s.hasPower,
    powerConsumptionAvg: s.hasPower ? powerAvg : 0,
    powerTrend: s.hasPower ? s.powerTrend : 0,
    powerImpliedTurnover: s.hasPower ? powerAvg * 2600 : 0,
    turnoverPowerGap: 0,
    hasFuel: false,
    fuelSpendAvg: 0,
    fuelTrend: 0,
    fuelImpliedActivity: 0,
    fuelTurnoverGap: 0,
    gstBankTurnoverGap,
    seasonalSectorFlag: false,
  };
}

function ScorePage() {
  const [s, setS] = useState<FormState>(DEFAULTS);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setS((prev) => ({ ...prev, [k]: v }));

  const { result, reasons, flags, ctx } = useMemo(() => {
    const f = buildFeatures(s);
    const context: ScoreCtx = {
      hasUdyam: s.hasUdyam,
      availableSources: [s.hasGst, s.hasUpi, s.hasEpfo, s.hasBureau, s.hasPower, true].filter(
        Boolean,
      ).length,
    };
    return {
      result: simulateScore(f, context),
      reasons: reasonCodes(f),
      flags: fraudFlags(f),
      ctx: context,
    };
  }, [s]);

  const verdict = goNoGo[result.decision];

  return (
    <div className="p-4 md:p-6 space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Near real-time scoring
          </div>
          <h1 className="mt-1 text-xl font-semibold text-foreground">Score a new applicant</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Enter a fresh MSME's alternate-data signals — the same engine scores it instantly.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setS(DEFAULTS)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <RefreshCw className="h-4 w-4" />
          Reset
        </button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        {/* Inputs */}
        <section className="rounded-md border border-border bg-surface p-4 space-y-4">
          <div>
            <div className="mb-2 text-xs font-semibold text-foreground">Consented data sources</div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["hasGst", "GST"],
                  ["hasUpi", "UPI"],
                  ["hasEpfo", "EPFO"],
                  ["hasBureau", "Bureau"],
                  ["hasPower", "Power"],
                  ["hasUdyam", "Udyam"],
                ] as [keyof FormState, string][]
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => set(k, !s[k] as never)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    s[k]
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <NumberField
            label="Monthly GST turnover (₹)"
            value={s.gstTurnover}
            step={50_000}
            onChange={(v) => set("gstTurnover", v)}
            disabled={!s.hasGst}
          />
          <NumberField
            label="Monthly bank credits (₹)"
            value={s.bankCredit}
            step={50_000}
            onChange={(v) => set("bankCredit", v)}
          />
          <SliderField
            label="GST on-time filing"
            value={s.gstOnTime}
            min={0}
            max={1}
            step={0.05}
            fmt={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => set("gstOnTime", v)}
            disabled={!s.hasGst}
          />
          <SliderField
            label="Cash-flow volatility"
            value={s.volatility}
            min={0}
            max={0.8}
            step={0.02}
            fmt={(v) => v.toFixed(2)}
            onChange={(v) => set("volatility", v)}
          />
          <SliderField
            label="EMI / cheque bounces (12m)"
            value={s.bounces}
            min={0}
            max={12}
            step={1}
            fmt={(v) => String(v)}
            onChange={(v) => set("bounces", v)}
          />
          <SliderField
            label="Buyer concentration (top 3)"
            value={s.concentration}
            min={0.1}
            max={0.95}
            step={0.05}
            fmt={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => set("concentration", v)}
            disabled={!s.hasGst}
          />
          <SliderField
            label="UPI momentum"
            value={s.upiTrend}
            min={-0.3}
            max={0.5}
            step={0.02}
            fmt={(v) => `${v > 0 ? "+" : ""}${Math.round(v * 100)}%`}
            onChange={(v) => set("upiTrend", v)}
            disabled={!s.hasUpi}
          />
          <SliderField
            label="Power-consumption momentum"
            value={s.powerTrend}
            min={-0.4}
            max={0.4}
            step={0.02}
            fmt={(v) => `${v > 0 ? "+" : ""}${Math.round(v * 100)}%`}
            onChange={(v) => set("powerTrend", v)}
            disabled={!s.hasPower}
          />
          <SliderField
            label="Debt-service ratio"
            value={s.debtService}
            min={0}
            max={0.8}
            step={0.02}
            fmt={(v) => v.toFixed(2)}
            onChange={(v) => set("debtService", v)}
            disabled={!s.hasBureau}
          />
          <SliderField
            label="Worst DPD (days)"
            value={s.dpdDays}
            min={0}
            max={90}
            step={30}
            fmt={(v) => `${v}d`}
            onChange={(v) => set("dpdDays", v)}
            disabled={!s.hasBureau}
          />
        </section>

        {/* Live result */}
        <section className="space-y-3 lg:sticky lg:top-4 self-start">
          <div className="rounded-md border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                <Gauge className="h-3.5 w-3.5 text-primary" />
                HealthScore
              </div>
              <RiskBandChip band={result.band} size="md" />
            </div>
            <div className="mt-1 flex items-end gap-3">
              <span
                className={cn(
                  "text-5xl font-bold tabular-nums",
                  `text-band-${result.band.toLowerCase()}`,
                )}
              >
                {result.healthScore}
              </span>
              <span className="pb-1.5 text-sm text-muted-foreground">/ 100</span>
              <div className="ml-auto pb-1 text-right">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Credit-style
                </div>
                <div className="text-lg font-semibold tabular-nums text-foreground">
                  {creditStyleScore(result.healthScore)}
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <DecisionPill decision={result.decision} variant="solid" size="md" />
              <span className="text-xs text-muted-foreground">{verdict.hint}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <Stat label="Recommended limit" value={formatInr(result.recommendedLimit)} />
              <Stat label="ML viability" value={`${Math.round(result.viability * 100)}%`} />
              <Stat label="Sources used" value={`${ctx.availableSources}/6`} />
              <Stat label="Fraud flags" value={String(flags.length)} />
            </div>
          </div>

          <div className="rounded-md border border-border bg-surface p-4">
            <div className="mb-2 text-xs font-semibold text-foreground">Sub-scores</div>
            <div className="space-y-1.5">
              {(
                [
                  ["GST", result.subScores.gst],
                  ["Bank cash-flow", result.subScores.bank],
                  ["UPI", result.subScores.upi],
                  ["EPFO", result.subScores.epfo],
                  ["Power / fuel operations", result.subScores.operations],
                  ["Compliance", result.subScores.compliance],
                  ["Bureau-lite", result.subScores.bureau],
                ] as [string, number | null][]
              ).map(([label, v]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-32 shrink-0 text-[11px] text-muted-foreground">{label}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    {v !== null && (
                      <div className="h-full rounded-full bg-primary" style={{ width: `${v}%` }} />
                    )}
                  </div>
                  <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-foreground">
                    {v ?? "N/A"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {(reasons.length > 0 || flags.length > 0) && (
            <div className="rounded-md border border-border bg-surface p-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Zap className="h-3.5 w-3.5 text-primary" />
                Why this score
              </div>
              <div className="space-y-1">
                {flags.map((fl) => (
                  <div key={fl.code} className="text-[11px] text-band-d">
                    ⚠ {fl.label}
                  </div>
                ))}
                {reasons.slice(0, 6).map((r) => (
                  <div
                    key={r.code}
                    className={cn(
                      "text-[11px]",
                      r.polarity === "positive" ? "text-positive" : "text-muted-foreground",
                    )}
                  >
                    {r.polarity === "positive" ? "+" : "–"} {r.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  );
}

function NumberField({
  label,
  value,
  step,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  step: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className={cn("block", disabled && "opacity-50")}>
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm tabular-nums focus:border-primary focus:outline-none"
      />
    </label>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  fmt,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  fmt: (v: number) => string;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className={cn("block", disabled && "opacity-50")}>
      <span className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
        {label}
        <span className="tabular-nums text-foreground">{fmt(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full accent-primary"
      />
    </label>
  );
}
