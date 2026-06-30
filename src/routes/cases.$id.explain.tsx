import { createFileRoute, notFound } from "@tanstack/react-router";
import { getCase } from "@/lib/mock-cases";
import { ReasonCodeList } from "@/components/healthlens/reason-code-list";
import { SubScoreBreakdown } from "@/components/healthlens/sub-score-breakdown";
import { ContributionChart } from "@/components/healthlens/contribution-chart";

export const Route = createFileRoute("/cases/$id/explain")({
  loader: ({ params }) => {
    const data = getCase(params.id);
    if (!data) throw notFound();
    return { case: data };
  },
  component: ExplainPage,
});

function ExplainPage() {
  const { case: data } = Route.useLoaderData() as { case: import("@/lib/types").MsmeCase };
  const summary = data.reasonCodes
    .filter((r) => r.polarity === "positive")
    .slice(0, 2)
    .map((r) => r.label)
    .join("; ");
  const downsides = data.reasonCodes
    .filter((r) => r.polarity === "negative")
    .slice(0, 2)
    .map((r) => r.label)
    .join("; ");

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* (a) Decision explanation */}
      <section className="rounded-md border border-border bg-surface">
        <header className="border-b border-border px-4 py-3">
          <div className="text-[10px] uppercase tracking-widest text-primary font-semibold">
            (a) Decision explanation
          </div>
          <div className="mt-0.5 text-sm font-semibold text-foreground">
            Drivers of the HealthScore &amp; decision
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Reason codes and sub-scores below explain the{" "}
            <span className="font-medium text-foreground">HealthScore</span> ({data.healthScore}
            /100) and the resulting{" "}
            <span className="font-medium text-foreground">{data.decision}</span> recommendation.
          </p>
        </header>
        <div className="p-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
          <ReasonCodeList reasons={data.reasonCodes} />
          <div className="rounded-md border border-border bg-muted/30 p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Sub-score breakdown
            </div>
            <SubScoreBreakdown subScores={data.subScores} />
          </div>
        </div>
        <div className="border-t border-border bg-muted/30 px-4 py-3 text-sm text-foreground/85">
          <span className="font-semibold">Plain-language summary:</span> Engine recommends{" "}
          <span className="font-semibold">{data.decision}</span> primarily because of{" "}
          {summary || "consistent positive signals across consented sources"}
          {downsides ? `, weighed against ${downsides}` : ""}.
        </div>
      </section>

      {/* (b) AI signal explanation */}
      <section className="rounded-md border border-border bg-surface">
        <header className="border-b border-border px-4 py-3">
          <div className="text-[10px] uppercase tracking-widest text-band-b font-semibold">
            (b) AI signal explanation
          </div>
          <div className="mt-0.5 text-sm font-semibold text-foreground">
            SHAP-style contributions to ML probability
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Explains the secondary ML probability (
            <span className="font-mono text-foreground">mlProbabilityProxy</span> ={" "}
            <span className="font-medium text-foreground">
              {(data.mlProbabilityProxy * 100).toFixed(0)}%
            </span>
            ) only — <span className="font-medium text-foreground">not</span> the HealthScore.
          </p>
        </header>
        <div className="p-4">
          <ContributionChart contributions={data.contributions} />
        </div>
        <div className="border-t border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          Positive bars (green) push the ML probability up; negative bars (red) push it down. The ML
          probability is an additional signal for the officer — it does not replace the
          HealthScore-based decision above.
        </div>
      </section>
    </div>
  );
}
