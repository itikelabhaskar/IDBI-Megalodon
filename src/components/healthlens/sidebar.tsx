import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  LayoutGrid,
  Workflow,
  ShieldCheck,
  BarChart3,
  ChevronsUpDown,
  UserRound,
  Settings,
  LogOut,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { useRole, type Role } from "@/lib/role-context";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
};

const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["Credit Officer", "Risk Admin"] },
  { to: "/queue", label: "Case Queue", icon: LayoutGrid, roles: ["Credit Officer", "Risk Admin"] },
  {
    to: "/architecture",
    label: "Pilot Architecture",
    icon: Workflow,
    roles: ["Credit Officer", "Risk Admin"],
  },
  { to: "/governance", label: "Governance", icon: ShieldCheck, roles: ["Risk Admin"] },
  { to: "/portfolio", label: "Portfolio Simulator", icon: BarChart3, roles: ["Risk Admin"] },
];

export function Sidebar() {
  const { role, setRole } = useRole();
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

      <nav className="px-2">
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

      <div className="flex-1" />

      <div className="border-t border-sidebar-border/60 p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-sidebar-accent/60"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                VR
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[13px] font-medium">Vikram Rao</span>
                <span className="block truncate text-[11px] text-sidebar-foreground/60">
                  {role}
                </span>
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel>Switch role</DropdownMenuLabel>
            {(["Credit Officer", "Risk Admin"] as Role[]).map((r) => (
              <DropdownMenuItem key={r} onClick={() => setRole(r)}>
                <UserCog className="mr-2 h-4 w-4" />
                <span className="flex-1">{r}</span>
                {r === role && <span className="text-xs text-muted-foreground">active</span>}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserRound className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
