import type { MsmeCase } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DecisionPill } from "./decision-pill";
import { RiskBandChip } from "./risk-band-chip";
import { formatInr, goNoGo } from "@/lib/format";
import { OfficerOverrideDialog } from "./officer-override-dialog";

export function DecisionPanel({ data }: { data: MsmeCase }) {
  const cgtmse = data.productRoute === "CGTMSE";
  const manual = data.productRoute === "Manual Review";
  const verdict = goNoGo[data.decision];

  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Engine recommendation
          </div>
          <div className="mt-1 flex items-center gap-2">
            <DecisionPill decision={data.decision} />
            <span className="text-sm font-semibold text-foreground">{verdict.label}</span>
            <RiskBandChip band={data.riskBand} />
            {cgtmse && (
              <span className="rounded-md border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                CGTMSE eligible
              </span>
            )}
            {manual && (
              <span className="rounded-md border border-band-c/40 bg-band-c/10 px-2 py-0.5 text-[10px] font-medium text-band-c">
                Manual review flag
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{verdict.hint}</div>
        </div>
        <OfficerOverrideDialog
          decision={data.decision}
          trigger={
            <Button variant="outline" size="sm">
              Officer override
            </Button>
          }
        />
      </div>

      <dl className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
        <Stat
          label="Recommended limit"
          value={data.recommendedLimit > 0 ? formatInr(data.recommendedLimit) : "—"}
        />
        <Stat label="Requested amount" value={formatInr(data.requestedAmount)} muted />
        <Stat label="Tenor" value={data.tenorMonths > 0 ? `${data.tenorMonths} months` : "—"} />
        <Stat label="Detected need" value={data.detectedBusinessNeed} />
      </dl>
    </div>
  );
}

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="bg-surface px-4 py-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div
        className={`mt-1 text-base font-semibold tabular-nums ${muted ? "text-muted-foreground" : "text-foreground"}`}
      >
        {value}
      </div>
    </div>
  );
}
