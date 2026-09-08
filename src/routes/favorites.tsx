import { createFileRoute } from "@tanstack/react-router";
import { AlgorithmLibrary } from "@/components/library/algorithm-library";

export const Route = createFileRoute("/favorites")({
  component: () => <AlgorithmLibrary collection="favorites" />,
});
