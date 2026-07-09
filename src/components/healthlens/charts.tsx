import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceDot,
} from "recharts";
import type { TrendPoint, CashflowPoint, UpiPoint, BuyerShare } from "@/lib/types";
import { formatPeriod, formatInrCompact } from "@/lib/format";
import { rupeesPerKwh } from "@/lib/data/sector-intensity";

const tooltipStyle = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 6,
  fontSize: 12,
} as const;

function EmptyChart({ label, h = 224 }: { label: string; h?: number }) {
  return (
    <div
      className="grid place-items-center rounded-md border border-dashed border-border bg-muted/20 text-xs text-muted-foreground"
      style={{ height: h }}
    >
      {label}
    </div>
  );
}

export function GstTrendChart({
  data,
  delayedPeriods = [],
}: {
  data: TrendPoint[];
  delayedPeriods?: string[];
}) {
  if (!data?.length) return <EmptyChart label="GST source not consented" />;
  const marks = data.filter((p) => delayedPeriods.includes(p.period));
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="period"
            tickFormatter={formatPeriod}
            stroke="var(--color-muted-foreground)"
            fontSize={11}
          />
          <YAxis
            tickFormatter={(v) => formatInrCompact(v as number)}
            stroke="var(--color-muted-foreground)"
            fontSize={11}
            width={60}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => [formatInrCompact(v as number), "Turnover"]}
            labelFormatter={(l) => formatPeriod(l as string)}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line
            type="monotone"
            dataKey="value"
            name="GST turnover"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
          />
          {marks.map((m) => (
            <ReferenceDot
              key={m.period}
              x={m.period}
              y={m.value}
              r={5}
              fill="var(--color-band-d)"
              stroke="white"
              strokeWidth={1.5}
              ifOverflow="extendDomain"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CashflowChart({ data }: { data: CashflowPoint[] }) {
  if (!data?.length) return <EmptyChart label="Bank source not consented" h={256} />;
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="period"
            tickFormatter={formatPeriod}
            stroke="var(--color-muted-foreground)"
            fontSize={11}
          />
          <YAxis
            tickFormatter={(v) => formatInrCompact(v as number)}
            stroke="var(--color-muted-foreground)"
            fontSize={11}
            width={60}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v, name) => [formatInrCompact(v as number), name as string]}
            labelFormatter={(l) => formatPeriod(l as string)}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="inflow" name="Inflow" fill="var(--color-band-a)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="outflow" name="Outflow" fill="var(--color-band-d)" radius={[2, 2, 0, 0]} />
          <Line
            type="monotone"
            dataKey="closingBalance"
            name="Closing balance"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={{ r: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function UpiTrendChart({ data }: { data: UpiPoint[] }) {
  if (!data?.length) return <EmptyChart label="UPI source not consented" />;
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="period"
            tickFormatter={formatPeriod}
            stroke="var(--color-muted-foreground)"
            fontSize={11}
          />
          <YAxis
            yAxisId="left"
            tickFormatter={(v) => formatInrCompact(v as number)}
            stroke="var(--color-muted-foreground)"
            fontSize={11}
            width={60}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="var(--color-muted-foreground)"
            fontSize={11}
            width={40}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(l) => formatPeriod(l as string)}
            formatter={(v, name) =>
              name === "Refund ratio"
                ? [`${((v as number) * 100).toFixed(2)}%`, name as string]
                : name === "UPI count"
                  ? [v as number, name as string]
                  : [formatInrCompact(v as number), name as string]
            }
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="inValue"
            name="UPI value"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="inCount"
            name="UPI count"
            stroke="var(--color-chart-2)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="refundRatio"
            name="Refund ratio"
            stroke="var(--color-band-d)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BuyerConcentrationChart({ data }: { data: BuyerShare[] }) {
  if (!data?.length) return <EmptyChart label="No buyer data" />;
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data.map((d) => ({ ...d, sharePct: +(d.share * 100).toFixed(1) }))}
          layout="vertical"
          margin={{ top: 8, right: 24, left: 8, bottom: 4 }}
        >
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            stroke="var(--color-muted-foreground)"
            fontSize={11}
            unit="%"
            domain={[0, 100]}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="var(--color-muted-foreground)"
            fontSize={11}
            width={160}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "Share"]} />
          <Bar dataKey="sharePct" fill="var(--color-primary)" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Triangulation: GST turnover (monthly) vs bank credits (monthly).
 * Bank credits taken from cashflow.inflow per period.
 */
export function TriangulationChart({
  gst,
  cashflow,
}: {
  gst: TrendPoint[];
  cashflow: CashflowPoint[];
}) {
  const map = new Map(cashflow.map((c) => [c.period, c.inflow]));
  const data = gst.map((g) => {
    const bank = map.get(g.period) ?? 0;
    const diff = g.value - bank;
    const pct = g.value === 0 ? 0 : diff / g.value;
    return { period: g.period, gst: g.value, bank, diffPct: +(pct * 100).toFixed(1) };
  });

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="period"
            tickFormatter={formatPeriod}
            stroke="var(--color-muted-foreground)"
            fontSize={11}
          />
          <YAxis
            yAxisId="left"
            tickFormatter={(v) => formatInrCompact(v as number)}
            stroke="var(--color-muted-foreground)"
            fontSize={11}
            width={60}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="var(--color-muted-foreground)"
            fontSize={11}
            width={48}
            unit="%"
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(l) => formatPeriod(l as string)}
            formatter={(v, name) =>
              name === "Δ vs bank"
                ? [`${v}%`, name as string]
                : [formatInrCompact(v as number), name as string]
            }
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar
            yAxisId="left"
            dataKey="gst"
            name="GST turnover"
            fill="var(--color-primary)"
            radius={[2, 2, 0, 0]}
          />
          <Bar
            yAxisId="left"
            dataKey="bank"
            name="Bank credits"
            fill="var(--color-chart-2)"
            radius={[2, 2, 0, 0]}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="diffPct"
            name="Δ vs bank"
            stroke="var(--color-band-d)"
            strokeWidth={2}
            dot={{ r: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

const kwhTick = (v: number): string =>
  v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`;

/** Monthly electricity consumption (kWh) — IDBI's flagship alternate signal. */
export function PowerChart({ data }: { data: TrendPoint[] }) {
  if (!data?.length) return <EmptyChart label="Power source not consented" />;
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="period"
            tickFormatter={formatPeriod}
            stroke="var(--color-muted-foreground)"
            fontSize={11}
          />
          <YAxis
            tickFormatter={(v) => kwhTick(v as number)}
            stroke="var(--color-muted-foreground)"
            fontSize={11}
            width={48}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(l) => formatPeriod(l as string)}
            formatter={(v) => [
              `${Math.round(v as number).toLocaleString("en-IN")} kWh`,
              "Electricity",
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line
            type="monotone"
            dataKey="value"
            name="Power (kWh)"
            stroke="var(--color-chart-2)"
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FuelChart({ data }: { data: TrendPoint[] }) {
  if (!data?.length) return <EmptyChart label="Fuel / operational spend not on file" />;
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="period"
            tickFormatter={formatPeriod}
            stroke="var(--color-muted-foreground)"
            fontSize={11}
          />
          <YAxis
            tickFormatter={(v) => formatInrCompact(v as number)}
            stroke="var(--color-muted-foreground)"
            fontSize={11}
            width={56}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(l) => formatPeriod(l as string)}
            formatter={(v) => [formatInrCompact(v as number), "Fuel spend"]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line
            type="monotone"
            dataKey="value"
            name="Fuel spend (₹)"
            stroke="var(--color-chart-4)"
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Power triangulation: turnover IMPLIED by electricity consumption
 * (kWh × ₹/kWh) vs the turnover DECLARED on GST. A large positive gap means the
 * business consumes far too little power for its claimed sales — the core
 * power-vs-turnover fraud signal.
 */
export function PowerTriangulationChart({
  power,
  gst,
  sector,
}: {
  power: TrendPoint[];
  gst: TrendPoint[];
  /** Sector drives ₹/kWh so the chart matches the scoring engine. */
  sector: string;
}) {
  if (!power?.length) return <EmptyChart label="Power source not consented" h={288} />;
  const rate = rupeesPerKwh(sector);
  const gstMap = new Map(gst.map((g) => [g.period, g.value]));
  const data = power.map((p) => {
    const implied = Math.round(p.value * rate);
    const declared = gstMap.get(p.period) ?? 0;
    const pct = declared === 0 ? 0 : (declared - implied) / declared;
    return { period: p.period, implied, declared, diffPct: +(pct * 100).toFixed(1) };
  });
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="period"
            tickFormatter={formatPeriod}
            stroke="var(--color-muted-foreground)"
            fontSize={11}
          />
          <YAxis
            yAxisId="left"
            tickFormatter={(v) => formatInrCompact(v as number)}
            stroke="var(--color-muted-foreground)"
            fontSize={11}
            width={60}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="var(--color-muted-foreground)"
            fontSize={11}
            width={48}
            unit="%"
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(l) => formatPeriod(l as string)}
            formatter={(v, name) =>
              name === "Gap"
                ? [`${v}%`, name as string]
                : [formatInrCompact(v as number), name as string]
            }
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar
            yAxisId="left"
            dataKey="declared"
            name="Declared (GST)"
            fill="var(--color-primary)"
            radius={[2, 2, 0, 0]}
          />
          <Bar
            yAxisId="left"
            dataKey="implied"
            name="Power-implied"
            fill="var(--color-chart-2)"
            radius={[2, 2, 0, 0]}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="diffPct"
            name="Gap"
            stroke="var(--color-band-d)"
            strokeWidth={2}
            dot={{ r: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
