import type { MsmeCase } from "@/lib/types";
import { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface Policy {
  maxBounces: number;
  gstDelayTolerance: number;
  volatilityTolerance: number; // CV cap *100
  gstBankMismatch: number; // % cap
}

const DEFAULT: Policy = {
  maxBounces: 2,
  gstDelayTolerance: 1,
  volatilityTolerance: 35,
  gstBankMismatch: 20,
};

export function PortfolioSimulator({ cases }: { cases: MsmeCase[] }) {
  const [policy, setPolicy] = useState<Policy>(DEFAULT);

  const baseline = useMemo(() => evaluate(cases, DEFAULT), [cases]);
  const result = useMemo(() => evaluate(cases, policy), [cases, policy]);

  const delta = {
    approve: result.approve - baseline.approve,
    refer: result.refer - baseline.refer,
    reject: result.reject - baseline.reject,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      <div className="space-y-4">
        <div className="rounded-md border border-border bg-surface">
          <div className="border-b border-border px-4 py-2.5 text-xs font-semibold">
            Portfolio impact at current thresholds
          </div>
          <div className="grid grid-cols-3 gap-px bg-border">
            <Stat label="Approvals" value={result.approve} delta={delta.approve} tone="positive" />
            <Stat label="Refer" value={result.refer} delta={delta.refer} tone="neutral" />
            <Stat label="Reject" value={result.reject} delta={delta.reject} tone="negative" />
          </div>
        </div>

        <div className="rounded-md border border-border bg-surface">
          <div className="border-b border-border px-4 py-2.5 text-xs font-semibold">
            Distribution by sector
          </div>
          <ul className="divide-y divide-border">
            {result.bySector.map((row) => (
              <li
                key={row.sector}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-2 text-sm"
              >
                <div className="truncate text-foreground">{row.sector}</div>
                <div className="text-xs text-positive tabular-nums">{row.approve} approve</div>
                <div className="text-xs text-band-c tabular-nums">{row.refer} refer</div>
                <div className="text-xs text-negative tabular-nums">{row.reject} reject</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-md border border-border bg-surface">
          <div className="border-b border-border px-4 py-2.5 text-xs font-semibold">
            Top reject reasons
          </div>
          <ul className="divide-y divide-border">
            {result.topRejectReasons.map((r) => (
              <li key={r.label} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="text-foreground">{r.label}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{r.count}</span>
              </li>
            ))}
            {result.topRejectReasons.length === 0 && (
              <li className="px-4 py-3 text-xs text-muted-foreground">
                No reject reasons under current policy.
              </li>
            )}
          </ul>
        </div>
      </div>

      <aside className="rounded-md border border-border bg-surface h-fit">
        <div className="border-b border-border px-4 py-2.5 text-xs font-semibold">
          Policy thresholds
        </div>
        <div className="p-4 space-y-5">
          <SliderRow
            label="Max cheque bounces (12m)"
            value={policy.maxBounces}
            min={0}
            max={6}
            step={1}
            onChange={(v) => setPolicy((p) => ({ ...p, maxBounces: v }))}
          />
          <SliderRow
            label="GST late-filing tolerance (12m)"
            value={policy.gstDelayTolerance}
            min={0}
            max={4}
            step={1}
            onChange={(v) => setPolicy((p) => ({ ...p, gstDelayTolerance: v }))}
          />
          <SliderRow
            label="Bank inflow CV cap"
            suffix={`${(policy.volatilityTolerance / 100).toFixed(2)}`}
            value={policy.volatilityTolerance}
            min={15}
            max={60}
            step={5}
            onChange={(v) => setPolicy((p) => ({ ...p, volatilityTolerance: v }))}
          />
          <SliderRow
            label="GST↔bank mismatch cap (%)"
            value={policy.gstBankMismatch}
            min={5}
            max={50}
            step={5}
            onChange={(v) => setPolicy((p) => ({ ...p, gstBankMismatch: v }))}
          />
          <p className="text-[11px] text-muted-foreground border-t border-border pt-3">
            Policy is applied to the visible portfolio. Production deployment would calibrate
            against sandbox bad-rate.
          </p>
        </div>
      </aside>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-2">
        <Label className="text-foreground">{label}</Label>
        <span className="tabular-nums font-medium text-primary">{suffix ?? value}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: number;
  delta: number;
  tone: "positive" | "negative" | "neutral";
}) {
  const toneCls =
    tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : "text-band-c";
  return (
    <div className="bg-surface px-4 py-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${toneCls}`}>{value}</div>
      <div className="text-[11px] text-muted-foreground">
        {delta === 0 ? "no change" : delta > 0 ? `+${delta} vs baseline` : `${delta} vs baseline`}
      </div>
    </div>
  );
}

/**
 * Re-decision each case against tighter/looser policy thresholds.
 * Pure presentational simulation — does NOT mutate the case data.
 */
function evaluate(cases: MsmeCase[], policy: Policy) {
  let approve = 0;
  let refer = 0;
  let reject = 0;
  const sectorMap = new Map<
    string,
    { sector: string; approve: number; refer: number; reject: number }
  >();
  const rejectReasons = new Map<string, number>();

  for (const c of cases) {
    const decision = applyPolicy(c, policy);
    if (decision === "Approve") approve++;
    else if (decision === "Refer") refer++;
    else reject++;

    const row = sectorMap.get(c.sector) ?? {
      sector: c.sector,
      approve: 0,
      refer: 0,
      reject: 0,
    };
    row[decision === "Approve" ? "approve" : decision === "Refer" ? "refer" : "reject"]++;
    sectorMap.set(c.sector, row);

    if (decision === "Reject") {
      c.reasonCodes
        .filter((r) => r.polarity === "negative")
        .slice(0, 2)
        .forEach((r) => rejectReasons.set(r.label, (rejectReasons.get(r.label) ?? 0) + 1));
    }
  }

  return {
    approve,
    refer,
    reject,
    bySector: Array.from(sectorMap.values()).sort((a, b) => b.approve - a.approve),
    topRejectReasons: Array.from(rejectReasons.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
  };
}

function applyPolicy(c: MsmeCase, p: Policy): "Approve" | "Refer" | "Reject" {
  // Hard rejects: high-severity fraud flags remain rejects.
  if (c.fraudFlags.some((f) => f.severity === "high")) return "Reject";
  // Map proxy signals from reason codes to policy levers (synthetic):
  const bounces = c.reasonCodes
    .find((r) => r.code.startsWith("BANK_BOUNCES"))
    ?.code.match(/\d+/)?.[0];
  if (bounces && Number(bounces) > p.maxBounces) return "Reject";
  const lateFiling = c.reasonCodes
    .find((r) => r.code.startsWith("GST_LATE"))
    ?.code.match(/\d+/)?.[0];
  if (lateFiling && Number(lateFiling) > p.gstDelayTolerance) return "Refer";
  if (c.reasonCodes.some((r) => r.code === "BANK_VOL_HIGH") && p.volatilityTolerance < 40)
    return "Refer";
  if (c.reasonCodes.some((r) => r.code === "GST_BANK_MISMATCH") && p.gstBankMismatch < 30)
    return "Reject";
  return c.decision;
}
