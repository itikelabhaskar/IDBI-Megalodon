import { cn } from "@/lib/utils";

export function CreditStyleBadge({ score, className }: { score: number; className?: string }) {
  // Color ramp on 300–900 scale
  const tone =
    score >= 750
      ? "border-band-a/30 bg-band-a/10 text-band-a"
      : score >= 680
        ? "border-band-b/30 bg-band-b/10 text-band-b"
        : score >= 600
          ? "border-band-c/30 bg-band-c/10 text-band-c"
          : "border-band-d/30 bg-band-d/10 text-band-d";

  return (
    <div
      className={cn(
        "inline-flex flex-col items-start rounded-md border px-3 py-2",
        tone,
        className,
      )}
    >
      <span className="text-[10px] uppercase tracking-widest opacity-80">Credit-style score</span>
      <span className="text-2xl font-bold tabular-nums leading-tight">{score}</span>
      <span className="text-[10px] opacity-70">300–900 scale</span>
    </div>
  );
}
