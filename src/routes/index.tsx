import { createFileRoute, Link } from "@tanstack/react-router";
import type { RiskBand } from "@/lib/types";
import { listCases } from "@/lib/mock-cases";
import { getDemoCases } from "@/lib/analytics/portfolio";
import { RiskBandChip } from "@/components/healthlens/risk-band-chip";
import { formatInrCompact, leadQuality } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ShieldAlert,
  TrendingUp,
  Layers,
  CheckCircle2,
  Workflow,
  Plug,
  FileCheck2,
  Landmark,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · IDBI MSME HealthLens" },
      {
        name: "description",
        content: "Overview of the MSME credit book scored from consented alternate data.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const cases = listCases();
  const demos = getDemoCases();
  const total = cases.length || 1;

  let approve = 0;
  let refer = 0;
  let reject = 0;
  let flagged = 0;
  let healthSum = 0;
  let requestedSum = 0;
  let recommendedSum = 0;
  let ntcNtb = 0;
  let ntcNtbNotRejected = 0;
  let powerAvailable = 0;
  let goodLeads = 0;
  const bands: Record<RiskBand, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const c of cases) {
    if (c.decision === "Approve") approve++;
    else if (c.decision === "Refer") refer++;
    else reject++;
    if (c.fraudFlags.some((f) => f.severity === "high")) flagged++;
    if (c.ntcNtb) {
      ntcNtb++;
      if (c.decision !== "Reject") ntcNtbNotRejected++;
    }
    if (c.dataCompleteness.some((d) => d.source === "POWER" && d.available)) powerAvailable++;
    if (leadQuality(c).rank >= 2) goodLeads++;
    healthSum += c.healthScore;
    requestedSum += c.requestedAmount;
    recommendedSum += c.recommendedLimit;
    bands[c.riskBand]++;
  }
  const avgHealth = Math.round(healthSum / total);
  const pct = (n: number) => Math.round((n / total) * 100);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Credit officer workspace
          </div>
          <h1 className="mt-1 text-xl font-semibold text-foreground">
            MSME credit intelligence cockpit
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {cases.length} MSME applications scored from consented alternate data, ready for an
            IDBI-style officer review.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/architecture"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            Pilot architecture
            <Workflow className="h-4 w-4" />
          </Link>
          <Link
            to="/queue"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Open case queue
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="rounded-md border border-primary/20 bg-primary/5 p-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Landmark className="h-4 w-4 text-primary" />
              Built around IDBI's Track 03 ask
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              The prototype is positioned as a pilot-ready decision-support layer: alternate-data
              health card, Go / Conditional / No-Go recommendation, human underwriter ownership,
              and sandbox-ready integrations.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <ProofCard
              icon={<Layers className="h-4 w-4" />}
              title="Alternate data"
              value="6 sources"
              detail={`${powerAvailable} cases include DISCOM power signal`}
            />
            <ProofCard
              icon={<TrendingUp className="h-4 w-4" />}
              title="Good leads"
              value={String(goodLeads)}
              detail="priority and inclusion leads ready for officer action"
            />
            <ProofCard
              icon={<FileCheck2 className="h-4 w-4" />}
              title="Underwriter proof"
              value="CAM + audit"
              detail="decision reasons and override trail visible"
            />
            <ProofCard
              icon={<Plug className="h-4 w-4" />}
              title="Sandbox path"
              value="ULI / OCEN"
              detail="connector stubs ready to swap after shortlist"
            />
          </div>
        </div>
      </section>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          icon={<Layers className="h-4 w-4" />}
          label="Open applications"
          value={String(cases.length)}
          sub="scored from alternate data"
        />
        <Kpi
          icon={<TrendingUp className="h-4 w-4" />}
          label="Avg HealthScore"
          value={String(avgHealth)}
          sub={`${bands.A + bands.B} in Band A/B`}
        />
        <Kpi
          icon={<CheckCircle2 className="h-4 w-4 text-band-a" />}
          label="NTC / NTB retained"
          value={`${ntcNtbNotRejected}/${ntcNtb || 1}`}
          sub="credit-invisible cases not auto-rejected"
        />
        <Kpi
          icon={<ShieldAlert className="h-4 w-4 text-band-d" />}
          label="Fraud-flagged"
          value={String(flagged)}
          sub="need triangulation review"
        />
      </div>

      {/* Distributions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Decision mix">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
            <span className="bg-band-a" style={{ width: `${pct(approve)}%` }} />
            <span className="bg-band-c" style={{ width: `${pct(refer)}%` }} />
            <span className="bg-band-d" style={{ width: `${pct(reject)}%` }} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <Legend dot="bg-band-a" label="Approve" value={approve} pct={pct(approve)} />
            <Legend dot="bg-band-c" label="Refer" value={refer} pct={pct(refer)} />
            <Legend dot="bg-band-d" label="Reject" value={reject} pct={pct(reject)} />
          </div>
          <div className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="text-foreground font-medium">{formatInrCompact(requestedSum)}</span>{" "}
            requested ·{" "}
            <span className="text-foreground font-medium">{formatInrCompact(recommendedSum)}</span>{" "}
            recommended limit across the book.
          </div>
        </Panel>

        <Panel title="Risk band mix">
          <div className="space-y-2.5">
            {(["A", "B", "C", "D"] as RiskBand[]).map((b) => (
              <div key={b} className="flex items-center gap-3">
                <RiskBandChip band={b} compact />
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", `bg-band-${b.toLowerCase()}`)}
                    style={{ width: `${pct(bands[b])}%` }}
                  />
                </div>
                <span className="w-16 text-right text-xs tabular-nums text-muted-foreground">
                  {bands[b]} · {pct(bands[b])}%
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Featured demo cases */}
      {demos.length > 0 && (
        <Panel title="Featured demo cases">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {demos.map((d) => (
              <Link
                key={d.id}
                to="/cases/$id"
                params={{ id: d.id }}
                className="group rounded-md border border-border bg-background p-3 transition-colors hover:border-primary hover:bg-primary/5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                    {d.title}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{d.note}</p>
              </Link>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
        <span className="text-muted-foreground/80">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function ProofCard({
  icon,
  title,
  value,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-md border border-primary/15 bg-surface p-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      <div className="mt-2 text-base font-semibold text-foreground">{value}</div>
      <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{detail}</div>
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

function Legend({
  dot,
  label,
  value,
  pct,
}: {
  dot: string;
  label: string;
  value: number;
  pct: number;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span className={cn("h-2 w-2 rounded-full", dot)} />
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-0.5 tabular-nums font-medium text-foreground">
        {value} <span className="text-muted-foreground font-normal">· {pct}%</span>
      </div>
    </div>
  );
}
