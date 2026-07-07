import { cn } from "@/lib/utils";

/**
 * HealthLens brand mark — a rounded IDBI-teal tile holding an ascending bar +
 * pulse motif (financial health from alternate data). Not IDBI's registered
 * logo; a clean original lockup that carries the bank's green for the pilot.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm",
        className,
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-[62%] w-[62%]"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ascending bars */}
        <rect x="3" y="13" width="3.2" height="7" rx="1" fill="currentColor" opacity="0.55" />
        <rect x="8" y="9.5" width="3.2" height="10.5" rx="1" fill="currentColor" opacity="0.75" />
        <rect x="13" y="6" width="3.2" height="14" rx="1" fill="currentColor" />
        {/* health pulse line */}
        <path
          d="M2.5 8.5 L6 8.5 L8 4.5 L10.5 11 L12.5 8 L21.5 8"
          stroke="var(--color-accent)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** Full brand lockup: mark + wordmark. `tone` adapts to dark (sidebar) or light. */
export function BrandLockup({
  tone = "light",
  className,
}: {
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandMark className="h-9 w-9" />
      <div className="leading-tight">
        <div
          className={cn(
            "flex items-center gap-1 text-[15px] font-bold tracking-tight",
            tone === "dark" ? "text-sidebar-foreground" : "text-foreground",
          )}
        >
          IDBI
          <span
            className={cn(
              "text-[15px] font-semibold",
              tone === "dark" ? "text-sidebar-foreground/85" : "text-primary",
            )}
          >
            HealthLens
          </span>
        </div>
        <div
          className={cn(
            "text-[10px] font-medium uppercase tracking-[0.14em]",
            tone === "dark" ? "text-sidebar-foreground/55" : "text-muted-foreground",
          )}
        >
          MSME Financial Health Card
        </div>
      </div>
    </div>
  );
}
