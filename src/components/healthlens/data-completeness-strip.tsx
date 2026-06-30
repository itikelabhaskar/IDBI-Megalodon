import type { DataCompleteness } from "@/lib/types";
import { sourceLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

export function DataCompletenessStrip({
  items,
  showLabels = true,
  className,
}: {
  items: DataCompleteness[];
  showLabels?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {items.map((d) => (
        <div
          key={d.source}
          title={`${sourceLabel[d.source]} — ${
            d.available
              ? `${d.monthsCovered ?? ""}${d.monthsCovered ? "m" : "available"}`
              : "missing"
          }`}
          className={cn(
            "flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-medium",
            d.available
              ? "border-band-a/30 bg-band-a/10 text-band-a"
              : "border-border bg-muted text-muted-foreground line-through",
          )}
        >
          {showLabels && <span>{sourceLabel[d.source]}</span>}
          {d.available && d.monthsCovered ? (
            <span className="opacity-70">{d.monthsCovered}m</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
