import type { MsmeCase } from "@/lib/types";
import type { ClusterRisk } from "@/lib/types";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { formatInrCompact, goNoGo, decisionToneSolid } from "@/lib/format";
import { RiskBandChip } from "./risk-band-chip";
import { DecisionPill } from "./decision-pill";
import { ConfidenceBadge } from "./confidence-badge";
import {
  Building2,
  Users,
  BadgeIndianRupee,
  CalendarClock,
  MapPin,
  Database,
  Route,
} from "lucide-react";

type TabDef = { suffix: string; label: string; pathSegment: string };

const TABS: TabDef[] = [
  { suffix: "", label: "Health Card", pathSegment: "" },
  { suffix: "/decision", label: "Decision", pathSegment: "decision" },
  { suffix: "/guidance", label: "Applicant guidance", pathSegment: "guidance" },
  { suffix: "/explain", label: "Explainability", pathSegment: "explain" },
  { suffix: "/fraud", label: "Fraud & Triangulation", pathSegment: "fraud" },
  { suffix: "/consent", label: "Consent & Fetch", pathSegment: "consent" },
  { suffix: "/cam", label: "CAM", pathSegment: "cam" },
];

export function CaseHeader({ data }: { data: MsmeCase }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const base = `/cases/${data.id}`;
  const availableSources = data.dataCompleteness.filter((d) => d.available).length;
  const verdict = goNoGo[data.decision];

  return (
    <div
      className="z-30 border-b border-border bg-surface/95 backdrop-blur md:sticky md:top-0"
      data-no-print="true"
    >
      <div className="px-4 pt-3 pb-2 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-semibold text-foreground">{data.legalName}</h1>
              <RiskBandChip band={data.riskBand} size="md" />
              <DecisionPill decision={data.decision} variant="solid" size="md" />
              {data.womenOwned && (
                <span className="rounded-md border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                  Women-owned
                </span>
              )}
              {data.ntcNtb && (
                <span className="rounded-md border border-band-b/40 bg-band-b/10 px-2 py-0.5 text-[10px] font-medium text-band-b">
                  NTC/NTB
                </span>
              )}
              <ClusterRiskChip risk={data.clusterRisk} />
              <ConfidenceBadge confidence={data.confidence} />
            </div>
            <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-1 text-[12px] text-muted-foreground sm:grid-cols-4 xl:grid-cols-6">
              <Meta icon={<Building2 className="h-3 w-3" />} label={data.constitution} />
              <Meta icon={<Users className="h-3 w-3" />} label={data.sector} />
              <Meta icon={<MapPin className="h-3 w-3" />} label={data.clusterCity} />
              <Meta
                icon={<CalendarClock className="h-3 w-3" />}
                label={`${data.vintageMonths}m vintage`}
              />
              <Meta
                icon={<BadgeIndianRupee className="h-3 w-3" />}
                label={`GSTIN ${data.gstin ?? "—"}`}
              />
              <Meta
                icon={<Database className="h-3 w-3" />}
                label={`${availableSources}/${data.dataCompleteness.length} sources available`}
              />
            </div>
          </div>
          <Link
            to="/queue"
            className="text-xs whitespace-nowrap text-muted-foreground hover:text-foreground"
          >
            Back to queue
          </Link>
        </div>

        <div className="mt-2 flex max-w-full flex-wrap items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs xl:flex-nowrap xl:overflow-hidden">
          <span className="shrink-0 text-[10px] uppercase tracking-widest text-muted-foreground">
            Underwriter view
          </span>
          <span
            className={cn(
              "shrink-0 rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-wide",
              decisionToneSolid[data.decision],
            )}
          >
            {verdict.label}
          </span>
          <span className="min-w-0 flex-[1_1_160px] truncate text-[11px] text-muted-foreground">
            {verdict.hint}
          </span>
          <CommandStat
            label="Recommended"
            value={data.recommendedLimit > 0 ? formatInrCompact(data.recommendedLimit) : "—"}
          />
          <CommandStat label="Requested" value={formatInrCompact(data.requestedAmount)} muted />
          <CommandStat label="HealthScore" value={`${data.healthScore}/100`} />
          <CommandStat
            label="ML proxy"
            value={`${(data.mlProbabilityProxy * 100).toFixed(0)}%`}
            muted
          />
          <span className="inline-flex min-w-0 max-w-full shrink-0 items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-[11px] text-primary sm:w-36">
            <Route className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{data.productRoute}</span>
          </span>
        </div>
      </div>

      <nav className="-mb-px flex max-w-full gap-1 overflow-x-auto px-4 md:px-6">
        {TABS.map((t) => {
          const fullPath = base + t.suffix;
          const active =
            t.suffix === ""
              ? pathname === base || pathname === base + "/"
              : pathname === fullPath || pathname === fullPath + "/";
          return (
            <button
              key={t.label}
              type="button"
              onClick={() => navigate({ to: fullPath })}
              className={cn(
                "border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors cursor-pointer",
                active
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function CommandStat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="inline-flex shrink-0 items-baseline gap-1.5 rounded-md border border-border bg-surface px-2 py-1 whitespace-nowrap">
      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <div
        className={cn(
          "text-sm font-semibold tabular-nums",
          muted ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function Meta({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="text-muted-foreground/70">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}

const clusterTone: Record<ClusterRisk["band"], string> = {
  Low: "border-band-a/40 bg-band-a/10 text-band-a",
  Moderate: "border-band-b/40 bg-band-b/10 text-band-b",
  Elevated: "border-band-c/40 bg-band-c/10 text-band-c",
  High: "border-band-d/40 bg-band-d/10 text-band-d",
};

function ClusterRiskChip({ risk }: { risk: ClusterRisk }) {
  return (
    <span
      title={`${risk.cluster}: avg HealthScore ${risk.avgHealthScore} across ${risk.peerCount} MSMEs`}
      className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${clusterTone[risk.band]}`}
    >
      Cluster {risk.band}
    </span>
  );
}
