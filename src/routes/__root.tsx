import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { FileQuestion, TriangleAlert } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
  notFoundComponent: () => (
    <EmptyState
      icon={FileQuestion}
      title="找不到这个页面"
      description="链接可能已变更，或该算法尚未加入模板库。"
    >
      <Button variant="outline" asChild>
        <Link to="/algorithms">返回模板库</Link>
      </Button>
    </EmptyState>
  ),
  errorComponent: ({ reset }) => (
    <EmptyState
      icon={TriangleAlert}
      title="页面加载失败"
      description="请检查网络连接，然后重新加载。"
    >
      <Button variant="outline" onClick={reset}>
        重新加载
      </Button>
    </EmptyState>
  ),
  pendingComponent: () => (
    <div role="status" aria-label="正在加载页面" className="space-y-6 p-8">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-72 max-w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  ),
});
