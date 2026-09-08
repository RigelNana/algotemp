import { createFileRoute, notFound } from "@tanstack/react-router";
import { categories } from "@/algorithms/registry";
import { AlgorithmLibrary } from "@/components/library/algorithm-library";

export const Route = createFileRoute("/algorithms/$category/")({
  beforeLoad: ({ params }) => {
    if (!categories.some((category) => category.slug === params.category))
      throw notFound();
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useParams();
  return <AlgorithmLibrary collection="library" category={category} />;
}
