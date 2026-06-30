import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Contribution } from "@/lib/types";

export function ContributionChart({ contributions }: { contributions: Contribution[] }) {
  const data = [...contributions]
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    .map((c) => ({ ...c, abs: Math.abs(c.weight) }));

  if (data.length === 0) {
    return (
      <div className="grid h-48 place-items-center text-xs text-muted-foreground">
        No contribution data.
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height: Math.max(220, data.length * 32) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 32, bottom: 8, left: 8 }}>
          <XAxis
            type="number"
            domain={[-1, 1]}
            ticks={[-1, -0.5, 0, 0.5, 1]}
            tickFormatter={(v) => v.toFixed(1)}
            stroke="var(--color-muted-foreground)"
            fontSize={11}
          />
          <YAxis
            type="category"
            dataKey="label"
            stroke="var(--color-muted-foreground)"
            fontSize={11}
            width={180}
            tick={{ fill: "var(--color-foreground)" }}
          />
          <ReferenceLine x={0} stroke="var(--color-border)" />
          <Tooltip
            cursor={{ fill: "var(--color-muted)" }}
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              fontSize: 12,
            }}
            formatter={(_, __, p) => [
              (p.payload as Contribution).weight.toFixed(2),
              "Contribution",
            ]}
          />
          <Bar dataKey="weight" radius={3}>
            {data.map((d) => (
              <Cell
                key={d.feature}
                fill={d.weight >= 0 ? "var(--color-band-a)" : "var(--color-band-d)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
