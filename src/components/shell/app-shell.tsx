import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { LayoutGroup } from "motion/react";
import { usePanelRef } from "react-resizable-panels";
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
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { CommandMenuProvider } from "./command-menu";
import { SettingsDialog } from "./settings-dialog";
import { usePreferences } from "@/stores/preferences";

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
  width.current = sidebarWidth;

  useEffect(() => {
    if (isMobile) return;
    // Apply the saved width after Panel has registered its expanded constraints.
    const frame = requestAnimationFrame(() =>
      sidebarRef.current?.resize(open ? width.current : 56),
    );
    return () => cancelAnimationFrame(frame);
  }, [open, isMobile, sidebarRef]);

  const content = (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background outline-none"
    >
      {isMobile && (
        <div className="shrink-0 px-4 pt-3">
          <SidebarTrigger aria-label="打开导航" />
        </div>
      )}
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
      className="min-h-0"
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
