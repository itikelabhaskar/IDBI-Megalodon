import type { AuditEvent } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { verifyChain } from "@/lib/audit-hash";
import { Clock, ShieldCheck, ShieldAlert } from "lucide-react";

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  const hashed = events.some((e) => e.hash);
  const broken = hashed ? verifyChain(events) : -1;
  const intact = hashed && broken === -1;

  return (
    <div>
      {hashed && (
        <div
          className={`mb-2 inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium ${
            intact
              ? "border-band-a/40 bg-band-a/10 text-band-a"
              : "border-band-d/40 bg-band-d/10 text-band-d"
          }`}
        >
          {intact ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
          {intact ? "Tamper-evident chain verified" : `Chain broken at event ${broken + 1}`}
        </div>
      )}
      <ol className="space-y-2">
        {events.map((e, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border bg-surface">
              <Clock className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <div className="text-foreground">
                <span className="font-medium">{e.action}</span>
                {e.detail && <span className="text-muted-foreground"> — {e.detail}</span>}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {formatDateTime(e.ts)} · {e.actor}
                {e.hash && (
                  <span className="ml-1.5 font-mono text-muted-foreground/70">#{e.hash}</span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
