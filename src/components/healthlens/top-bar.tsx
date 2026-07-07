import { useRole, type Role } from "@/lib/role-context";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandMark } from "./brand";
import { NotificationsBell } from "./notifications-bell";
import { UserCog, FlaskConical, UserRound, Settings, LogOut } from "lucide-react";

export function TopBar() {
  const { role, setRole } = useRole();
  const roles: Role[] = ["Credit Officer", "Risk Admin"];

  return (
    <header
      data-no-print="true"
      className="h-14 shrink-0 border-b border-border bg-surface flex items-center px-4 md:px-6 gap-3"
    >
      <div className="flex items-center gap-2 md:hidden">
        <BrandMark className="h-7 w-7" />
        <span className="text-sm font-semibold text-foreground">IDBI HealthLens</span>
      </div>
      <div className="hidden md:flex items-center gap-2 min-w-0">
        <span className="text-sm font-semibold text-foreground">IDBI MSME HealthLens</span>
        <span className="text-xs text-muted-foreground">/ Credit decision workbench</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Badge
          variant="outline"
          className="hidden sm:inline-flex border-accent/40 bg-accent/10 text-foreground/80 font-normal"
        >
          <FlaskConical className="h-3 w-3 mr-1 text-accent" />
          Prototype — synthetic data
        </Badge>

        <NotificationsBell />

        {/* Account menu — mobile only; desktop uses the sidebar user block. */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <UserCog className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Switch role</DropdownMenuLabel>
              {roles.map((r) => (
                <DropdownMenuItem key={r} onClick={() => setRole(r)}>
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
      </div>
    </header>
  );
}
