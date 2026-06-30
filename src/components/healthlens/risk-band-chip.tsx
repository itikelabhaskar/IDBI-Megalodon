import type { RiskBand } from "@/lib/types";
import { bandTokenBg } from "@/lib/format";
import { cn } from "@/lib/utils";

export function RiskBandChip({
  band,
  className,
  size = "sm",
}: {
  band: RiskBand;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border font-medium uppercase tracking-wide",
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
