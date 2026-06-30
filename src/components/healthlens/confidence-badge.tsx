import type { ConfidenceAssessment, ConfidenceLevel } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ShieldCheck, CircleAlert, MinusCircle, CheckCircle2 } from "lucide-react";

const tone: Record<ConfidenceLevel, string> = {
  High: "border-band-a/40 bg-band-a/10 text-band-a",
  Medium: "border-band-c/40 bg-band-c/10 text-band-c",
  Low: "border-band-d/40 bg-band-d/10 text-band-d",
};

const impactIcon = {
  positive: <CheckCircle2 className="h-3.5 w-3.5 text-band-a" />,
  negative: <CircleAlert className="h-3.5 w-3.5 text-band-d" />,
  neutral: <MinusCircle className="h-3.5 w-3.5 text-muted-foreground" />,
};

export function ConfidenceBadge({
  confidence,
  className = "",
}: {
  confidence: ConfidenceAssessment;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium ${tone[confidence.level]} ${className}`}
        >
          <ShieldCheck className="h-3 w-3" />
          {confidence.level} confidence · {confidence.score}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="text-xs font-semibold text-foreground">Assessment confidence</div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          How much to trust this assessment — from data completeness, history depth and cross-source
          agreement. This is not a credit-quality signal.
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${confidence.score}%` }}
          />
        </div>
        <ul className="mt-3 space-y-1.5">
          {confidence.factors.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px]">
              <span className="mt-0.5 shrink-0">{impactIcon[f.impact]}</span>
              <span className="min-w-0">
                <span className="font-medium text-foreground">{f.label}</span>
                <span className="text-muted-foreground"> — {f.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
