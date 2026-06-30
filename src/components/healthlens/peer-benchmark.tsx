import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

export function PeerBenchmark({
  percentile,
  sector,
  cluster,
  className,
}: {
  percentile: number;
  sector?: string;
  cluster?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-md border border-border bg-surface p-3", className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1 min-w-0 truncate">
          {cluster && <MapPin className="h-3 w-3 shrink-0" />}
          <span className="truncate">
            {cluster ? `${sector ?? "Sector"} peers in ${cluster}` : "Peer / cluster percentile"}
          </span>
        </span>
        <span className="font-medium text-foreground tabular-nums">P{percentile}</span>
      </div>
      <div className="relative mt-2 h-2 rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 bg-primary/20 rounded-full"
          style={{ width: "100%" }}
        />
        <div
          className="absolute -top-1 h-4 w-1.5 rounded-sm bg-primary"
          style={{ left: `calc(${percentile}% - 3px)` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
        <span>P0</span>
        <span>P50</span>
        <span>P100</span>
      </div>
    </div>
  );
}
