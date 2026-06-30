import { createFileRoute } from "@tanstack/react-router";
import { CaseQueueTable } from "@/components/healthlens/case-queue-table";
import { listCases } from "@/lib/mock-cases";

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
  return (
    <div className="p-4 md:p-6 space-y-4">
      <header className="min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Credit officer workspace
        </div>
        <h1 className="mt-1 text-xl font-semibold text-foreground">Case queue</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {cases.length} MSME applications scored from consented alternate data. Sort and filter
          from the column headers.
        </p>
      </header>
      <CaseQueueTable cases={cases} />
    </div>
  );
}
