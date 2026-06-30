import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar />
        <main className="flex-1 min-w-0">{children}</main>
        <footer
          data-no-print="true"
          className="border-t border-border bg-surface px-4 md:px-6 py-3 text-[11px] leading-relaxed text-muted-foreground"
        >
          HealthLens is a decision-support and configurable recommendation engine. IDBI remains the
          regulated entity and final decision owner. All figures shown are synthetic prototype data.
        </footer>
      </div>
    </div>
  );
}
