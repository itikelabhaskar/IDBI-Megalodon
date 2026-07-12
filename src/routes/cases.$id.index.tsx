import { createFileRoute, notFound } from "@tanstack/react-router";
import { getCase } from "@/lib/mock-cases";
import { CaseAttentionSummary } from "@/components/healthlens/case-attention-summary";
import { HealthScoreGauge } from "@/components/healthlens/health-score-gauge";
import { CreditStyleBadge } from "@/components/healthlens/credit-style-badge";
import { SubScoreBreakdown } from "@/components/healthlens/sub-score-breakdown";
import { ReasonCodeList } from "@/components/healthlens/reason-code-list";
import { DataCompletenessStrip } from "@/components/healthlens/data-completeness-strip";
import { PeerBenchmark } from "@/components/healthlens/peer-benchmark";
import {
  GstTrendChart,
  CashflowChart,
  UpiTrendChart,
  PowerChart,
  FuelChart,
  BuyerConcentrationChart,
} from "@/components/healthlens/charts";
import { AuthenticityBand } from "@/components/healthlens/authenticity-band";
import { monitoringSignals } from "@/lib/analytics/monitoring";

export const Route = createFileRoute("/cases/$id/")({
  loader: ({ params }) => {
    const data = getCase(params.id);
    if (!data) throw notFound();
    return { case: data };
  },
  component: HealthCardPage,
});

function HealthCardPage() {
  const { case: data } = Route.useLoaderData() as { case: import("@/lib/types").MsmeCase };
  const missingCount = data.dataCompleteness.filter((d) => !d.available).length;
  const monitor = monitoringSignals(data);

  return (
    <>
      <CaseAttentionSummary data={data} />
      <div className="p-4 md:p-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
      <div className="space-y-6 min-w-0">
        <section className="rounded-md border border-border bg-surface p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)] gap-6 items-start">
            <div className="flex flex-col items-center gap-3">
              <HealthScoreGauge score={data.healthScore} band={data.riskBand} />
              <CreditStyleBadge score={data.creditStyleScore} />
              <AuthenticityBand authenticity={data.authenticity} showSummary />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-semibold text-foreground/80">Sub-scores</div>
                <DataCompletenessStrip items={data.dataCompleteness} />
              </div>
              <div className="mt-3">
                <SubScoreBreakdown subScores={data.subScores} />
              </div>
              {missingCount > 0 && (
                <p className="mt-4 rounded-md border border-band-c/30 bg-band-c/5 px-3 py-2 text-xs text-band-c">
                  {missingCount} of {data.dataCompleteness.length} data sources unavailable —
                  sub-scores shown as N/A and weighted out.
                </p>
              )}
            </div>
          </div>
        </section>

        <ReasonCodeList reasons={data.reasonCodes} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartPanel title="GST turnover (12m)">
            <GstTrendChart data={data.gstTrend} />
          </ChartPanel>
          <ChartPanel title="Bank cash-flow (12m)">
            <CashflowChart data={data.cashflow} />
          </ChartPanel>
          <ChartPanel title="Digital presence — UPI value / count / refund ratio">
            <UpiTrendChart data={data.upiTrend} />
          </ChartPanel>
          <ChartPanel title="Electricity consumption (12m, kWh)">
            <PowerChart data={data.powerConsumption} />
          </ChartPanel>
          <ChartPanel title="Fuel / operational spend (12m)">
            <FuelChart data={data.fuelConsumption} />
          </ChartPanel>
          <ChartPanel title="Buyer concentration">
            <BuyerConcentrationChart data={data.buyerConcentration} />
          </ChartPanel>
        </div>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-4 h-fit">
        <PeerBenchmark
          percentile={data.peerClusterPercentile}
          sector={data.sector}
          cluster={data.clusterCity}
        />
        <div className="rounded-md border border-border bg-surface p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Cluster risk
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-sm font-medium text-foreground">{data.clusterRisk.cluster}</span>
            <span className="text-sm font-semibold text-foreground">{data.clusterRisk.band}</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${data.clusterRisk.index}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Cluster risk index {data.clusterRisk.index}/100 · avg HealthScore{" "}
            {data.clusterRisk.avgHealthScore} across {data.clusterRisk.peerCount} MSMEs in this
            cluster.
          </p>
        </div>
        <div className="rounded-md border border-border bg-surface p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Scoring metadata
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-y-1 text-xs">
            <dt className="text-muted-foreground">Score time</dt>
            <dd className="text-foreground tabular-nums">{data.scoredInSeconds.toFixed(1)}s</dd>
            <dt className="text-muted-foreground">Vintage</dt>
            <dd className="text-foreground">{data.vintageMonths}m</dd>
            <dt className="text-muted-foreground">Peer percentile</dt>
            <dd className="text-foreground">P{data.peerClusterPercentile}</dd>
            <dt className="text-muted-foreground">ML proxy</dt>
            <dd className="text-foreground tabular-nums">
              {(data.mlProbabilityProxy * 100).toFixed(0)}%
            </dd>
            <dt className="text-muted-foreground">Confidence</dt>
            <dd className="text-foreground tabular-nums">
              {data.confidence.level} · {data.confidence.score}
            </dd>
          </dl>
        </div>
        <div className="rounded-md border border-border bg-surface p-4 text-xs text-muted-foreground leading-relaxed">
          HealthScore is the{" "}
          <span className="text-foreground font-medium">primary decision driver</span>. The ML proxy
          on the explainability tab is a secondary signal — it does not auto-sanction.
        </div>
        <div className="rounded-md border border-border bg-surface p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Book monitoring (Mode B)
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-y-1 text-xs">
            <dt className="text-muted-foreground">Score trend</dt>
            <dd className="text-foreground">{monitor.scoreTrend}</dd>
            <dt className="text-muted-foreground">Renewal cue</dt>
            <dd className="text-foreground">{monitor.renewalDue ? "Yes" : "No"}</dd>
            <dt className="text-muted-foreground">Watchlist</dt>
            <dd className="text-foreground">{monitor.watchlist ? "Flagged" : "Clear"}</dd>
          </dl>
          {monitor.reasons.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-[11px] text-muted-foreground">
              {monitor.reasons.slice(0, 3).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
    </>
  );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="border-b border-border px-4 py-2.5 text-xs font-semibold text-foreground/80">
        {title}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}
