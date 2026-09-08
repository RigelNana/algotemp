import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGroup, useReducedMotion } from "motion/react";
import { usePanelRef } from "react-resizable-panels";
import {
  BookOpen,
  Keyboard,
  MoreHorizontal,
  Search,
  Settings2,
} from "lucide-react";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { CommandMenuProvider, useCommandMenu } from "./command-menu";
import { SettingsDialog } from "./settings-dialog";
import { algorithms, categories } from "@/algorithms/registry";
import { usePreferences } from "@/stores/preferences";
import { modifierKey } from "@/lib/keyboard";
import { cn } from "@/lib/utils";

function Breadcrumbs() {
  const matches = useRouterState({ select: (router) => router.matches });
  const params = matches.at(-1)?.params as
    { category?: string; algorithm?: string } | undefined;
  const pathname = useRouterState({
    select: (router) => router.location.pathname,
  });
  const category = categories.find((item) => item.slug === params?.category);
  const algorithm = category
    ? algorithms.find(
        (item) =>
          item.category === category.slug && item.slug === params?.algorithm,
      )
    : undefined;
  const label =
    pathname === "/favorites"
      ? "收藏"
      : pathname === "/recent"
        ? "最近访问"
        : "模板库";

  return (
    <Breadcrumb aria-label="面包屑" className="min-w-0 flex-1">
      <BreadcrumbList className="flex-nowrap gap-2 text-[13px] sm:gap-2">
        <BreadcrumbItem
          className={cn("shrink-0 gap-2", category && "hidden sm:inline-flex")}
        >
          <BookOpen className="size-3.5 text-muted-foreground" />
          {category ? (
            <BreadcrumbLink asChild>
              <Link to="/algorithms">模板库</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage className="font-medium">{label}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {category && (
          <>
            <BreadcrumbSeparator className="hidden sm:block" />
            <BreadcrumbItem
              className={cn("min-w-0", algorithm && "hidden sm:inline-flex")}
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
                <BreadcrumbPage className="truncate font-medium">
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
              <BreadcrumbPage className="truncate font-medium">
                {algorithm.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function Toolbar({
  openSettings,
}: {
  openSettings: (section?: "preferences" | "shortcuts") => void;
}) {
  const { openCommand } = useCommandMenu();
  return (
    <header className="sticky top-0 z-20 flex h-[52px] shrink-0 items-center gap-3 border-b bg-background/95 px-3 backdrop-blur-sm sm:px-5">
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarTrigger className="text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent>
          切换侧边栏 <kbd>{modifierKey} B</kbd>
        </TooltipContent>
      </Tooltip>
      <span className="h-4 w-px shrink-0 bg-border" aria-hidden="true" />
      <Breadcrumbs />
      <div className="flex shrink-0 items-center gap-1">
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
          <TooltipContent>
            搜索算法 <kbd>{modifierKey} K</kbd>
          </TooltipContent>
        </Tooltip>
        <ThemeToggle compact />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              aria-label="更多工作区操作"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={() => openSettings("preferences")}>
              <Settings2 />
              设置
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openSettings("shortcuts")}>
              <Keyboard />
              键盘快捷键
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => openCommand("commands")}>
              打开命令面板
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function Workspace({
  children,
  openSettings,
}: {
  children: ReactNode;
  openSettings: (section?: "preferences" | "shortcuts") => void;
}) {
  const { open, isMobile } = useSidebar();
  const sidebarWidth = usePreferences((state) => state.sidebarWidth);
  const setSidebarWidth = usePreferences((state) => state.setSidebarWidth);
  const sidebarRef = usePanelRef();
  const groupElement = useRef<HTMLDivElement>(null);
  const width = useRef(sidebarWidth);
  const [dragging, setDragging] = useState(false);
  const reducedMotion = useReducedMotion();
  width.current = sidebarWidth;

  useEffect(() => {
    if (isMobile) return;
    // Apply the saved width after Panel has registered its expanded constraints.
    const frame = requestAnimationFrame(() =>
      sidebarRef.current?.resize(open ? width.current : 56),
    );
    return () => cancelAnimationFrame(frame);
  }, [open, isMobile, sidebarRef]);

  useEffect(() => {
    if (!dragging) return;
    const stopDragging = () => setDragging(false);
    window.addEventListener("pointerup", stopDragging, { once: true });
    window.addEventListener("pointercancel", stopDragging, { once: true });
    return () => {
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [dragging]);

  const content = (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background outline-none"
    >
      <Toolbar openSettings={openSettings} />
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </main>
  );

  if (isMobile)
    return (
      <>
        <AppSidebar openSettings={openSettings} />
        {content}
      </>
    );

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      elementRef={groupElement}
      onLayoutChanged={(layout, meta) => {
        if (!meta.isUserInteraction || !open || !groupElement.current) return;
        // The callback precedes DOM layout, so use its final percentage rather than a stale panel width.
        const separatorWidth =
          groupElement.current
            .querySelector(':scope > [role="separator"]')
            ?.getBoundingClientRect().width ?? 0;
        setSidebarWidth(
          Math.round(
            (layout["workspace-sidebar"] / 100) *
              (groupElement.current.clientWidth - separatorWidth),
          ),
        );
      }}
      className={cn(
        "min-h-0",
        !dragging &&
          !reducedMotion &&
          "[&>[data-panel]]:transition-[flex-grow] [&>[data-panel]]:duration-180 [&>[data-panel]]:ease-out",
      )}
    >
      <ResizablePanel
        id="workspace-sidebar"
        panelRef={sidebarRef}
        defaultSize={`${open ? sidebarWidth : 56}px`}
        minSize={open ? "240px" : "56px"}
        maxSize={open ? "360px" : "56px"}
        groupResizeBehavior="preserve-pixel-size"
        className="h-full min-h-0 overflow-hidden"
      >
        <AppSidebar openSettings={openSettings} />
      </ResizablePanel>
      <ResizableHandle
        disabled={!open}
        aria-label="调整侧边栏宽度"
        onPointerDown={() => setDragging(true)}
        onKeyDown={() => setDragging(true)}
        onKeyUp={() => setDragging(false)}
        className="z-30 w-px shrink-0 transition-colors hover:bg-primary focus-visible:bg-primary"
      />
      <ResizablePanel
        id="workspace-main"
        minSize="0px"
        className="h-full min-h-0 min-w-0 overflow-hidden"
      >
        {content}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<
    "preferences" | "shortcuts"
  >("preferences");
  const sidebarWidth = usePreferences((state) => state.sidebarWidth);
  const openSettings = useCallback(
    (section: "preferences" | "shortcuts" = "preferences") => {
      setSettingsSection(section);
      setSettingsOpen(true);
    },
    [],
  );

  return (
    <LayoutGroup id="workspace">
      <SidebarProvider
        className="h-dvh min-h-0 overflow-hidden"
        style={
          {
            "--sidebar-width": `${sidebarWidth}px`,
            "--sidebar-width-icon": "56px",
          } as CSSProperties
        }
      >
        <a
          href="#main-content"
          className="sr-only z-50 rounded-md bg-background px-4 py-2 text-sm focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:ring-2 focus:ring-ring"
        >
          跳到主要内容
        </a>
        <CommandMenuProvider openSettings={openSettings}>
          <Workspace openSettings={openSettings}>{children}</Workspace>
          <SettingsDialog
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            section={settingsSection}
          />
        </CommandMenuProvider>
      </SidebarProvider>
    </LayoutGroup>
  );
}
