import { createFileRoute, notFound } from "@tanstack/react-router";
import { getCase } from "@/lib/mock-cases";
import { DecisionPanel } from "@/components/healthlens/decision-panel";
import { ProductRoutingCard } from "@/components/healthlens/product-routing-card";
import { PathToCreditPanel } from "@/components/healthlens/path-to-credit-panel";

export const Route = createFileRoute("/cases/$id/decision")({
  loader: ({ params }) => {
    const data = getCase(params.id);
    if (!data) throw notFound();
    return { case: data };
  },
  component: DecisionPage,
});

function DecisionPage() {
  const { case: data } = Route.useLoaderData() as { case: import("@/lib/types").MsmeCase };
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl">
      <DecisionPanel data={data} />
      <ProductRoutingCard data={data} />
      <PathToCreditPanel actions={data.pathToCredit} />
    </div>
  );
}
