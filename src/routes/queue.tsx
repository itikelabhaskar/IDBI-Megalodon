import { createFileRoute, Link } from "@tanstack/react-router";
import { CaseQueueTable } from "@/components/healthlens/case-queue-table";
import { listCases } from "@/lib/mock-cases";
import { getDemoCases } from "@/lib/analytics/portfolio";

export const Route = createFileRoute("/queue")({
  head: () => ({
    meta: [
      { title: "Case queue · IDBI MSME HealthLens" },
      {
        name: "description",
        content:
          "Review pending MSME credit applications with HealthScore, recommended limit, decision and product route.",
      },
    ],
  }),
  component: QueuePage,
});

function QueuePage() {
  const cases = listCases();
  const demos = getDemoCases();
  return (
    <div className="p-4 md:p-6 space-y-4">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Credit officer workspace
          </div>
          <h1 className="mt-1 text-xl font-semibold text-foreground">Case queue</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {cases.length} MSME applications scored from consented alternate data.
          </p>
        </div>
      </header>
      {demos.length > 0 && (
        <div className="rounded-md border border-border bg-surface p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Featured demo cases
          </div>
          <div className="flex flex-wrap gap-2">
            {demos.map((d) => (
              <Link
                key={d.id}
                to="/cases/$id"
                params={{ id: d.id }}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs transition-colors hover:border-primary hover:bg-primary/5"
              >
                <span className="font-medium text-foreground">{d.title}</span>
                <span className="text-muted-foreground"> · {d.note}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
      <CaseQueueTable cases={cases} />
    </div>
  );
}
