import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import {
  BookOpen,
  Boxes,
  ChevronRight,
  Clock3,
  Folder,
  Settings2,
  Star,
  X,
} from "lucide-react";
import { categories } from "@/algorithms/registry";
import {
  getTopicTrail,
  isTopicWithin,
  type CatalogTopic,
} from "@/algorithms/catalog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motionTimings } from "@/lib/motion";
import { cn } from "@/lib/utils";

const navigation = [
  { to: "/algorithms", title: "模板库", icon: BookOpen },
  { to: "/favorites", title: "收藏", icon: Star },
  { to: "/recent", title: "最近访问", icon: Clock3 },
  { to: "/settings", title: "设置", icon: Settings2 },
] as const;

function ActiveIndicator() {
  return (
    <span className="pointer-events-none absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" />
  );
}

type Category = (typeof categories)[number];
type Selection = { category?: string; algorithm?: string; topic?: string };

function TreeToggle({
  open,
  label,
  collapsed = false,
}: {
  open: boolean;
  label: string;
  collapsed?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <CollapsibleTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        disabled={collapsed}
        className={cn(
          "size-7 shrink-0",
          collapsed && "pointer-events-none w-0 overflow-hidden opacity-0",
        )}
        aria-label={`${open ? "收起" : "展开"}：${label}`}
      >
        <motion.span
          initial={false}
          animate={{ rotate: open ? 90 : 0 }}
          transition={reducedMotion ? { duration: 0 } : motionTimings.fast}
        >
          <ChevronRight className="size-3.5" />
        </motion.span>
      </Button>
    </CollapsibleTrigger>
  );
}

const treeLinkClass =
  "relative block min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-[13px] text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring";
const treeChildrenClass =
  "ml-3 min-w-0 space-y-0.5 border-l border-sidebar-border py-1 pl-2";

function AlgorithmLinks({
  category,
  topicId,
  selection,
  closeMobile,
}: {
  category: Category;
  topicId?: string;
  selection: Selection;
  closeMobile: () => void;
}) {
  return category.algorithms
    .filter((algorithm) => algorithm.topicId === topicId)
    .map((algorithm) => {
      const active =
        selection.category === category.slug &&
        selection.algorithm === algorithm.slug;
      return (
        <li key={algorithm.id} className="min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                activeOptions={{ exact: true }}
                to="/algorithms/$category/$algorithm"
                params={{ category: category.slug, algorithm: algorithm.slug }}
                onClick={closeMobile}
                aria-current={active ? "page" : false}
                className={cn(
                  treeLinkClass,
                  active && "bg-sidebar-accent font-medium text-foreground",
                )}
              >
                {algorithm.title}
                {active && <ActiveIndicator />}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{algorithm.title}</TooltipContent>
          </Tooltip>
        </li>
      );
    });
}

function TopicTree({
  category,
  topic,
  selection,
  closeMobile,
}: {
  category: Category;
  topic: CatalogTopic;
  selection: Selection;
  closeMobile: () => void;
}) {
  const selectedTopic =
    selection.category === category.slug ? selection.topic : undefined;
  const containsActive = isTopicWithin(selectedTopic, topic.id);
  const active = selectedTopic === topic.id && !selection.algorithm;
  const [open, setOpen] = useState(containsActive);
  const hasChildren =
    topic.children.length > 0 ||
    category.algorithms.some((algorithm) => algorithm.topicId === topic.id);
  const context = [
    category.title,
    ...getTopicTrail(category.slug, topic.id).map((item) => item.title),
  ].join(" / ");
  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive, selectedTopic]);
  return (
    <Collapsible asChild open={open} onOpenChange={setOpen}>
      <li className="min-w-0">
        <div className="flex min-w-0 items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                activeOptions={{ exact: true }}
                to="/algorithms/$category"
                params={{ category: category.slug }}
                search={{ topic: topic.id }}
                onClick={closeMobile}
                aria-label={context}
                aria-current={active ? "page" : false}
                className={cn(
                  treeLinkClass,
                  active && "bg-sidebar-accent font-medium text-foreground",
                )}
              >
                {topic.title}
                {active && <ActiveIndicator />}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-sm">
              {context}
            </TooltipContent>
          </Tooltip>
          {hasChildren && <TreeToggle open={open} label={context} />}
        </div>
        {hasChildren && open && (
          <CollapsibleContent>
            <ul className={treeChildrenClass}>
              {topic.children.map((child) => (
                <TopicTree
                  key={child.id}
                  category={category}
                  topic={child}
                  selection={selection}
                  closeMobile={closeMobile}
                />
              ))}
              <AlgorithmLinks
                category={category}
                topicId={topic.id}
                selection={selection}
                closeMobile={closeMobile}
              />
            </ul>
          </CollapsibleContent>
        )}
      </li>
    </Collapsible>
  );
}

function CategoryTree({
  category,
  selection,
  closeMobile,
}: {
  category: Category;
  selection: Selection;
  closeMobile: () => void;
}) {
  const { state, isMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const containsActive = selection.category === category.slug;
  const activeCategory =
    containsActive && !selection.topic && !selection.algorithm;
  const [open, setOpen] = useState(containsActive);
  const hasChildren =
    category.topics.length > 0 || category.algorithms.length > 0;
  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive, selection.topic, selection.algorithm]);

  return (
    <Collapsible asChild open={open && !collapsed} onOpenChange={setOpen}>
      <SidebarMenuItem>
        <div className="flex min-w-0 items-center gap-0.5">
          <SidebarMenuButton
            asChild
            tooltip={{ children: category.title, hidden: false }}
            isActive={activeCategory || (collapsed && containsActive)}
            className="relative min-w-0 flex-1"
          >
            <Link
              activeOptions={{ exact: true }}
              to="/algorithms/$category"
              params={{ category: category.slug }}
              search={{}}
              onClick={closeMobile}
              aria-label={category.title}
              aria-current={activeCategory ? "page" : false}
            >
              <Folder />
              <span className="min-w-0 truncate whitespace-nowrap">
                {category.title}
              </span>
              {(activeCategory || (collapsed && containsActive)) && (
                <ActiveIndicator />
              )}
            </Link>
          </SidebarMenuButton>
          {hasChildren && (
            <TreeToggle
              open={open}
              label={category.title}
              collapsed={collapsed}
            />
          )}
        </div>
        {hasChildren && open && !collapsed && (
          <CollapsibleContent>
            <ul className={treeChildrenClass}>
              {category.topics.map((topic) => (
                <TopicTree
                  key={topic.id}
                  category={category}
                  topic={topic}
                  selection={selection}
                  closeMobile={closeMobile}
                />
              ))}
              <AlgorithmLinks
                category={category}
                selection={selection}
                closeMobile={closeMobile}
              />
            </ul>
          </CollapsibleContent>
        )}
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const pathname = useRouterState({
    select: (router) => router.location.pathname,
  });
  const path = decodeURI(pathname).replace(/\/$/, "");
  const params = useRouterState({
    select: (router) => router.matches.at(-1)?.params,
  }) as { category?: string; algorithm?: string } | undefined;
  const search = useRouterState({
    select: (router) => router.location.search,
  }) as { topic?: string };
  const currentAlgorithm = categories
    .find((category) => category.slug === params?.category)
    ?.algorithms.find((algorithm) => algorithm.slug === params?.algorithm);
  const selection: Selection = {
    ...params,
    topic: params?.algorithm ? currentAlgorithm?.topicId : search.topic,
  };
  const closeMobile = () => setOpenMobile(false);

  return (
    <Sidebar
      embedded
      collapsible="icon"
      className="whitespace-nowrap border-r-0"
    >
      <SidebarHeader className="shrink-0 px-3 pb-3 pt-0">
        <div className="relative h-[52px] overflow-hidden">
          <Link
            activeOptions={{ exact: true }}
            to="/algorithms"
            onClick={closeMobile}
            tabIndex={collapsed ? -1 : undefined}
            aria-hidden={collapsed || undefined}
            className={cn(
              "absolute inset-y-0 left-0 flex w-[170px] items-center gap-2.5 whitespace-nowrap rounded-sm font-semibold tracking-tight transition-opacity duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ring",
              collapsed ? "pointer-events-none opacity-0" : "opacity-100",
            )}
          >
            <Boxes className="size-5 text-primary" strokeWidth={1.7} />
            <span>Algorithm</span>
          </Link>
          <div className="absolute right-0 top-3 z-10 rounded-sm bg-sidebar">
            {isMobile ? (
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={closeMobile}
                aria-label="关闭导航"
              >
                <X />
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarTrigger
                    aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
                    className="text-muted-foreground"
                  />
                </TooltipTrigger>
                <TooltipContent side="right">
                  {collapsed ? "展开侧边栏" : "收起侧边栏"}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-3">
        <SidebarGroup className="px-3 py-0">
          <SidebarMenu>
            {navigation.map(({ to, title, icon: Icon }) => {
              const active = path === to;
              return (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton
                    asChild
                    tooltip={title}
                    isActive={active}
                    className="relative h-9 text-[13px]"
                  >
                    <Link
                      activeOptions={{ exact: true }}
                      to={to}
                      onClick={closeMobile}
                      aria-label={title}
                      aria-current={active ? "page" : false}
                    >
                      <Icon
                        className="text-muted-foreground"
                        strokeWidth={1.7}
                      />
                      <span className="shrink-0 whitespace-nowrap">
                        {title}
                      </span>
                      {active && <ActiveIndicator />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
        {categories.length > 0 && (
          <SidebarGroup className="px-3">
            <SidebarGroupLabel>分类</SidebarGroupLabel>
            <SidebarMenu>
              {categories.map((category) => (
                <CategoryTree
                  key={category.slug}
                  category={category}
                  selection={selection}
                  closeMobile={closeMobile}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
