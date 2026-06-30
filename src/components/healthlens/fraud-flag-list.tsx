import type { FraudFlag } from "@/lib/types";
import { AlertOctagon, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function FraudFlagList({ flags }: { flags: FraudFlag[] }) {
  if (!flags.length) {
    return (
      <div className="rounded-md border border-band-a/30 bg-band-a/10 px-3 py-3 text-sm text-band-a">
        No fraud or data-quality flags raised.
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {flags.map((f) => {
        const Icon =
          f.severity === "high" ? AlertOctagon : f.severity === "warn" ? AlertTriangle : Info;
        const tone =
          f.severity === "high"
            ? "border-band-d/40 bg-band-d/10 text-band-d"
            : f.severity === "warn"
              ? "border-band-c/40 bg-band-c/10 text-band-c"
              : "border-border bg-muted/40 text-muted-foreground";
        return (
          <li
            key={f.code}
            className={cn("flex items-start gap-3 rounded-md border px-3 py-2.5", tone)}
          >
            <Icon className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{f.label}</div>
              <div className="text-[10px] font-mono opacity-70">
                {f.code} · {f.severity.toUpperCase()}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
