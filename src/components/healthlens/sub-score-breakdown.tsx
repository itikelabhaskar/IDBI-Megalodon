import type { SubScores } from "@/lib/types";
import { cn } from "@/lib/utils";

const LABELS: Array<{ key: keyof SubScores; label: string }> = [
  { key: "gst", label: "GST" },
  { key: "bank", label: "Bank cash-flow" },
  { key: "upi", label: "UPI" },
  { key: "epfo", label: "EPFO" },
  { key: "operations", label: "Power / fuel ops" },
  { key: "compliance", label: "Compliance" },
  { key: "bureau", label: "Bureau-lite" },
];

function toneFor(v: number): string {
  if (v >= 75) return "bg-band-a";
  if (v >= 60) return "bg-band-b";
  if (v >= 45) return "bg-band-c";
  return "bg-band-d";
}

export function SubScoreBreakdown({
  subScores,
  className,
}: {
  subScores: SubScores;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {LABELS.map(({ key, label }) => {
        const v = subScores[key];
        const missing = v === null;
        return (
          <div key={key} className="grid grid-cols-[110px_minmax(0,1fr)_44px] items-center gap-3">
            <div className="text-xs text-muted-foreground truncate">{label}</div>
            <div className="relative h-2 rounded-full bg-muted overflow-hidden">
              {!missing && (
                <div
                  className={cn("absolute inset-y-0 left-0 rounded-full", toneFor(v as number))}
                  style={{ width: `${v}%` }}
                />
              )}
            </div>
            <div className="text-xs tabular-nums text-right">
              {missing ? (
                <span className="text-muted-foreground italic">N/A</span>
              ) : (
                <span className="font-medium">{v}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
