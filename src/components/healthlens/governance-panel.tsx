import type { MsmeCase } from "@/lib/types";
import { useState } from "react";
import { AuditTimeline } from "./audit-timeline";
import { formatDateTime } from "@/lib/format";
import {
  championChallenger,
  creditInvisibleLift,
  fairnessSlices,
  reconciliationRates,
  topRejectReasons,
} from "@/lib/analytics/portfolio";
import { ablationSummary } from "@/lib/analytics/ablation";
import { RAIL_STATUS } from "@/lib/connectors/rail-status";
import { MODEL } from "@/lib/scoring/ml";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

export function GovernancePanel({ cases }: { cases: MsmeCase[] }) {
  const [tab, setTab] = useState<"overview" | "model" | "fairness" | "consent" | "overrides">(
    "overview",
  );
  // Aggregate metrics
  const total = cases.length;
  const decisions = cases.reduce(
    (acc, c) => {
      acc[c.decision] = (acc[c.decision] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const distribution = (["A", "B", "C", "D"] as const).map((b) => ({
    band: `Band ${b}`,
    count: cases.filter((c) => c.riskBand === b).length,
    color: `var(--color-band-${b.toLowerCase()})`,
  }));

  // Governance analytics (computed on the full synthetic population)
  const cc = championChallenger();
  const lift = creditInvisibleLift(cases);
  const recon = reconciliationRates(cases);
  const ablation = ablationSummary(cases);
  const fairness = fairnessSlices();
  const rejectReasons = topRejectReasons();

  const overrides = cases.flatMap((c) =>
    c.audit.filter((a) => a.action.toLowerCase().includes("override")),
  );
  const consentLogs = cases.flatMap((c) =>
    c.audit
      .filter((a) => a.action.toLowerCase().includes("consent"))
      .map((a) => ({ ...a, caseId: c.id })),
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Cases scored" value={String(total)} sub="Last 7 days (synthetic book)" />
        <KpiCard
          title="Approvals"
          value={`${decisions.Approve ?? 0}`}
          sub={`${decisions.Refer ?? 0} refer · ${decisions.Incomplete ?? 0} incomplete · ${decisions.Reject ?? 0} reject`}
        />
        <KpiCard
          title="Median score-time"
          value={`${(cases.reduce((s, c) => s + c.scoredInSeconds, 0) / Math.max(1, total)).toFixed(1)}s`}
          sub="Per case, end-to-end fetch + score"
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-1 rounded-md bg-muted p-1">
          {(
            [
              ["overview", "Overview"],
              ["model", "Model"],
              ["fairness", "Fairness"],
              ["consent", "Consent"],
              ["overrides", "Overrides"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === value
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="space-y-4">
            <div className="rounded-md border border-band-a/30 bg-band-a/5 p-4">
              <div className="text-xs uppercase tracking-widest text-band-a font-semibold">
                Champion vs challenger — inclusion without diluting asset quality
              </div>
              <p className="mt-1 text-sm text-foreground/90">
                A traditional document/bureau baseline rejects{" "}
                <span className="font-semibold">{cc.rescued}</span> viable thin-file MSMEs (
                <span className="font-semibold">{cc.rescuedPct}%</span> of the thin-file pool) that
                HealthLens routes back into the funnel — while the simulated bad-rate among
                HealthLens approvals stays at{" "}
                <span className="font-semibold">{cc.healthLensApprovedBadRate}%</span>.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Metric
                  label="HealthLens approvals"
                  value={String(cc.healthLensApprovals)}
                  sub={`simulated bad-rate ${cc.healthLensApprovedBadRate}%`}
                />
                <Metric
                  label="Traditional approvals"
                  value={String(cc.traditionalApprovals)}
                  sub={`simulated bad-rate ${cc.traditionalApprovedBadRate}%`}
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground italic">
                Indicative figures on synthetic data; bad-rate uses hidden outcome labels. Live
                thresholds would be set on bank-labelled books.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Metric
                label="Credit-invisible lift"
                value={`${lift.inclusionLiftPct}%`}
                sub={`${lift.keptInFunnel}/${lift.ntcCount || 1} NTC kept out of Reject`}
              />
              <Metric
                label="GST–bank mismatch"
                value={`${recon.gstBankMismatchPct}%`}
                sub={`${recon.gstBankMismatchCount} cases · portfolio recon`}
              />
              <Metric
                label="Power–turnover mismatch"
                value={`${recon.powerTurnoverMismatchPct}%`}
                sub={`${recon.powerTurnoverMismatchCount} cases · portfolio recon`}
              />
            </div>

            <Panel title="Ablation & anti-gaming (synthetic book)">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Metric label="Full HealthScore μ" value={String(ablation.meanFullScore)} />
                <Metric
                  label="Structured-only μ"
                  value={String(ablation.meanStructuredOnly)}
                  sub={`Δ ${ablation.meanDelta > 0 ? "+" : ""}${ablation.meanDelta}`}
                />
                <Metric label="FRAUD_SUSPECT catch" value={`${ablation.fraudSuspectCatchRate}%`} />
                <Metric
                  label="High-flag → Reject"
                  value={`${ablation.highFraudFlagCatchRate}%`}
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">{ablation.note}</p>
            </Panel>

            <Panel title="Connector rails — Synthetic in this build">
              <ul className="space-y-1.5 text-sm">
                {RAIL_STATUS.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-1.5 last:border-0"
                  >
                    <span className="text-foreground/90">
                      {r.label}
                      <span className="text-muted-foreground"> · {r.schemaNote}</span>
                    </span>
                    <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {r.mode} · synthetic
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Risk-band distribution">
              <RiskDistributionChart data={distribution} />
            </Panel>
          </div>
        )}

        {tab === "model" && (
          <Panel title="Model card — viability scorecard">
            <dl className="grid grid-cols-2 gap-y-1 text-sm">
              <Dt label="Owner" value="MSME Risk Analytics" />
              <Dt label="Inputs" value="GST · AA bank · UPI · EPFO · Power · Fuel · Bureau-lite" />
              <Dt label="Label" value="Synthetic default (leakage-free)" />
              <Dt label="AUC (held-out, synthetic)" value={MODEL.metrics.auc.toFixed(3)} />
              <Dt
                label="KS / Gini"
                value={`${MODEL.metrics.ks.toFixed(2)} / ${MODEL.metrics.gini.toFixed(2)}`}
              />
              <Dt label="Train / test" value={`${MODEL.metrics.trainN} / ${MODEL.metrics.testN}`} />
              <Dt label="Decision tier" value="Advisory — IDBI officer accepts/overrides" />
              <Dt label="Data note" value="Held-out metrics on synthetic labels only" />
            </dl>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Metrics are illustrative on synthetic data only — see docs/model-card.md. Not a
              production AUC claim.
            </p>
          </Panel>
        )}

        {tab === "fairness" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Panel title="Segment fairness — approval rate">
              <ul className="space-y-1.5 text-sm">
                {fairness.map((s) => (
                  <li key={s.segment} className="flex items-center justify-between gap-3">
                    <span className="text-foreground/90">
                      {s.segment}
                      <span className="text-muted-foreground"> · n={s.n}</span>
                    </span>
                    <span className="font-semibold tabular-nums">{s.approvalRate}%</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Top reject / refer reasons">
              <ul className="space-y-1.5 text-sm">
                {rejectReasons.map((r) => (
                  <li key={r.code} className="flex items-start justify-between gap-3">
                    <span className="text-foreground/90">{r.label}</span>
                    <span className="font-semibold tabular-nums text-muted-foreground">
                      {r.count}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        )}

        {tab === "consent" && (
          <Panel title="Consent log (last 10)">
            <ul className="space-y-1.5 text-xs">
              {consentLogs.slice(0, 10).map((c, i) => (
                <li
                  key={i}
                  className="flex items-start justify-between gap-3 border-b border-border pb-1.5"
                >
                  <div>
                    <div className="font-medium text-foreground">{c.action}</div>
                    <div className="text-muted-foreground">
                      Case {c.caseId} {c.detail ? `· ${c.detail}` : ""}
                    </div>
                  </div>
                  <div className="text-muted-foreground tabular-nums whitespace-nowrap">
                    {formatDateTime(c.ts)}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {tab === "overrides" && (
          <Panel title="Override history">
            {overrides.length === 0 ? (
              <p className="text-sm text-muted-foreground">No officer overrides recorded yet.</p>
            ) : (
              <AuditTimeline events={overrides} />
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}

function RiskDistributionChart({
  data,
}: {
  data: { band: string; count: number; color: string }[];
}) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="band" stroke="var(--color-muted-foreground)" fontSize={11} />
          <YAxis
            allowDecimals={false}
            stroke="var(--color-muted-foreground)"
            fontSize={11}
            width={32}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              fontSize: 12,
            }}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.band} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="border-b border-border px-4 py-2.5 text-xs font-semibold text-foreground/80">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function KpiCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{title}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-border bg-surface/60 p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-lg font-bold tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Dt({ label, value }: { label: string; value: string }) {
  return (
    <div className="contents">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-foreground text-xs">{value}</dd>
    </div>
  );
}
