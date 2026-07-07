import { createFileRoute, notFound } from "@tanstack/react-router";
import { getCase } from "@/lib/mock-cases";
import { ConsentPanel } from "@/components/healthlens/consent-panel";
import { FetchTimeline } from "@/components/healthlens/fetch-timeline";
import { sourceLabel } from "@/lib/format";

export const Route = createFileRoute("/cases/$id/consent")({
  loader: ({ params }) => {
    const data = getCase(params.id);
    if (!data) throw notFound();
    return { case: data };
  },
  component: ConsentPage,
});

function ConsentPage() {
  const { case: data } = Route.useLoaderData() as { case: import("@/lib/types").MsmeCase };
  const available = data.dataCompleteness.filter((d) => d.available).length;
  const confidence =
    available === data.dataCompleteness.length
      ? "Full source coverage"
      : available >= 4
        ? "Usable with source caveats"
        : "Manual review recommended";
  return (
    <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
      <section className="rounded-md border border-border bg-surface p-4 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Data readiness
            </div>
            <h2 className="mt-1 text-base font-semibold text-foreground">{confidence}</h2>
          </div>
          <div className="text-sm font-semibold tabular-nums text-foreground">
            {available}/{data.dataCompleteness.length} sources
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.dataCompleteness.map((source) => (
            <div key={source.source} className="rounded-md border border-border bg-background p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium text-foreground">
                  {sourceLabel[source.source]}
                </div>
                <span
                  className={
                    source.available
                      ? "rounded-md border border-positive/30 bg-positive/10 px-2 py-0.5 text-[10px] font-medium text-positive"
                      : "rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                  }
                >
                  {source.available ? "Used" : "Missing"}
                </span>
              </div>
              <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {source.available
                  ? `${source.monthsCovered ?? 12} months available and weighted in score where applicable.`
                  : "Weighted out of HealthScore; officer should review whether the gap affects confidence."}
              </div>
            </div>
          ))}
        </div>
      </section>
      <ConsentPanel data={data} />
      <FetchTimeline data={data} />
    </div>
  );
}
