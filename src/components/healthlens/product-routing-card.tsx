import type { MsmeCase } from "@/lib/types";

export function ProductRoutingCard({ data }: { data: MsmeCase }) {
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        Product route
      </div>
      <div className="mt-1 flex items-center gap-2">
        <div className="text-base font-semibold text-foreground">{data.productRoute}</div>
      </div>
      <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{data.productRouteReason}</p>
    </div>
  );
}
