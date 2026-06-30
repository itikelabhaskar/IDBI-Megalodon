import { useMemo, useState } from "react";
import type { FeatureVector } from "@/lib/scoring/features";
import { simulateScore } from "@/lib/scoring/simulate";
import type { SimulatorSeed } from "@/lib/data/dataset";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RiskBandChip } from "./risk-band-chip";
import { DecisionPill } from "./decision-pill";
import { formatInr } from "@/lib/format";
import { ArrowDown, ArrowUp, RotateCcw, SlidersHorizontal } from "lucide-react";

type LeverKey =
  | "gstOnTimeRatio"
  | "gstConcentration"
  | "emiBounceCount"
  | "upiRefundRatio"
  | "debtServiceRatio"
  | "powerTrend";

interface Lever {
  key: LeverKey;
  label: string;
  min: number;
  max: number;
  step: number;
  available: (f: FeatureVector) => boolean;
  fmt: (v: number) => string;
  /** lower value is better for credit? used only for the hint copy */
  betterLow: boolean;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;
const signedPct = (v: number) => `${v >= 0 ? "+" : ""}${Math.round(v * 100)}%`;

const LEVERS: Lever[] = [
  {
    key: "gstOnTimeRatio",
    label: "GST on-time filing",
    min: 0,
    max: 1,
    step: 0.01,
    available: (f) => f.hasGst,
    fmt: pct,
    betterLow: false,
  },
  {
    key: "gstConcentration",
    label: "Top-3 buyer concentration",
    min: 0,
    max: 0.95,
    step: 0.01,
    available: (f) => f.hasGst,
    fmt: pct,
    betterLow: true,
  },
  {
    key: "emiBounceCount",
    label: "EMI / cheque bounces (12m)",
    min: 0,
    max: 12,
    step: 1,
    available: () => true,
    fmt: (v) => String(Math.round(v)),
    betterLow: true,
  },
  {
    key: "upiRefundRatio",
    label: "UPI refund ratio",
    min: 0,
    max: 0.15,
    step: 0.005,
    available: (f) => f.hasUpi,
    fmt: pct,
    betterLow: true,
  },
  {
    key: "debtServiceRatio",
    label: "Debt-service ratio",
    min: 0,
    max: 0.8,
    step: 0.01,
    available: (f) => f.hasBureau,
    fmt: pct,
    betterLow: true,
  },
  {
    key: "powerTrend",
    label: "Power-consumption trend",
    min: -0.4,
    max: 0.4,
    step: 0.01,
    available: (f) => f.hasPower,
    fmt: signedPct,
    betterLow: false,
  },
];

export function WhatIfSimulator({ seed }: { seed: SimulatorSeed }) {
  const { features, ctx, baseline } = seed;
  const levers = useMemo(() => LEVERS.filter((l) => l.available(features)), [features]);
  const [over, setOver] = useState<Partial<Record<LeverKey, number>>>({});

  const current: FeatureVector = useMemo(() => ({ ...features, ...over }), [features, over]);
  const result = useMemo(() => simulateScore(current, ctx), [current, ctx]);

  const dHealth = result.healthScore - baseline.healthScore;
  const dLimit = result.recommendedLimit - baseline.recommendedLimit;
  const dirty = Object.keys(over).length > 0;

  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Decision simulator
            </div>
            <div className="text-sm font-semibold text-foreground">
              What would change this decision?
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOver({})}
          disabled={!dirty}
          className="gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4 p-4">
          {levers.map((l) => {
            const value = current[l.key] as number;
            return (
              <div key={l.key}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground/90">{l.label}</span>
                  <span className="tabular-nums font-medium text-foreground">{l.fmt(value)}</span>
                </div>
                <Slider
                  className="mt-2"
                  min={l.min}
                  max={l.max}
                  step={l.step}
                  value={[value]}
                  onValueChange={([v]) => setOver((o) => ({ ...o, [l.key]: v }))}
                />
              </div>
            );
          })}
          <p className="text-[11px] text-muted-foreground">
            Live recompute through the real sub-score → HealthScore → BRE pipeline. Routing/product
            gates are excluded; this shows the engine&apos;s core yes-go / no-go call.
          </p>
        </div>

        <div className="border-t border-border bg-muted/20 p-4 lg:border-l lg:border-t-0">
          <div className="flex items-center gap-2">
            <DecisionPill decision={result.decision} />
            <RiskBandChip band={result.band} />
            {dirty && result.decision !== baseline.decision && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                was {baseline.decision}
              </span>
            )}
          </div>

          <dl className="mt-3 space-y-2.5">
            <Outcome
              label="HealthScore"
              value={String(result.healthScore)}
              delta={dHealth}
              deltaText={dHealth !== 0 ? `${dHealth > 0 ? "+" : ""}${dHealth}` : undefined}
            />
            <Outcome
              label="Recommended limit"
              value={result.recommendedLimit > 0 ? formatInr(result.recommendedLimit) : "—"}
              delta={dLimit}
              deltaText={dLimit !== 0 ? `${dLimit > 0 ? "+" : ""}${formatInr(dLimit)}` : undefined}
            />
            <Outcome
              label="ML viability"
              value={`${Math.round(result.viability * 100)}%`}
              delta={result.viability - baseline.viability}
            />
          </dl>
        </div>
      </div>
    </div>
  );
}

function Outcome({
  label,
  value,
  delta = 0,
  deltaText,
}: {
  label: string;
  value: string;
  delta?: number;
  deltaText?: string;
}) {
  const tone = delta > 0 ? "text-band-a" : delta < 0 ? "text-band-d" : "text-muted-foreground";
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-1.5 text-sm font-semibold tabular-nums text-foreground">
        {value}
        {deltaText && (
          <span className={`inline-flex items-center gap-0.5 text-[11px] ${tone}`}>
            {delta > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {deltaText}
          </span>
        )}
      </dd>
    </div>
  );
}
