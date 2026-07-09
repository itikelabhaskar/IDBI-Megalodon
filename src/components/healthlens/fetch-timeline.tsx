import type { DataSource, MsmeCase } from "@/lib/types";
import { sourceLabel } from "@/lib/format";
import { useEffect, useState } from "react";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "idle" | "loading" | "done" | "skipped";

const SOURCES: DataSource[] = ["GST", "AA_BANK", "UPI", "EPFO", "POWER", "FUEL", "BUREAU"];

export function FetchTimeline({ data }: { data: MsmeCase }) {
  const presence = new Map(data.dataCompleteness.map((d) => [d.source, d.available]));
  const [statuses, setStatuses] = useState<Record<DataSource, Status>>({
    GST: "idle",
    AA_BANK: "idle",
    UPI: "idle",
    EPFO: "idle",
    POWER: "idle",
    FUEL: "idle",
    BUREAU: "idle",
  });
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    // Reset on case change
    setStatuses({
      GST: "idle",
      AA_BANK: "idle",
      UPI: "idle",
      EPFO: "idle",
      POWER: "idle",
      FUEL: "idle",
      BUREAU: "idle",
    });
    setElapsed(0);

    const timers: ReturnType<typeof setTimeout>[] = [];
    let total = 0;

    SOURCES.forEach((s, i) => {
      const available = presence.get(s) ?? false;
      const start = 250 + i * 600 + Math.random() * 300;
      const finish = start + (available ? 1400 + Math.random() * 1200 : 900);
      total = Math.max(total, finish);
      timers.push(setTimeout(() => setStatuses((p) => ({ ...p, [s]: "loading" })), start));
      timers.push(
        setTimeout(
          () => setStatuses((p) => ({ ...p, [s]: available ? "done" : "skipped" })),
          finish,
        ),
      );
    });

    const ticker = setInterval(() => setElapsed((e) => e + 0.1), 100);
    timers.push(setTimeout(() => clearInterval(ticker), total + 200));

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(ticker);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.id]);

  const allSettled = SOURCES.every((s) => statuses[s] === "done" || statuses[s] === "skipped");

  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="text-xs font-semibold text-foreground/80">Fetch status</div>
        <div className="text-[11px] tabular-nums text-muted-foreground">
          {allSettled
            ? `Scored in ~${data.scoredInSeconds.toFixed(1)}s`
            : `Fetching… ${elapsed.toFixed(1)}s`}
        </div>
      </div>
      <ul className="divide-y divide-border">
        {SOURCES.map((s) => {
          const status = statuses[s];
          const available = presence.get(s) ?? false;
          return (
            <li key={s} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <StatusIcon status={status} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground">{sourceLabel[s]}</div>
                <div className="text-[11px] text-muted-foreground">
                  {status === "idle" && "Queued"}
                  {status === "loading" &&
                    (available ? "Fetching consented data…" : "Probing source…")}
                  {status === "done" && "Received"}
                  {status === "skipped" && "Source unavailable — proceeding without"}
                </div>
              </div>
              <div
                className={cn(
                  "text-[10px] uppercase tracking-wide font-medium",
                  status === "done" && "text-band-a",
                  status === "skipped" && "text-muted-foreground",
                  status === "loading" && "text-primary",
                  status === "idle" && "text-muted-foreground/60",
                )}
              >
                {status === "done"
                  ? "OK"
                  : status === "skipped"
                    ? "Skipped"
                    : status === "loading"
                      ? "…"
                      : "—"}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StatusIcon({ status }: { status: Status }) {
  if (status === "done")
    return (
      <span className="grid h-6 w-6 place-items-center rounded-full bg-band-a/15 text-band-a">
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  if (status === "skipped")
    return (
      <span className="grid h-6 w-6 place-items-center rounded-full bg-muted text-muted-foreground">
        <AlertCircle className="h-3.5 w-3.5" />
      </span>
    );
  if (status === "loading")
    return (
      <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-primary">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      </span>
    );
  return (
    <span className="grid h-6 w-6 place-items-center rounded-full border border-dashed border-border" />
  );
}
