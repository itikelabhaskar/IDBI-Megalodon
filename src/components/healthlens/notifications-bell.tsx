import { useWorkflow } from "@/lib/workflow";
import { getCase } from "@/lib/mock-cases";
import { Link } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Bell, ShieldCheck, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Workflow-driven alerts: cases the officer/checker still needs to action. */
export function NotificationsBell() {
  const { map } = useWorkflow();
  const entries = Object.entries(map);
  const pending = entries.filter(([, w]) => w.status === "Pending checker");
  const returned = entries.filter(([, w]) => w.status === "Returned");
  const count = pending.length + returned.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative grid h-8 w-8 place-items-center rounded-md border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-band-d px-1 text-[9px] font-bold text-white">
              {count}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <span className="text-[10px] font-normal text-muted-foreground">{count} to action</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {count === 0 ? (
          <div className="px-2 py-6 text-center text-xs text-muted-foreground">
            No pending actions. Recommendations you route to a checker will appear here.
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto py-1">
            {pending.map(([id, w]) => (
              <Row
                key={id}
                id={id}
                icon={<ShieldCheck className="h-3.5 w-3.5 text-accent" />}
                title={`Awaiting checker · ${w.makerDecision ?? ""}`}
                sub={`${getCase(id)?.legalName ?? id} — recommended by ${w.makerBy ?? "maker"}`}
              />
            ))}
            {returned.map(([id, w]) => (
              <Row
                key={id}
                id={id}
                icon={<Undo2 className="h-3.5 w-3.5 text-band-c" />}
                title="Returned for rework"
                sub={`${getCase(id)?.legalName ?? id}${w.checkerNote ? ` — ${w.checkerNote}` : ""}`}
              />
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Row({
  id,
  icon,
  title,
  sub,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <Link
      to="/cases/$id/decision"
      params={{ id }}
      className={cn(
        "flex items-start gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted",
      )}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs font-medium text-foreground">{title}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{sub}</span>
      </span>
    </Link>
  );
}
