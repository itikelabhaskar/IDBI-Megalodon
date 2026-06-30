import type { Decision } from "@/lib/types";
import { decisionTone } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

export function DecisionPill({ decision, className }: { decision: Decision; className?: string }) {
  const Icon = decision === "Approve" ? CheckCircle2 : decision === "Refer" ? AlertCircle : XCircle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
        decisionTone[decision],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {decision}
    </span>
  );
}
