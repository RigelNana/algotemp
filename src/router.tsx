import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL,
  defaultPreload: "intent",
  defaultPendingMs: 150,
  defaultPendingMinMs: 0,
  defaultPendingComponent: routeTree.options.pendingComponent,
  defaultErrorComponent: routeTree.options.errorComponent || undefined,
  scrollRestoration: false,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
