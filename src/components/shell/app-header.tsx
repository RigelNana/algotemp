import { Fragment } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Search, Tag } from "lucide-react";
import { algorithms, categories } from "@/algorithms/registry";
import { getTopicTrail } from "@/algorithms/catalog";
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
import { cn } from "@/lib/utils";
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
  const search = useRouterState({
    select: (state) => state.location.search,
  }) as { topic?: string };
  const category = categories.find((item) => item.slug === params?.category);
  const algorithm = algorithms.find(
    (item) =>
      item.category === params?.category && item.slug === params?.algorithm,
  );
  const topicId = algorithm ? algorithm.topicId : search.topic;
  const trail =
    category && topicId ? getTopicTrail(category.slug, topicId) : [];
  const label =
    pathname === "/settings"
      ? "设置"
      : pathname === "/favorites"
        ? "收藏"
        : pathname === "/recent"
          ? "最近访问"
          : "模板库";
  const crumbs: { key: string; title: string; topic?: string }[] = category
    ? [
        { key: category.slug, title: category.title },
        ...trail.map((topic) => ({
          key: topic.id,
          title: topic.title,
          topic: topic.id,
        })),
        ...(algorithm ? [{ key: algorithm.id, title: algorithm.title }] : []),
      ]
    : [];
  const fullPath = [
    category ? "模板库" : label,
    ...crumbs.map((crumb) => crumb.title),
  ].join(" / ");
  const selectedTags = category
    ? [category.title, ...trail.map((topic) => topic.title)].join(" · ")
    : undefined;

  return (
    <header className="z-20 flex h-[52px] shrink-0 items-center gap-3 border-b bg-background px-4 sm:px-6">
      {isMobile && <SidebarTrigger aria-label="打开导航" />}
      {algorithm ? (
        <Breadcrumb
          aria-label={fullPath}
          title={fullPath}
          className="min-w-0 flex-1 overflow-hidden"
        >
          <BreadcrumbList className="flex-nowrap gap-1.5 overflow-hidden whitespace-nowrap text-[13px] sm:gap-1.5">
            <BreadcrumbItem
              className={cn(
                "min-w-0",
                category && "hidden shrink-0 lg:inline-flex",
              )}
            >
              <BookOpen className="size-3.5 shrink-0" />
              {category ? (
                <BreadcrumbLink asChild>
                  <Link to="/algorithms" search={{}}>
                    模板库
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="truncate">{label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {category &&
              crumbs.map((crumb, index) => {
                const last = index === crumbs.length - 1;
                return (
                  <Fragment key={crumb.key}>
                    <BreadcrumbSeparator
                      className={cn(
                        "shrink-0",
                        index === 0 ? "hidden lg:block" : "hidden sm:block",
                      )}
                    />
                    <BreadcrumbItem
                      className={cn(
                        "min-w-0",
                        !last && "hidden sm:inline-flex sm:shrink-[2]",
                      )}
                    >
                      {last ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <BreadcrumbPage
                              tabIndex={0}
                              aria-label={fullPath}
                              className="truncate outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {crumb.title}
                            </BreadcrumbPage>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                            {fullPath}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <BreadcrumbLink asChild className="truncate">
                          <Link
                            to="/algorithms/$category"
                            params={{ category: category.slug }}
                            search={crumb.topic ? { topic: crumb.topic } : {}}
                            title={crumb.title}
                          >
                            {crumb.title}
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                );
              })}
          </BreadcrumbList>
        </Breadcrumb>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2 text-[13px]">
          <BookOpen
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="shrink-0">{label}</span>
          {selectedTags && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  tabIndex={0}
                  aria-label={`已选标签：${selectedTags}`}
                  className="flex min-w-0 items-center gap-1.5 rounded-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Tag className="size-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {trail.at(-1)?.title ?? category?.title}
                  </span>
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-[min(24rem,calc(100vw-2rem))] [overflow-wrap:anywhere]">
                已选标签：{selectedTags}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground"
            aria-label="搜索标签与算法"
            onClick={() => openCommand("search")}
          >
            <Search className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>搜索标签与算法</TooltipContent>
      </Tooltip>
      <ThemeToggle compact />
    </header>
  );
}
