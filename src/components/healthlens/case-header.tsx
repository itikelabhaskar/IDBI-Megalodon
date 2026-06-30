import type { MsmeCase } from "@/lib/types";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { RiskBandChip } from "./risk-band-chip";
import { DecisionPill } from "./decision-pill";
import { Building2, Users, BadgeIndianRupee, CalendarClock, MapPin } from "lucide-react";

type TabDef = { suffix: string; label: string; pathSegment: string };

const TABS: TabDef[] = [
  { suffix: "", label: "Health Card", pathSegment: "" },
  { suffix: "/decision", label: "Decision", pathSegment: "decision" },
  { suffix: "/explain", label: "Explainability", pathSegment: "explain" },
  { suffix: "/fraud", label: "Fraud & Triangulation", pathSegment: "fraud" },
  { suffix: "/consent", label: "Consent & Fetch", pathSegment: "consent" },
  { suffix: "/cam", label: "CAM", pathSegment: "cam" },
];

export function CaseHeader({ data }: { data: MsmeCase }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const base = `/cases/${data.id}`;

  return (
    <div className="border-b border-border bg-surface" data-no-print="true">
      <div className="px-4 md:px-6 pt-4 pb-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-semibold text-foreground">{data.legalName}</h1>
              <RiskBandChip band={data.riskBand} />
              <DecisionPill decision={data.decision} />
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
            </div>
            <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-[12px] text-muted-foreground">
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
            </div>
          </div>
          <Link
            to="/queue"
            className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap"
          >
            ← Back to queue
          </Link>
        </div>
      </div>

      <nav className="px-4 md:px-6 -mb-px flex gap-1 overflow-x-auto">
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

function Meta({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="text-muted-foreground/70">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}
