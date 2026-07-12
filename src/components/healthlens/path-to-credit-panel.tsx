import type { PathToCreditAction } from "@/lib/types";
import { ArrowRight } from "lucide-react";

export function PathToCreditPanel({ actions }: { actions: PathToCreditAction[] }) {
  if (!actions.length) return null;
  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="border-b border-border px-4 py-2.5 text-xs font-semibold text-foreground/80">
        Path to credit
        <span className="ml-2 font-normal text-muted-foreground">
          {actions.length} actions to unlock higher limit
        </span>
      </div>
      <ol className="divide-y divide-border">
        {actions.map((a, i) => (
          <li key={i} className="flex gap-3 px-4 py-3">
            <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
              {i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
                {a.action}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">{a.rationale}</div>
              {a.scheme && (
                <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-primary">
                  Scheme: {a.scheme}
                </div>
              )}
              {a.gaps && a.gaps.length > 0 && (
                <ul className="mt-1 list-inside list-disc text-[11px] text-muted-foreground">
                  {a.gaps.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
