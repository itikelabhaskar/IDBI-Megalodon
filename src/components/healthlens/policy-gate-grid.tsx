import type { PolicyGate } from "@/lib/case-insights";
import { cn } from "@/lib/utils";
import { AlertOctagon, AlertTriangle, CheckCircle2 } from "lucide-react";

export function PolicyGateGrid({ gates }: { gates: PolicyGate[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
      {gates.map((gate) => {
        const Icon =
          gate.status === "High concern"
            ? AlertOctagon
            : gate.status === "Review"
              ? AlertTriangle
              : CheckCircle2;
        const tone =
          gate.status === "High concern"
            ? "border-band-d/30 bg-band-d/10 text-band-d"
            : gate.status === "Review"
              ? "border-band-c/30 bg-band-c/10 text-band-c"
              : "border-positive/30 bg-positive/10 text-positive";
        return (
          <div key={gate.label} className={cn("rounded-md border p-3", tone)}>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
              <Icon className="h-3.5 w-3.5" />
              {gate.status}
            </div>
            <div className="mt-1 text-sm font-semibold text-foreground">{gate.label}</div>
            <div className="mt-0.5 text-[11px] leading-relaxed text-foreground/70">
              {gate.detail}
            </div>
          </div>
        );
      })}
    </div>
  );
}