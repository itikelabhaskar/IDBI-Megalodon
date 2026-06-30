import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, FileText, ShieldCheck, BarChart3, type LucideIcon } from "lucide-react";
import { useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: Array<"Credit Officer" | "Risk Admin">;
};

const NAV: NavItem[] = [
  { to: "/queue", label: "Case Queue", icon: LayoutGrid, roles: ["Credit Officer", "Risk Admin"] },
  { to: "/governance", label: "Governance", icon: ShieldCheck, roles: ["Risk Admin"] },
  { to: "/portfolio", label: "Portfolio Simulator", icon: BarChart3, roles: ["Risk Admin"] },
];

export function Sidebar() {
  const { role } = useRole();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside
      data-no-print="true"
      className="hidden md:flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border"
    >
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
            HL
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold tracking-wide">IDBI</div>
            <div className="text-[11px] text-sidebar-foreground/70">MSME HealthLens</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2">
        <div className="px-3 pb-2 text-[10px] uppercase tracking-widest text-sidebar-foreground/50">
          Workspace
        </div>
        <ul className="space-y-0.5">
          {NAV.filter((n) => n.roles.includes(role)).map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 py-4 text-[10px] leading-snug text-sidebar-foreground/55 border-t border-sidebar-border/60">
        <FileText className="inline h-3 w-3 mr-1 -mt-0.5" />
        Synthetic prototype. Not for live decisioning.
      </div>
    </aside>
  );
}
