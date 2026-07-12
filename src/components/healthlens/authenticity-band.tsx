import type { AuthenticityAssessment } from "@/lib/types";
import { authenticityTone } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Compact authenticity band chip — HealthLens power/fuel corroboration. */
export function AuthenticityBand({
  authenticity,
  className,
  showSummary = false,
}: {
  authenticity: AuthenticityAssessment;
  className?: string;
  showSummary?: boolean;
}) {
  return (
    <div className={cn("inline-flex flex-col gap-1", className)}>
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold",
          authenticityTone[authenticity.band],
        )}
      >
        Authenticity · {authenticity.band}
      </span>
      {showSummary && (
        <p className="text-[11px] leading-snug text-muted-foreground">{authenticity.summary}</p>
      )}
    </div>
  );
}
