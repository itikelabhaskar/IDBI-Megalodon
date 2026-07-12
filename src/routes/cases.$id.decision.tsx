import { createFileRoute, notFound } from "@tanstack/react-router";
import { getCase } from "@/lib/mock-cases";
import { DecisionPanel } from "@/components/healthlens/decision-panel";
import { DecisionWorkflowPanel } from "@/components/healthlens/decision-workflow-panel";
import { ProductRoutingCard } from "@/components/healthlens/product-routing-card";
import { PolicyGateGrid } from "@/components/healthlens/policy-gate-grid";
import { nextOfficerAction, policyGates } from "@/lib/case-insights";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ClipboardCheck } from "lucide-react";

export const Route = createFileRoute("/cases/$id/decision")({
  loader: ({ params }) => {
    const data = getCase(params.id);
    if (!data) throw notFound();
    return { case: data };
  },
  component: DecisionPage,
});

function DecisionPage() {
  const { case: data } = Route.useLoaderData() as { case: import("@/lib/types").MsmeCase };
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
            <p className="mt-2 text-[11px] text-muted-foreground">
              Path-to-credit, schemes, and what-if live on{" "}
              <Link
                to="/cases/$id/guidance"
                params={{ id: data.id }}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Applicant guidance
              </Link>{" "}
              — this tab is for the Go / No-Go and maker–checker call.
            </p>
          </div>
          <Link
            to="/cases/$id/guidance"
            params={{ id: data.id }}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-surface px-3 py-2 text-xs font-medium text-primary"
          >
            Open guidance
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
      <DecisionPanel data={data} />
      <DecisionWorkflowPanel data={data} />
      <section className="rounded-md border border-border bg-surface p-4">
        <div className="mb-3 text-xs font-semibold text-foreground/80">Policy gates</div>
        <PolicyGateGrid gates={policyGates(data)} />
      </section>
      <ProductRoutingCard data={data} />
    </div>
  );
}
