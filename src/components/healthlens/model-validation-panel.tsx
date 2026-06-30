import {
  calibrationCurve,
  bandPdTable,
  championChallengerModels,
} from "@/lib/analytics/calibration";
import { psiByFeature, type PsiStatus } from "@/lib/analytics/drift";
import {
  LineChart,
  Line,
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

const psiTone: Record<PsiStatus, string> = {
  Stable: "border-band-a/40 bg-band-a/10 text-band-a",
  Watch: "border-band-c/40 bg-band-c/10 text-band-c",
  Shift: "border-band-d/40 bg-band-d/10 text-band-d",
};

export function ModelValidationPanel() {
  const cc = championChallengerModels();
  const calib = calibrationCurve().map((b) => ({ ...b, ideal: b.meanPredicted }));
  const bands = bandPdTable();
  const psi = psiByFeature();

  return (
    <section className="space-y-4">
      <header>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Model validation
        </div>
        <h2 className="mt-0.5 text-sm font-semibold text-foreground">
          Calibration, champion–challenger &amp; drift
        </h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Champion vs challenger">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="text-left font-medium pb-1.5">Model</th>
                <th className="text-right font-medium pb-1.5">AUC (book)</th>
                <th className="text-right font-medium pb-1.5">KS</th>
                <th className="text-right font-medium pb-1.5">AUC (held-out)</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              <tr className="border-t border-border">
                <td className="py-1.5">Logistic (champion)</td>
                <td className="text-right">{cc.champion.auc.toFixed(3)}</td>
                <td className="text-right">{cc.champion.ks.toFixed(3)}</td>
                <td className="text-right">{cc.championAucHeldOut.toFixed(3)}</td>
              </tr>
              <tr className="border-t border-border">
                <td className="py-1.5">GBM (challenger)</td>
                <td className="text-right">{cc.challenger.auc.toFixed(3)}</td>
                <td className="text-right">{cc.challenger.ks.toFixed(3)}</td>
                <td className="text-right">{cc.challengerAucHeldOut.toFixed(3)}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-muted-foreground">
            The flexible GBM matches the monotonic scorecard within noise, so HealthLens keeps the
            explainable champion as the control. Book AUC is in-sample; held-out AUC is from the
            model card.
          </p>
        </Panel>

        <Panel title="Reliability (predicted vs observed default rate)">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={calib} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="meanPredicted"
                  type="number"
                  domain={[0, 1]}
                  tickFormatter={(v) => `${Math.round((v as number) * 100)}%`}
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                />
                <YAxis
                  domain={[0, 1]}
                  tickFormatter={(v) => `${Math.round((v as number) * 100)}%`}
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                  width={36}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => `${Math.round((v as number) * 100)}%`}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="ideal"
                  name="Perfect"
                  stroke="var(--color-muted-foreground)"
                  strokeDasharray="4 4"
                  dot={false}
                  strokeWidth={1}
                />
                <Line
                  type="monotone"
                  dataKey="observed"
                  name="Observed"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Risk band → expected vs observed PD">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="text-left font-medium pb-1.5">Band</th>
                <th className="text-right font-medium pb-1.5">n</th>
                <th className="text-right font-medium pb-1.5">Predicted PD</th>
                <th className="text-right font-medium pb-1.5">Observed PD</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {bands.map((b) => (
                <tr key={b.band} className="border-t border-border">
                  <td className="py-1.5">Band {b.band}</td>
                  <td className="text-right">{b.count}</td>
                  <td className="text-right">{Math.round(b.predictedPd * 100)}%</td>
                  <td className="text-right">{Math.round(b.observedPd * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Feature drift — PSI vs training reference">
          <ul className="space-y-1 text-sm">
            {psi.map((r) => (
              <li key={r.key} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-foreground/90">{r.label}</span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums text-muted-foreground">{r.psi.toFixed(3)}</span>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${psiTone[r.status]}`}
                  >
                    {r.status}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-muted-foreground">
            PSI &lt; 0.1 stable · 0.1–0.25 watch · &gt; 0.25 retrain. Live monitor against the
            training distribution.
          </p>
        </Panel>
      </div>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="border-b border-border px-4 py-2.5 text-xs font-semibold text-foreground/80">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
