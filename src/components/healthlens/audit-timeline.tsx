import type { AuditEvent } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { Clock } from "lucide-react";

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  return (
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
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
