import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Search } from "lucide-react";
import { algorithms, categories } from "@/algorithms/registry";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useCommandMenu } from "./command-menu";

export function AppHeader() {
  const { isMobile } = useSidebar();
  const { openCommand } = useCommandMenu();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const params = useRouterState({
    select: (state) => state.matches.at(-1)?.params,
  }) as { category?: string; algorithm?: string } | undefined;
  const category = categories.find((item) => item.slug === params?.category);
  const algorithm = algorithms.find(
    (item) =>
      item.category === params?.category && item.slug === params?.algorithm,
  );
  const label =
    pathname === "/settings"
      ? "设置"
      : pathname === "/favorites"
        ? "收藏"
        : pathname === "/recent"
          ? "最近访问"
          : "模板库";
  return (
    <header className="z-20 flex h-[52px] shrink-0 items-center gap-3 border-b bg-background px-4 sm:px-6">
      {isMobile && <SidebarTrigger aria-label="打开导航" />}
      <Breadcrumb aria-label="面包屑" className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap text-[13px]">
          <BreadcrumbItem className={category ? "hidden sm:inline-flex" : ""}>
            <BookOpen className="size-3.5" />
            {category ? (
              <BreadcrumbLink asChild>
                <Link to="/algorithms">模板库</Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>{label}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          {category && (
            <>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem
                className={
                  algorithm ? "hidden min-w-0 sm:inline-flex" : "min-w-0"
                }
              >
                {algorithm ? (
                  <BreadcrumbLink asChild className="truncate">
                    <Link
                      to="/algorithms/$category"
                      params={{ category: category.slug }}
                    >
                      {category.title}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="truncate">
                    {category.title}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </>
          )}
          {algorithm && (
            <>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate">
                  {algorithm.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            aria-label="搜索算法"
            onClick={() => openCommand("search")}
          >
            <Search className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>搜索算法</TooltipContent>
      </Tooltip>
      <ThemeToggle compact />
    </header>
  );
}
