import { createFileRoute, notFound } from "@tanstack/react-router";
import { getCase } from "@/lib/mock-cases";
import { FraudFlagList } from "@/components/healthlens/fraud-flag-list";
import {
  TriangulationChart,
  PowerTriangulationChart,
  UpiTrendChart,
} from "@/components/healthlens/charts";
import { RUPEES_PER_KWH } from "@/lib/scoring/features";

export const Route = createFileRoute("/cases/$id/fraud")({
  loader: ({ params }) => {
    const data = getCase(params.id);
    if (!data) throw notFound();
    return { case: data };
  },
  component: FraudPage,
});

function FraudPage() {
  const { case: data } = Route.useLoaderData() as { case: import("@/lib/types").MsmeCase };

  // Quick derived metrics
  const totalGst = data.gstTrend.reduce((s, p) => s + p.value, 0);
  const totalBank = data.cashflow.reduce((s, p) => s + p.inflow, 0);
  const mismatchPct = totalGst === 0 ? 0 : Math.round(((totalGst - totalBank) / totalGst) * 100);
  const totalPowerKwh = data.powerConsumption.reduce((s, p) => s + p.value, 0);
  const impliedFromPower = totalPowerKwh * RUPEES_PER_KWH;
  const powerMismatchPct =
    totalGst === 0 ? 0 : Math.round(((totalGst - impliedFromPower) / totalGst) * 100);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <section className="rounded-md border border-border bg-surface">
        <header className="border-b border-border px-4 py-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Triangulation
          </div>
          <div className="mt-0.5 text-sm font-semibold text-foreground">
            GST turnover vs bank credits
          </div>
        </header>
        <div className="p-4">
          <TriangulationChart gst={data.gstTrend} cashflow={data.cashflow} />
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <Metric label="12m GST turnover" value={formatCompact(totalGst)} />
            <Metric label="12m bank credits" value={formatCompact(totalBank)} />
            <Metric
              label="Net divergence"
              value={`${mismatchPct > 0 ? "+" : ""}${mismatchPct}%`}
              tone={Math.abs(mismatchPct) > 15 ? "negative" : "positive"}
            />
          </div>
        </div>
      </section>

      <section className="rounded-md border border-border bg-surface">
        <header className="border-b border-border px-4 py-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Power triangulation
          </div>
          <div className="mt-0.5 text-sm font-semibold text-foreground">
            Declared turnover vs electricity-implied activity
          </div>
        </header>
        <div className="p-4">
          <PowerTriangulationChart power={data.powerConsumption} gst={data.gstTrend} />
          {data.powerConsumption.length > 0 ? (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <Metric label="12m declared (GST)" value={formatCompact(totalGst)} />
              <Metric label="Power-implied turnover" value={formatCompact(impliedFromPower)} />
              <Metric
                label="Activity gap"
                value={`${powerMismatchPct > 0 ? "+" : ""}${powerMismatchPct}%`}
                tone={powerMismatchPct > 50 ? "negative" : "positive"}
              />
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              Electricity feed not consented for this applicant.
            </p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-md border border-border bg-surface">
          <header className="border-b border-border px-4 py-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              UPI quality
            </div>
            <div className="mt-0.5 text-sm font-semibold text-foreground">
              Refund ratio &amp; transaction load
            </div>
          </header>
          <div className="p-4">
            <UpiTrendChart data={data.upiTrend} />
          </div>
        </section>

        <section className="rounded-md border border-border bg-surface">
          <header className="border-b border-border px-4 py-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Flag register
            </div>
            <div className="mt-0.5 text-sm font-semibold text-foreground">
              Fraud &amp; data-quality flags
            </div>
          </header>
          <div className="p-4">
            <FraudFlagList flags={data.fraudFlags} />
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  const cls =
    tone === "negative"
      ? "border-band-d/30 bg-band-d/10 text-band-d"
      : tone === "positive"
        ? "border-band-a/30 bg-band-a/10 text-band-a"
        : "border-border bg-muted/30 text-foreground";
  return (
    <div className={`rounded-md border px-3 py-2 ${cls}`}>
      <div className="text-[10px] uppercase tracking-widest opacity-80">{label}</div>
      <div className="mt-0.5 text-base font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function formatCompact(v: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v);
}
