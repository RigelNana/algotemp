import { createFileRoute, notFound } from "@tanstack/react-router";
import { getTopic } from "@/algorithms/catalog";
import { categories } from "@/algorithms/registry";
import { AlgorithmLibrary } from "@/components/library/algorithm-library";

export const Route = createFileRoute("/algorithms/$category/")({
  validateSearch: (search: Record<string, unknown>): { topic?: string } => ({
    topic:
      search.topic === undefined
        ? undefined
        : typeof search.topic === "string"
          ? search.topic
          : "",
  }),
  beforeLoad: ({ params, search }) => {
    if (!categories.some((category) => category.slug === params.category))
      throw notFound();
    if (search.topic !== undefined && !getTopic(params.category, search.topic))
      throw notFound();
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useParams();
  const { topic } = Route.useSearch();
  return (
    <AlgorithmLibrary collection="library" category={category} topic={topic} />
  );
}
