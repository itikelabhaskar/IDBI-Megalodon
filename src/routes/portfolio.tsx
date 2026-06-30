import { createFileRoute } from "@tanstack/react-router";
import { PortfolioSimulator } from "@/components/healthlens/portfolio-simulator";
import { listCases } from "@/lib/mock-cases";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio simulator · IDBI MSME HealthLens" },
      {
        name: "description",
        content:
          "Tune policy thresholds and immediately see the impact on approvals, refers and rejects across the portfolio.",
      },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <header>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Risk admin
        </div>
        <h1 className="mt-1 text-xl font-semibold text-foreground">
          Portfolio &amp; policy simulator
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Move thresholds, see the impact across the current portfolio in one pass.
        </p>
      </header>
      <PortfolioSimulator cases={listCases()} />
    </div>
  );
}
