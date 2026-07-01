import { createFileRoute, notFound } from "@tanstack/react-router";
import { getCase } from "@/lib/mock-cases";
import { getSimulatorSeed, type SimulatorSeed } from "@/lib/data/dataset";
import { DecisionPanel } from "@/components/healthlens/decision-panel";
import { ProductRoutingCard } from "@/components/healthlens/product-routing-card";
import { PathToCreditPanel } from "@/components/healthlens/path-to-credit-panel";
import { WhatIfSimulator } from "@/components/healthlens/what-if-simulator";
import { PolicyGateGrid } from "@/components/healthlens/policy-gate-grid";
import { nextOfficerAction, policyGates } from "@/lib/case-insights";
import { ArrowRight, ClipboardCheck } from "lucide-react";

export const Route = createFileRoute("/cases/$id/decision")({
  loader: ({ params }) => {
    const data = getCase(params.id);
    if (!data) throw notFound();
    return { case: data, seed: getSimulatorSeed(params.id) };
  },
  component: DecisionPage,
});

function DecisionPage() {
  const { case: data, seed } = Route.useLoaderData() as {
    case: import("@/lib/types").MsmeCase;
    seed: SimulatorSeed | undefined;
  };
  const action = nextOfficerAction(data);
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl">
      <section className="rounded-md border border-primary/20 bg-primary/5 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-primary">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Recommended officer action
            </div>
            <h2 className="mt-1 text-base font-semibold text-foreground">{action.label}</h2>
            <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">{action.description}</p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-surface px-3 py-2 text-xs font-medium text-primary">
            Review evidence
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </section>
      <DecisionPanel data={data} />
      <section className="rounded-md border border-border bg-surface p-4">
        <div className="mb-3 text-xs font-semibold text-foreground/80">Policy gates</div>
        <PolicyGateGrid gates={policyGates(data)} />
      </section>
      <ProductRoutingCard data={data} />
      {seed && <WhatIfSimulator seed={seed} />}
      <PathToCreditPanel actions={data.pathToCredit} />
    </div>
  );
}
