import { createFileRoute } from "@tanstack/react-router";
import { GovernancePanel } from "@/components/healthlens/governance-panel";
import { listCases } from "@/lib/mock-cases";

export const Route = createFileRoute("/governance")({
  head: () => ({
    meta: [
      { title: "Governance · IDBI MSME HealthLens" },
      {
        name: "description",
        content:
          "Consent logs, model card, decision/override history and champion-challenger monitoring for the HealthScore engine.",
      },
    ],
  }),
  component: GovernancePage,
});

function GovernancePage() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <header>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Risk admin
        </div>
        <h1 className="mt-1 text-xl font-semibold text-foreground">Governance &amp; monitoring</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Consent logs, model card, override history and champion-challenger summary.
        </p>
      </header>
      <GovernancePanel cases={listCases()} />
    </div>
  );
}
