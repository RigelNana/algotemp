import { createFileRoute, redirect } from "@tanstack/react-router";
import { algorithms } from "@/algorithms/registry";
import { usePreferences } from "@/stores/preferences";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const recent = usePreferences
      .getState()
      .recentAlgorithms.map((id) =>
        algorithms.find((algorithm) => algorithm.id === id),
      )
      .find((algorithm) => algorithm !== undefined);
    if (recent)
      throw redirect({
        to: "/algorithms/$category/$algorithm",
        params: { category: recent.category, algorithm: recent.slug },
        replace: true,
      });
    throw redirect({ to: "/algorithms", replace: true });
  },
});
