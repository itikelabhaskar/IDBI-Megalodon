import { createFileRoute, notFound } from "@tanstack/react-router";
import { getCase } from "@/lib/mock-cases";
import { PathToCreditPanel } from "@/components/healthlens/path-to-credit-panel";
import { SchemeReadinessPanel } from "@/components/healthlens/scheme-readiness-panel";
import { WhatIfSimulator } from "@/components/healthlens/what-if-simulator";
import { getSimulatorSeed, getRawById, type SimulatorSeed } from "@/lib/data/dataset";
import { computeFeatures } from "@/lib/scoring/features";
import { hardFlags, schemeReadiness } from "@/lib/scoring/decision";
import { formatInrCompact } from "@/lib/format";
import { AuthenticityBand } from "@/components/healthlens/authenticity-band";

/**
 * Applicant guidance — read-only coaching surface the officer can walk through
 * with the MSME. No sanction / maker–checker controls (those stay on Decision).
 */
export const Route = createFileRoute("/cases/$id/guidance")({
  loader: ({ params }) => {
    const data = getCase(params.id);
    if (!data) throw notFound();
    return { case: data, seed: getSimulatorSeed(params.id) };
  },
  component: GuidancePage,
});

function GuidancePage() {
  const { case: data, seed } = Route.useLoaderData() as {
    case: import("@/lib/types").MsmeCase;
    seed: SimulatorSeed | undefined;
  };
  const raw = getRawById(data.id);
  const schemes = raw
    ? (() => {
        const f = computeFeatures(raw);
        return schemeReadiness(raw, f, data.decision, hardFlags(f));
      })()
    : [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <section className="rounded-md border border-accent/25 bg-accent/5 p-4">
        <div className="text-[10px] uppercase tracking-widest font-semibold text-accent">
          Applicant guidance · read-only
        </div>
        <h2 className="mt-1 text-base font-semibold text-foreground">
          What HealthLens would show the MSME — not a sanction screen
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Path-to-credit, scheme gaps, and what-if levers only. Go / No-Go and maker–checker remain
          on the Decision tab for IDBI officers. This is HealthLens coaching language — not a
          separate borrower product clone.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <GuideStat label="HealthScore" value={`${data.healthScore}/100`} />
        <GuideStat
          label="Recommended limit (indicative)"
          value={data.recommendedLimit > 0 ? formatInrCompact(data.recommendedLimit) : "—"}
        />
        <GuideStat label="Product route" value={data.productRoute} />
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <AuthenticityBand authenticity={data.authenticity} showSummary />
        {data.ntcNtb && (
          <span className="rounded-md border border-band-b/40 bg-band-b/10 px-2 py-0.5 text-[10px] font-medium text-band-b">
            Credit-invisible (NTC/NTB) — stays in funnel when evidence allows
          </span>
        )}
        {data.decision === "Incomplete" && (
          <span className="rounded-md border border-band-c/40 bg-band-c/10 px-2 py-0.5 text-[10px] font-medium text-band-c">
            Incomplete — more consented rails needed before a score can stick
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PathToCreditPanel actions={data.pathToCredit} />
        <SchemeReadinessPanel schemes={schemes} />
      </div>

      {seed && (
        <section className="rounded-md border border-border bg-surface p-4">
          <div className="mb-3 text-xs font-semibold text-foreground/80">
            What-if — how behaviour changes the Health Card
          </div>
          <p className="mb-3 text-[11px] text-muted-foreground">
            Illustrative only on synthetic data. Does not change the stored case or officer decision.
          </p>
          <WhatIfSimulator seed={seed} />
        </section>
      )}
    </div>
  );
}

function GuideStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
