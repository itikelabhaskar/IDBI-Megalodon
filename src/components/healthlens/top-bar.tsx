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
import { ChevronDown, UserCog, FlaskConical } from "lucide-react";

export function TopBar() {
  const { role, setRole } = useRole();
  const roles: Role[] = ["Credit Officer", "Risk Admin"];

  return (
    <header
      data-no-print="true"
      className="h-14 shrink-0 border-b border-border bg-surface flex items-center px-4 md:px-6 gap-3"
    >
      <div className="flex items-center gap-2 md:hidden">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
          HL
        </div>
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <UserCog className="h-4 w-4" />
              <span className="hidden sm:inline">{role}</span>
              <span className="sm:hidden">{role === "Credit Officer" ? "CO" : "RA"}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Switch role</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {roles.map((r) => (
              <DropdownMenuItem key={r} onClick={() => setRole(r)}>
                <span className="flex-1">{r}</span>
                {r === role && <span className="text-xs text-muted-foreground">active</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
