import type { RiskBand } from "@/lib/types";
import { bandTokenBg } from "@/lib/format";
import { cn } from "@/lib/utils";

export function RiskBandChip({
  band,
  className,
  size = "sm",
  compact = false,
}: {
  band: RiskBand;
  className?: string;
  size?: "sm" | "md";
  compact?: boolean;
}) {
  if (compact) {
    return (
      <span
        title={`Band ${band}`}
        className={cn(
          "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-semibold leading-none",
          bandTokenBg[band],
          className,
        )}
      >
        {band}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md border font-medium uppercase tracking-wide",
        bandTokenBg[band],
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", `bg-band-${band.toLowerCase()}`)} />
      Band {band}
    </span>
  );
}
