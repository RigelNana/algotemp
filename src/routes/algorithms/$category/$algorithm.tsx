import { createFileRoute, notFound } from "@tanstack/react-router";
import { getAlgorithm } from "@/algorithms/registry";
import { AlgorithmPage } from "@/components/algorithm/algorithm-page";

export const Route = createFileRoute("/algorithms/$category/$algorithm")({
  loader: ({ params }) => {
    const algorithm = getAlgorithm(params.category, params.algorithm);
    if (!algorithm) throw notFound();
    return algorithm;
  },
  component: AlgorithmRoute,
});

function AlgorithmRoute() {
  const algorithm = Route.useLoaderData();
  return <AlgorithmPage key={algorithm.id} algorithm={algorithm} />;
}
