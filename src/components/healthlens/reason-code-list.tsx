import type { ReasonCode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Plus, Minus } from "lucide-react";

export function ReasonCodeList({
  reasons,
  className,
}: {
  reasons: ReasonCode[];
  className?: string;
}) {
  const positives = reasons.filter((r) => r.polarity === "positive");
  const negatives = reasons.filter((r) => r.polarity === "negative");

  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)}>
      <Column title="Positive behaviour signals" tone="positive" items={positives} />
      <Column title="Adverse behaviour signals" tone="negative" items={negatives} />
    </div>
  );
}

function Column({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "positive" | "negative";
  items: ReasonCode[];
}) {
  const Icon = tone === "positive" ? Plus : Minus;
  const swatch =
    tone === "positive"
      ? "bg-positive/10 text-positive border-positive/30"
      : "bg-negative/10 text-negative border-negative/30";

  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="border-b border-border px-3 py-2 text-xs font-semibold text-foreground/80">
        {title}
        <span className="ml-2 text-muted-foreground font-normal">({items.length})</span>
      </div>
      <ul className="divide-y divide-border">
        {items.length === 0 && <li className="px-3 py-3 text-xs text-muted-foreground">None.</li>}
        {items.map((r) => (
          <li key={r.code} className="flex items-start gap-2 px-3 py-2.5">
            <span
              className={cn(
                "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border",
                swatch,
              )}
            >
              <Icon className="h-3 w-3" />
            </span>
            <div className="min-w-0">
              <div className="text-sm text-foreground">{r.label}</div>
              <div className="text-[10px] font-mono text-muted-foreground">{r.code}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
