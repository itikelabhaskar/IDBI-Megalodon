import type { FraudAnalytics } from "@/lib/types";
import { formatInrCompact } from "@/lib/format";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

const tooltipStyle = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 6,
  fontSize: 12,
} as const;

export function FraudAnalyticsPanel({ data }: { data: FraudAnalytics }) {
  const benford = data.benford.map((d) => ({
    digit: String(d.digit),
    Observed: Math.round(d.observed * 1000) / 10,
    Benford: Math.round(d.expected * 1000) / 10,
  }));
  const roundTrip = data.reversedPairCount > 0;
  const benfordHigh = data.benfordDeviation > 0.06;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-px bg-border">
        <Metric
          label="Round-trip pairs"
          value={String(data.reversedPairCount)}
          sub={roundTrip ? formatInrCompact(data.reversedPairValue) + " cycled" : "none detected"}
          tone={roundTrip ? "negative" : "positive"}
        />
        <Metric
          label="Round-amount credits"
          value={`${Math.round(data.roundAmountRatio * 100)}%`}
          sub="exact ₹1L multiples"
          tone={data.roundAmountRatio > 0.1 ? "negative" : "positive"}
        />
        <Metric
          label="Benford deviation"
          value={data.benfordDeviation.toFixed(3)}
          sub={benfordHigh ? "leading digits irregular" : "conforms"}
          tone={benfordHigh ? "negative" : "positive"}
        />
      </div>

      <div>
        <div className="mb-1 text-xs font-medium text-foreground/80">
          Leading-digit distribution of sale credits vs Benford&apos;s law
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={benford} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="digit" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis
                tickFormatter={(v) => `${v}%`}
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                width={36}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Observed" fill="var(--color-chart-1)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Benford" fill="var(--color-muted-foreground)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Genuine business amounts follow Benford&apos;s law; large deviations or repeated round
          trips are classic manipulation tells (advisory — never auto-rejects).
        </p>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "positive" | "negative";
}) {
  return (
    <div className="bg-surface px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div
        className={`mt-1 text-lg font-semibold tabular-nums ${tone === "negative" ? "text-band-d" : "text-foreground"}`}
      >
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}
