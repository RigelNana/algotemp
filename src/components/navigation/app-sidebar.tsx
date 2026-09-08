import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Boxes, Clock3, Settings2, Star, X } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const routeId = useRouterState({
    select: (router) => router.matches.at(-1)?.routeId ?? "",
  });
  const path = routeId.replace(/\/$/, "");
  const closeMobile = () => setOpenMobile(false);

  return (
    <Sidebar
      embedded
      collapsible="icon"
      className="whitespace-nowrap border-r-0"
    >
      <SidebarHeader className="shrink-0 px-3 pb-3 pt-0">
        <div className="relative h-[52px] overflow-hidden">
          <div
            aria-hidden={collapsed || undefined}
            className={cn(
              "absolute inset-y-0 left-0 flex w-[170px] items-center gap-2.5 whitespace-nowrap font-semibold tracking-tight transition-opacity duration-200 ease-out",
              collapsed ? "opacity-0" : "opacity-100",
            )}
          >
            <Boxes className="size-5 text-primary" strokeWidth={1.7} />
            <span>Algorithm</span>
          </div>
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
              const exact = path === to;
              const active =
                exact || (to === "/algorithms" && path.startsWith(`${to}/`));
              return (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton
                    asChild
                    tooltip={title}
                    isActive={active}
                    className="relative h-9 text-[13px]"
                  >
                    <Link
                      activeOptions={{ exact: to !== "/algorithms" }}
                      to={to}
                      onClick={closeMobile}
                      aria-label={title}
                      aria-current={
                        exact ? "page" : active ? "location" : false
                      }
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
      </SidebarContent>
    </Sidebar>
  );
}
