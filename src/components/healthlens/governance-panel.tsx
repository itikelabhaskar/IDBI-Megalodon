import type { MsmeCase } from "@/lib/types";
import { AuditTimeline } from "./audit-timeline";
import { formatDateTime } from "@/lib/format";
import { championChallenger, fairnessSlices, topRejectReasons } from "@/lib/analytics/portfolio";
import { MODEL } from "@/lib/scoring/ml";
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
        <KpiCard title="Cases scored" value={String(total)} sub="Last 7 days (prototype)" />
        <KpiCard
          title="Approvals"
          value={`${decisions.Approve ?? 0}`}
          sub={`${decisions.Refer ?? 0} refer · ${decisions.Reject ?? 0} reject`}
        />
        <KpiCard
          title="Median score-time"
          value={`${(cases.reduce((s, c) => s + c.scoredInSeconds, 0) / Math.max(1, total)).toFixed(1)}s`}
          sub="Per case, end-to-end fetch + score"
        />
      </div>

      <div className="rounded-md border border-band-a/30 bg-band-a/5 p-4">
        <div className="text-xs uppercase tracking-widest text-band-a font-semibold">
          Champion vs challenger — inclusion without diluting asset quality
        </div>
        <p className="mt-1 text-sm text-foreground/90">
          A traditional document/bureau baseline rejects{" "}
          <span className="font-semibold">{cc.rescued}</span> viable thin-file MSMEs (
          <span className="font-semibold">{cc.rescuedPct}%</span> of the thin-file pool) that
          HealthLens routes back into the funnel — while the simulated bad-rate among HealthLens
          approvals stays at <span className="font-semibold">{cc.healthLensApprovedBadRate}%</span>.
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
          Indicative figures on synthetic data; bad-rate uses hidden outcome labels. Final
          calibration requires sandbox-data backtesting.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel title="Risk-band distribution">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid
                  stroke="var(--color-border)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
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
                  {distribution.map((d) => (
                    <Cell key={d.band} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Model card — viability scorecard">
          <dl className="grid grid-cols-2 gap-y-1 text-sm">
            <Dt label="Owner" value="MSME Risk Analytics" />
            <Dt label="Inputs" value="GST · AA bank · UPI · EPFO · Bureau-lite" />
            <Dt label="Label" value="Synthetic default (leakage-free)" />
            <Dt label="AUC (held-out)" value={MODEL.metrics.auc.toFixed(3)} />
            <Dt
              label="KS / Gini"
              value={`${MODEL.metrics.ks.toFixed(2)} / ${MODEL.metrics.gini.toFixed(2)}`}
            />
            <Dt label="Train / test" value={`${MODEL.metrics.trainN} / ${MODEL.metrics.testN}`} />
            <Dt label="Decision tier" value="Advisory — IDBI officer accepts/overrides" />
            <Dt label="Refresh" value="Quarterly · champion-challenger" />
          </dl>
        </Panel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <span className="font-semibold tabular-nums text-muted-foreground">{r.count}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

        <Panel title="Override history">
          {overrides.length === 0 ? (
            <p className="text-sm text-muted-foreground">No officer overrides recorded yet.</p>
          ) : (
            <AuditTimeline events={overrides} />
          )}
        </Panel>
      </div>
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
