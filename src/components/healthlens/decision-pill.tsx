import type { Decision } from "@/lib/types";
import { decisionTone, decisionToneSolid } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

export function DecisionPill({
  decision,
  className,
  variant = "soft",
  size = "sm",
}: {
  decision: Decision;
  className?: string;
  variant?: "soft" | "solid";
  size?: "sm" | "md";
}) {
  const Icon = decision === "Approve" ? CheckCircle2 : decision === "Refer" ? AlertCircle : XCircle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border font-semibold",
        size === "md" ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs",
        variant === "solid" ? decisionToneSolid[decision] : decisionTone[decision],
        className,
      )}
    >
      <Icon className={size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"} />
      {decision}
    </span>
  );
}
