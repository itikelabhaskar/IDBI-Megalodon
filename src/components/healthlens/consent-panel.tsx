import type { MsmeCase } from "@/lib/types";
import { sourceLabel } from "@/lib/format";
import { Shield, RefreshCcw, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ConsentPanel({ data }: { data: MsmeCase }) {
  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Shield className="h-4 w-4 text-primary" />
        <div className="text-sm font-semibold">Account Aggregator consent</div>
        <span className="ml-auto text-[10px] uppercase tracking-widest text-band-a font-medium">
          Active
        </span>
      </div>
      <dl className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
        <Item
          icon={<Calendar className="h-3.5 w-3.5" />}
          label="Purpose"
          value="MSME credit assessment (HealthLens)"
        />
        <Item icon={<Clock className="h-3.5 w-3.5" />} label="Data range" value="Last 12 months" />
        <Item icon={<Calendar className="h-3.5 w-3.5" />} label="Data life" value="30 days" />
        <Item
          icon={<RefreshCcw className="h-3.5 w-3.5" />}
          label="Fetch mode"
          value="One-time fetch"
        />
      </dl>
      <div className="border-t border-border px-4 py-3">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          Consented FI types
        </div>
        <div className="flex flex-wrap gap-1.5">
          {data.dataCompleteness.map((d) => (
            <span
              key={d.source}
              className={
                d.available
                  ? "rounded-md border border-band-a/30 bg-band-a/10 px-2 py-0.5 text-[11px] text-band-a"
                  : "rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground line-through"
              }
            >
              {sourceLabel[d.source]}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs">
        <span className="text-muted-foreground">
          Borrower may revoke consent at any time via the AA app.
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            toast.message("Revocation request would be sent to the AA in production.", {
              description: "Prototype only — no action taken.",
            })
          }
        >
          Revoke
        </Button>
      </div>
    </div>
  );
}

function Item({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-surface px-4 py-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}
