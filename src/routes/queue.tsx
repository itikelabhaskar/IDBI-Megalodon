import { createFileRoute } from "@tanstack/react-router";
import { CaseQueueTable } from "@/components/healthlens/case-queue-table";
import { listCases } from "@/lib/mock-cases";
import { leadQuality } from "@/lib/format";
import { nextOfficerAction, sourceCoverage } from "@/lib/case-insights";
import { AlertTriangle, CheckCircle2, FileWarning, ShieldAlert, UsersRound } from "lucide-react";

export const Route = createFileRoute("/queue")({
  head: () => ({
    meta: [
      { title: "Case queue · IDBI MSME HealthLens" },
      {
        name: "description",
        content:
          "Review pending MSME credit applications with HealthScore, recommended limit, decision and product route.",
      },
    ],
  }),
  component: QueuePage,
});

function QueuePage() {
  const cases = listCases();
  const priority = cases.filter((c) => leadQuality(c).label === "Priority lead").length;
  const inclusion = cases.filter((c) => leadQuality(c).label === "Inclusion lead").length;
  const manual = cases.filter((c) => nextOfficerAction(c).label === "Review route").length;
  const highRisk = cases.filter((c) => c.fraudFlags.some((f) => f.severity === "high")).length;
  const missing = cases.filter((c) => sourceCoverage(c).missing.length > 0).length;
  return (
    <div className="p-4 md:p-6 space-y-4">
      <header className="min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Credit officer workspace
        </div>
        <h1 className="mt-1 text-xl font-semibold text-foreground">Case queue</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {cases.length} MSME applications scored from consented alternate data. Sort and filter
          from the column headers.
        </p>
      </header>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <QueueMetric
          icon={<CheckCircle2 className="h-4 w-4 text-positive" />}
          label="Priority leads"
          value={priority}
          detail="Go + strong local signal"
        />
        <QueueMetric
          icon={<UsersRound className="h-4 w-4 text-band-b" />}
          label="Inclusion leads"
          value={inclusion}
          detail="NTC/NTB kept in funnel"
        />
        <QueueMetric
          icon={<FileWarning className="h-4 w-4 text-band-c" />}
          label="Manual review"
          value={manual}
          detail="Officer action needed"
        />
        <QueueMetric
          icon={<ShieldAlert className="h-4 w-4 text-band-d" />}
          label="High-risk flags"
          value={highRisk}
          detail="Triangulation review"
        />
        <QueueMetric
          icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
          label="Missing evidence"
          value={missing}
          detail="At least one source gap"
        />
      </div>
      <CaseQueueTable cases={cases} />
    </div>
  );
}

function QueueMetric({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-2 text-xl font-semibold tabular-nums text-foreground">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{detail}</div>
    </div>
  );
}
