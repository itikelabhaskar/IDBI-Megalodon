import type { NetworkConcentration } from "@/lib/analytics/network-concentration";
import { cn } from "@/lib/utils";

const bandTone: Record<NetworkConcentration["band"], string> = {
  Diversified: "border-band-a/40 bg-band-a/10 text-band-a",
  Watch: "border-band-c/40 bg-band-c/10 text-band-c",
  Concentrated: "border-band-d/40 bg-band-d/10 text-band-d",
};

/** Fraud-tab concentration map from GST buyers + UPI — HealthLens naming. */
export function NetworkConcentrationPanel({ data }: { data: NetworkConcentration }) {
  return (
    <section className="rounded-md border border-border bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Trade &amp; payment concentration
          </div>
          <div className="mt-0.5 text-sm font-semibold text-foreground">
            Who the MSME depends on
          </div>
        </div>
        <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-semibold", bandTone[data.band])}>
          {data.band}
        </span>
      </header>
      <div className="p-4">
        <p className="mb-3 text-xs text-muted-foreground">{data.summary}</p>
        {data.nodes.length === 0 ? (
          <p className="text-xs text-muted-foreground">No concentration nodes available.</p>
        ) : (
          <ul className="space-y-2">
            {data.nodes.map((n) => (
              <li key={`${n.rail}-${n.name}`} className="grid grid-cols-[minmax(0,1fr)_3rem] items-center gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs font-medium text-foreground">{n.name}</span>
                    <span className="shrink-0 text-[9px] uppercase tracking-wide text-muted-foreground">
                      {n.rail}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/80"
                      style={{ width: `${Math.min(100, n.share * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-right text-xs font-semibold tabular-nums text-foreground">
                  {Math.round(n.share * 100)}%
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
