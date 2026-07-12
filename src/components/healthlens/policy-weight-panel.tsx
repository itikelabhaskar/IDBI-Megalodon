import type { PolicyWeightRow } from "@/lib/scoring/policy-weights";
import { cn } from "@/lib/utils";

/** Auditor pane: how present HealthScore rails re-normalise into policy weights. */
export function PolicyWeightPanel({
  rows,
  healthScore,
}: {
  rows: PolicyWeightRow[];
  healthScore: number;
}) {
  const present = rows.filter((r) => r.present);
  const absent = rows.filter((r) => !r.present);
  return (
    <section className="rounded-md border border-border bg-surface">
      <header className="border-b border-border px-4 py-3">
        <div className="text-[10px] uppercase tracking-widest text-primary font-semibold">
          (c) Policy weight view
        </div>
        <div className="mt-0.5 text-sm font-semibold text-foreground">
          How each present rail contributes to HealthScore {healthScore}/100
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Missing rails are excluded and remaining weights re-normalise — thin-file MSMEs are not
          silently punished for absent EPFO or GST. This is the HealthLens scorecard, not a bureau
          WOE table.
        </p>
      </header>
      <div className="space-y-2.5 p-4">
        {present.map((r) => (
          <div key={r.key} className="grid grid-cols-[minmax(0,1fr)_4.5rem_3.5rem] items-center gap-2">
            <div className="min-w-0">
              <div className="truncate text-xs font-medium text-foreground">{r.label}</div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, r.weight * 100)}%` }}
                />
              </div>
            </div>
            <div className="text-right text-[11px] tabular-nums text-muted-foreground">
              {(r.weight * 100).toFixed(0)}% wt
            </div>
            <div className="text-right text-xs font-semibold tabular-nums text-foreground">
              {r.score}
            </div>
          </div>
        ))}
      </div>
      {absent.length > 0 && (
        <div className="border-t border-border bg-muted/30 px-4 py-2.5 text-[11px] text-muted-foreground">
          Absent rails (weight redistributed):{" "}
          <span className="text-foreground/80">
            {absent.map((r) => r.label.split(" ")[0]).join(", ")}
          </span>
        </div>
      )}
      <div className="border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
        Weighted sum of present contributions ≈{" "}
        <span className={cn("font-semibold tabular-nums text-foreground")}>
          {Math.round(present.reduce((s, r) => s + r.contribution, 0))}
        </span>{" "}
        (matches HealthScore after rounding).
      </div>
    </section>
  );
}
