import { RadialBar, RadialBarChart, PolarAngleAxis, ResponsiveContainer } from "recharts";
import type { RiskBand } from "@/lib/types";
import { bandHex } from "@/lib/format";

export function HealthScoreGauge({
  score,
  band,
  size = 220,
}: {
  score: number;
  band: RiskBand;
  size?: number;
}) {
  const data = [{ name: "score", value: score, fill: bandHex[band] }];
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="78%"
          outerRadius="100%"
          data={data}
          startAngle={220}
          endAngle={-40}
          barSize={14}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "var(--color-muted)" }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          HealthScore
        </div>
        <div className="text-5xl font-bold tabular-nums" style={{ color: bandHex[band] }}>
          {score}
        </div>
        <div className="text-[11px] text-muted-foreground">out of 100</div>
      </div>
    </div>
  );
}
