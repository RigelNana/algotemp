import { createFileRoute } from "@tanstack/react-router";
import { AlgorithmLibrary } from "@/components/library/algorithm-library";

export const Route = createFileRoute("/recent")({
  component: () => <AlgorithmLibrary collection="recent" />,
});
