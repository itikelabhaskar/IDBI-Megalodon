import { createFileRoute, notFound } from "@tanstack/react-router";
import { getCase } from "@/lib/mock-cases";
import { CamPreview } from "@/components/healthlens/cam-preview";

export const Route = createFileRoute("/cases/$id/cam")({
  loader: ({ params }) => {
    const data = getCase(params.id);
    if (!data) throw notFound();
    return { case: data };
  },
  component: CamPage,
});

function CamPage() {
  const { case: data } = Route.useLoaderData() as { case: import("@/lib/types").MsmeCase };
  return <CamPreview data={data} />;
}
