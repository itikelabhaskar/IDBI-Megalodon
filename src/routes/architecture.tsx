import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Cloud,
  Database,
  FileCheck2,
  LockKeyhole,
  Plug,
  Server,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RAIL_STATUS } from "@/lib/connectors/rail-status";

export const Route = createFileRoute("/architecture")({
  head: () => ({
    meta: [
      { title: "Pilot architecture · IDBI MSME HealthLens" },
      {
        name: "description",
        content:
          "Data-flow, sandbox integration and governance architecture for IDBI MSME HealthLens.",
      },
    ],
  }),
  component: ArchitecturePage,
});

const sources = [
  { label: "GSTN", detail: "Returns, turnover, filing discipline" },
  { label: "AA Bank", detail: "Cash-flow, bounces, balances, operating outflows" },
  { label: "UPI", detail: "Digital receipts, refunds, velocity" },
  { label: "EPFO", detail: "Payroll continuity and staff signal" },
  { label: "DISCOM", detail: "Power consumption and utility activity" },
  { label: "Fuel / ops costs", detail: "Trader/logistics operating spend and turnover proxy" },
  { label: "Bureau-lite", detail: "Thin-file bureau hygiene" },
];

const engineSteps = [
  {
    title: "Normalize",
    detail: "Consent artifacts and source payloads are mapped into one MSME case contract.",
  },
  {
    title: "Engineer signals",
    detail:
      "GST-bank, UPI, EPFO, power/fuel operations, cluster and compliance signals are scored with missing-data rules.",
  },
  {
    title: "Score + BRE",
    detail: "HealthScore, risk band, Go/Conditional/No-Go, limit and product route are computed.",
  },
  {
    title: "Explain",
    detail: "Reason codes explain the decision; ML contributions explain only the secondary proxy.",
  },
];

const outputs = [
  { label: "Officer queue", detail: "Ranked cases and lead prioritization" },
  { label: "Health card", detail: "Sub-scores, trends, source coverage" },
  { label: "CAM export", detail: "Credit memo with audit references" },
  { label: "ULI / OCEN", detail: "Schema-ready API surface for sandbox" },
  { label: "Governance", detail: "Consent, override, model-card monitoring" },
];

const runtimeFlow = [
  "Consent",
  "Source connectors",
  "Normalization",
  "Feature engine",
  "HealthScore + BRE + ML proxy",
  "Officer workbench",
  "ULI / OCEN / CAM",
];

function ArchitecturePage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Pilot readiness
          </div>
          <h1 className="mt-1 text-xl font-semibold text-foreground">
            Architecture &amp; data flow
          </h1>
          <p className="mt-0.5 max-w-3xl text-sm text-muted-foreground">
            How HealthLens swaps prototype connectors for IDBI sandbox APIs while keeping the same
            scorecard, explainability, CAM and governance workflow.
          </p>
        </div>
        <Link
          to="/queue"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Open live queue
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <section className="rounded-md border border-primary/20 bg-primary/5 p-4">
        <div className="text-[10px] uppercase tracking-widest text-primary font-semibold">
          End-to-end pilot flow
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {runtimeFlow.map((step, index) => (
            <div key={step} className="flex items-center gap-2">
              <div className="rounded-md border border-primary/20 bg-surface px-3 py-2 text-xs font-medium text-foreground">
                {step}
              </div>
              {index < runtimeFlow.length - 1 && <ArrowRight className="h-4 w-4 text-primary" />}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Workflow className="h-4 w-4 text-primary" />
            Track 03 operating model
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Consented alternate data becomes a banker-readable Financial Health Card. IDBI remains
            the regulated entity and the final decision owner.
          </p>
        </div>
        <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_56px_minmax(0,1.05fr)_56px_minmax(0,0.9fr)]">
          <Stage title="Consent + source feeds" icon={<Database className="h-4 w-4" />}>
            <div className="grid gap-2 sm:grid-cols-2">
              {sources.map((source) => (
                <SignalCard key={source.label} label={source.label} detail={source.detail} />
              ))}
            </div>
          </Stage>
          <FlowArrow />
          <Stage title="HealthLens engine" icon={<Server className="h-4 w-4" />} tone="primary">
            <div className="space-y-2">
              {engineSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="flex gap-3 rounded-md border border-border bg-background p-3"
                >
                  <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">{step.title}</div>
                    <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {step.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Stage>
          <FlowArrow />
          <Stage title="Bank workflow outputs" icon={<FileCheck2 className="h-4 w-4" />}>
            <div className="space-y-2">
              {outputs.map((output) => (
                <SignalCard key={output.label} label={output.label} detail={output.detail} />
              ))}
            </div>
          </Stage>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <InfoPanel
          icon={<Plug className="h-4 w-4" />}
          title="Sandbox swap path"
          eyebrow="After shortlist"
          points={[
            "Replace deterministic connector stubs with IDBI / partner sandbox endpoints.",
            "Keep the same Zod-validated API contracts for ULI, OCEN and AA-style requests.",
            "Run synthetic and sandbox cases side-by-side before pilot tuning.",
          ]}
        />
        <InfoPanel
          icon={<ShieldCheck className="h-4 w-4" />}
          title="Decision governance"
          eyebrow="Human-in-loop"
          points={[
            "HealthScore and BRE create a recommendation, not an automated final sanction.",
            "Officer override requires a reason and remains visible in the audit trail.",
            "Reason-code and ML explanations are intentionally separated for audit clarity.",
          ]}
        />
        <InfoPanel
          icon={<Cloud className="h-4 w-4" />}
          title="Cloud deployment"
          eyebrow="AWS-ready"
          points={[
            "Portable Vite + Nitro build can run behind CloudFront / Lambda or equivalent hosts.",
            "No prototype secrets or managed datastore are required for the first demo.",
            "Production pilot can externalize logs, consent artifacts and monitoring events.",
          ]}
        />
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <ModePanel
          title="Prototype now"
          points={[
            "Synthetic, schema-faithful MSME cases generated in-process.",
            "Connector stubs simulate AA, GSTN, UPI, EPFO, DISCOM and bureau feeds.",
            "Credit officer UI, CAM, audit and governance are fully demoable today.",
          ]}
        />
        <ModePanel
          title="Sandbox later"
          points={[
            "Swap stubs for IDBI / partner sandbox APIs without changing the case contract.",
            "Backtest and calibrate HealthScore, BRE thresholds and ML proxy on sandbox data.",
            "Externalize logs, consent artifacts, monitoring and override events for pilot controls.",
          ]}
        />
      </section>

      <section className="rounded-md border border-border bg-surface p-4">
        <div className="text-sm font-semibold text-foreground">
          Connector rails — Synthetic → Sandbox → Live
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Every rail below is stubbed and labelled Synthetic for this demo. No live ULI / OCEN /
          FASTag claim.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {RAIL_STATUS.map((r) => (
            <li key={r.id} className="rounded-md border border-border bg-background px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-foreground">{r.label}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {r.mode}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{r.schemaNote}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 rounded-md border border-border bg-surface p-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <BarChart3 className="h-4 w-4 text-primary" />
            What the prototype proves
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            The UI is wired to the scoring engine, not static slides. Each item below is visible in
            the current case workflow and can be demonstrated from the queue.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Proof
            label="Power + fuel operations"
            detail="DISCOM utility and fuel-cost signals in the operations score"
          />
          <Proof label="NTC/NTB support" detail="No automatic rejection for thin-file cases" />
          <Proof label="Go / No-Go" detail="Decision mapped to banker language" />
          <Proof label="Auditability" detail="Consent, override, CAM and model-card trail" />
        </div>
      </section>

      <section className="rounded-md border border-primary/20 bg-primary/5 p-4">
        <div className="flex gap-3">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <div className="text-sm font-semibold text-foreground">Compliance posture</div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Prototype data is synthetic. Sandbox data would be processed with explicit consent,
              purpose limitation, source-level availability, officer-visible explanations and
              audit-retained decisions aligned to RBI / DPDP expectations.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ModePanel({ title, points }: { title: string; points: string[] }) {
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
        {points.map((point) => (
          <li key={point} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-positive" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stage({
  title,
  icon,
  tone = "neutral",
  children,
}: {
  title: string;
  icon: React.ReactNode;
  tone?: "neutral" | "primary";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-3",
        tone === "primary" ? "border-primary/30 bg-primary/5" : "border-border bg-background",
      )}
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <span
          className={cn(
            "grid h-7 w-7 place-items-center rounded-md border",
            tone === "primary"
              ? "border-primary/20 bg-primary/10 text-primary"
              : "border-border bg-surface text-muted-foreground",
          )}
        >
          {icon}
        </span>
        {title}
      </div>
      {children}
    </div>
  );
}

function SignalCard({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="text-sm font-medium text-foreground">{label}</div>
      <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{detail}</div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="hidden place-items-center xl:grid">
      <div className="grid h-10 w-10 place-items-center rounded-full border border-primary/20 bg-primary/10 text-primary">
        <ArrowRight className="h-5 w-5" />
      </div>
    </div>
  );
}

function InfoPanel({
  icon,
  eyebrow,
  title,
  points,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  points: string[];
}) {
  return (
    <section className="rounded-md border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {eyebrow}
      </div>
      <h2 className="mt-1 text-sm font-semibold text-foreground">{title}</h2>
      <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
        {points.map((point) => (
          <li key={point} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-positive" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Proof({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="text-sm font-medium text-foreground">{label}</div>
      <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{detail}</div>
    </div>
  );
}
