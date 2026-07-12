import type { SchemeReadiness } from "@/lib/scoring/decision";
import { CheckCircle2, CircleDashed } from "lucide-react";

/** Multi-scheme eligibility coach — gaps checklist beside Path-to-credit. */
export function SchemeReadinessPanel({ schemes }: { schemes: SchemeReadiness[] }) {
  if (!schemes.length) return null;
  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="border-b border-border px-4 py-2.5 text-xs font-semibold text-foreground/80">
        Scheme readiness
        <span className="ml-2 font-normal text-muted-foreground">
          Mudra · SVANidhi · CGTMSE · GeM · i-MSME
        </span>
      </div>
      <ul className="divide-y divide-border">
        {schemes.map((s) => (
          <li key={s.scheme} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {s.eligible ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-band-a" />
                  ) : (
                    <CircleDashed className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                  {s.scheme}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.note}</p>
              </div>
              <span
                className={
                  s.eligible
                    ? "shrink-0 rounded-md border border-band-a/30 bg-band-a/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-band-a"
                    : "shrink-0 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                }
              >
                {s.eligible ? "Ready" : "Gaps"}
              </span>
            </div>
            {!s.eligible && s.gaps.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-[11px] text-muted-foreground">
                {s.gaps.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
