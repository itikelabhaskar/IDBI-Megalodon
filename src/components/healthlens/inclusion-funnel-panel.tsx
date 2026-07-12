import type { InclusionFunnelStory } from "@/lib/analytics/inclusion-story";
import { Users } from "lucide-react";

/** Dashboard inclusion narrative — HealthLens funnel, not a peer lift badge. */
export function InclusionFunnelPanel({ story }: { story: InclusionFunnelStory }) {
  if (story.ntcCount === 0) return null;
  return (
    <section className="rounded-md border border-band-b/30 bg-band-b/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Users className="h-4 w-4 text-band-b" />
            Inclusion funnel — credit-invisible MSMEs
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{story.headline}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{story.note}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold tabular-nums text-band-b">{story.inclusionLiftPct}%</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            kept in funnel
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        <FunnelCell
          label="Bureau-thin baseline"
          value={`${story.bureauOnlyRejectPct}%`}
          hint="illustrative auto-decline"
        />
        <FunnelCell
          label="NTC / NTB in book"
          value={String(story.ntcCount)}
          hint="credit-invisible cohort"
        />
        <FunnelCell
          label="Advanceable (A/R)"
          value={String(story.rescuedToAdvance)}
          hint="Approve or Refer"
        />
        <FunnelCell
          label="Incomplete (evidence gate)"
          value={String(story.incompleteCount)}
          hint="not silent reject"
        />
      </div>
    </section>
  );
}

function FunnelCell({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-md border border-border/80 bg-surface px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground">{hint}</div>
    </div>
  );
}
