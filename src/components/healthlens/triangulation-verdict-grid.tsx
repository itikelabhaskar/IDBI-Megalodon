import type { TriangulationVerdict } from "@/lib/case-insights";
import { cn } from "@/lib/utils";
import { AlertOctagon, AlertTriangle, CheckCircle2 } from "lucide-react";

export function TriangulationVerdictGrid({ verdicts }: { verdicts: TriangulationVerdict[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {verdicts.map((verdict) => {
        const Icon =
          verdict.status === "High concern"
            ? AlertOctagon
            : verdict.status === "Review"
              ? AlertTriangle
              : CheckCircle2;
        const tone =
          verdict.status === "High concern"
            ? "border-band-d/30 bg-band-d/10 text-band-d"
            : verdict.status === "Review"
              ? "border-band-c/30 bg-band-c/10 text-band-c"
              : "border-positive/30 bg-positive/10 text-positive";
        return (
          <div key={verdict.label} className={cn("rounded-md border p-3", tone)}>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
              <Icon className="h-3.5 w-3.5" />
              {verdict.status}
            </div>
            <div className="mt-1 text-sm font-semibold text-foreground">{verdict.label}</div>
            <div className="mt-0.5 text-[11px] leading-relaxed text-foreground/70">
              {verdict.detail}
            </div>
          </div>
        );
      })}
    </div>
  );
}