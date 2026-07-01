import { Link } from "@tanstack/react-router";
import type { MsmeCase } from "@/lib/types";
import {
  attentionBullets,
  missingEvidence,
  nextOfficerAction,
  primaryConcern,
  primaryStrength,
} from "@/lib/case-insights";
import { goNoGo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, FileText } from "lucide-react";

export function CaseAttentionSummary({ data }: { data: MsmeCase }) {
  const action = nextOfficerAction(data);
  const verdict = goNoGo[data.decision];
  const bullets = attentionBullets(data);
  const actionLink =
    action.label === "Check fraud"
      ? `/cases/${data.id}/fraud`
      : action.label === "Export CAM"
        ? `/cases/${data.id}/cam`
        : `/cases/${data.id}/decision`;

  return (
    <section data-no-print="true" className="border-b border-border bg-background px-4 py-3 md:px-6">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] xl:items-stretch">
        <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-primary">
              Why this case is here
            </span>
            <span className="rounded-md border border-primary/20 bg-surface px-2 py-0.5 text-xs font-semibold text-primary">
              {verdict.label}
            </span>
          </div>
          <ul className="mt-2 grid gap-1.5 text-xs text-foreground/85 sm:grid-cols-2">
            {bullets.slice(0, 4).map((bullet) => (
              <li key={bullet} className="flex min-w-0 gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="min-w-0 leading-relaxed">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-3">
          <SummaryTile icon={<CheckCircle2 className="h-4 w-4" />} label="Primary strength" value={primaryStrength(data)} tone="positive" />
          <SummaryTile icon={<AlertTriangle className="h-4 w-4" />} label="Primary concern" value={primaryConcern(data)} tone="warn" />
          <SummaryTile icon={<ClipboardCheck className="h-4 w-4" />} label="Evidence" value={missingEvidence(data)} tone="neutral" />
        </div>

        <Link
          to={actionLink}
          className="flex min-w-[180px] items-center justify-between gap-3 rounded-md border border-border bg-surface p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <span className="min-w-0">
            <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Next action
            </span>
            <span className="mt-1 block text-sm font-semibold text-foreground">{action.label}</span>
            <span className="mt-0.5 line-clamp-2 block text-[11px] leading-relaxed text-muted-foreground">
              {action.description}
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
        </Link>
      </div>
    </section>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "positive" | "warn" | "neutral";
}) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div
        className={cn(
          "flex items-center gap-2 text-[10px] uppercase tracking-widest",
          tone === "positive"
            ? "text-positive"
            : tone === "warn"
              ? "text-band-c"
              : "text-muted-foreground",
        )}
      >
        {icon}
        {label}
      </div>
      <div className="mt-1 line-clamp-2 text-xs leading-relaxed text-foreground/85">{value}</div>
    </div>
  );
}