import { createFileRoute, Outlet, notFound } from "@tanstack/react-router";
import { CaseHeader } from "@/components/healthlens/case-header";
import { getCase } from "@/lib/mock-cases";

export const Route = createFileRoute("/cases/$id")({
  loader: ({ params }) => {
    const data = getCase(params.id);
    if (!data) throw notFound();
    return { case: data };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData ? `${loaderData.case.legalName} · HealthLens` : "Case · HealthLens",
      },
    ],
  }),
  component: CaseLayout,
});

function CaseLayout() {
  const { case: data } = Route.useLoaderData() as { case: import("@/lib/types").MsmeCase };
  return (
    <div className="flex flex-col">
      <CaseHeader data={data} />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
