import { createFileRoute, notFound } from "@tanstack/react-router";
import { getCase } from "@/lib/mock-cases";
import { ConsentPanel } from "@/components/healthlens/consent-panel";
import { FetchTimeline } from "@/components/healthlens/fetch-timeline";

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
  return (
    <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
      <ConsentPanel data={data} />
      <FetchTimeline data={data} />
    </div>
  );
}
