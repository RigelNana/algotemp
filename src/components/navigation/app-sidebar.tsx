import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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
    <motion.span
      layoutId="sidebar-active"
      transition={motionTimings.layout}
      className="sidebar-active pointer-events-none absolute inset-0 -z-10 rounded-md bg-sidebar-accent"
    >
      <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" />
    </motion.span>
  );
}

function CategoryTree({
  category,
  path,
  closeMobile,
}: {
  category: (typeof categories)[number];
  path: string;
  closeMobile: () => void;
}) {
  const { state, isMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const activeCategory = path === `/algorithms/${category.slug}`;
  const containsActive =
    activeCategory ||
    category.algorithms.some(
      (algorithm) => path === `/algorithms/${category.slug}/${algorithm.slug}`,
    );
  const [open, setOpen] = useState(containsActive);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive]);

  return (
    <Collapsible asChild open={open && !collapsed} onOpenChange={setOpen}>
      <SidebarMenuItem>
        <div className="flex items-center gap-0.5">
          <SidebarMenuButton
            asChild
            tooltip={category.title}
            isActive={activeCategory || (collapsed && containsActive)}
            className="relative flex-1"
          >
            <Link
              to="/algorithms/$category"
              params={{ category: category.slug }}
              onClick={closeMobile}
            >
              <Folder />
              <span>{category.title}</span>
              {(activeCategory || (collapsed && containsActive)) && (
                <ActiveIndicator />
              )}
            </Link>
          </SidebarMenuButton>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={collapsed}
              className={cn(
                "size-7 shrink-0 transition-[width,opacity] duration-200",
                collapsed &&
                  "pointer-events-none w-0 overflow-hidden opacity-0",
              )}
              aria-label={`${open ? "收起" : "展开"}${category.title}`}
            >
              <motion.span
                animate={{ rotate: open ? 90 : 0 }}
                transition={motionTimings.fast}
              >
                <ChevronRight className="size-3.5" />
              </motion.span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <AnimatePresence initial={false}>
          {open && !collapsed && (
            <CollapsibleContent forceMount asChild>
              <motion.div
                initial={{
                  height: reducedMotion ? "auto" : 0,
                  opacity: 0,
                  y: reducedMotion ? 0 : -4,
                }}
                animate={{ height: "auto", opacity: 1, y: 0 }}
                exit={{
                  height: reducedMotion ? "auto" : 0,
                  opacity: 0,
                  y: reducedMotion ? 0 : -4,
                }}
                transition={motionTimings.normal}
                className="overflow-hidden"
              >
                <ul className="ml-4 space-y-0.5 border-l border-sidebar-border py-1 pl-2">
                  {category.algorithms.map((algorithm) => {
                    const active =
                      path === `/algorithms/${category.slug}/${algorithm.slug}`;
                    return (
                      <li key={algorithm.id}>
                        <Link
                          to="/algorithms/$category/$algorithm"
                          params={{
                            category: category.slug,
                            algorithm: algorithm.slug,
                          }}
                          onClick={closeMobile}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "relative block truncate rounded-md px-3 py-1.5 text-[13px] text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                            active &&
                              "bg-sidebar-accent font-medium text-foreground",
                          )}
                        >
                          {algorithm.title}
                          {active && <ActiveIndicator />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            </CollapsibleContent>
          )}
        </AnimatePresence>
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
  const closeMobile = () => setOpenMobile(false);

  return (
    <Sidebar embedded collapsible="icon" className="border-r-0">
      <SidebarHeader className="shrink-0 px-3 pb-3 pt-0">
        <div className="relative h-[52px] overflow-hidden">
          <Link
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
                      to={to}
                      onClick={closeMobile}
                      aria-label={title}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon
                        className="text-muted-foreground"
                        strokeWidth={1.7}
                      />
                      <span>{title}</span>
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
                  path={path}
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
