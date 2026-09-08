import { useEffect, useId, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Code2,
  Copy,
  Ellipsis,
  ExternalLink,
  Link2,
  ListTree,
  Star,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import type { Algorithm, AlgorithmSection } from "@/algorithms/types";
import { CodePanel } from "@/components/code/code-panel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";
import { copyText } from "@/lib/clipboard";
import { motionTimings } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/stores/preferences";
import { AlgorithmNotes } from "./algorithm-notes";

const emptySections: AlgorithmSection[] = [];
const workbenchTabs = [
  { value: "notes", label: "讲解", icon: BookOpen },
  { value: "code", label: "代码", icon: Code2 },
] as const;

export function AlgorithmPage({ algorithm }: { algorithm: Algorithm }) {
  const desktop = useMediaQuery("(min-width: 1100px)");
  const reducedMotion = useReducedMotion();
  const favorite = usePreferences((state) =>
    state.favorites.includes(algorithm.id),
  );
  const toggleFavorite = usePreferences((state) => state.toggleFavorite);
  const visitAlgorithm = usePreferences((state) => state.visitAlgorithm);
  const language = usePreferences((state) => state.codePreferences.language);
  const [activeTab, setActiveTab] = useState("notes");
  const [tocOpen, setTocOpen] = useState(false);
  const notesContainer = useRef<HTMLDivElement>(null);
  const headingRefs = useRef(new Map<string, HTMLHeadingElement>());
  const pendingHeading = useRef<string | null>(null);
  const frame = useRef<number | null>(null);
  const underlineId = useId();
  const sections = algorithm.content?.sections ?? emptySections;
  const implementation =
    algorithm.implementations.find((item) => item.language === language) ??
    algorithm.implementations[0];
  const favoriteLabel = favorite ? "取消收藏" : "收藏算法";

  useEffect(() => {
    visitAlgorithm(algorithm.id);
  }, [algorithm.id, visitAlgorithm]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${algorithm.title} · 算法工作台`;
    return () => {
      document.title = previousTitle;
    };
  }, [algorithm.title]);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  function changeFavorite() {
    toggleFavorite(algorithm.id);
    toast.success(favorite ? "已取消收藏" : "已添加到收藏", {
      description: algorithm.title,
    });
  }

  function selectHeading(id: string) {
    pendingHeading.current = id;
    setActiveTab("notes");
    setTocOpen(false);
  }

  function focusSelectedHeading(event: Event) {
    if (!pendingHeading.current) return;
    event.preventDefault();
    const id = pendingHeading.current;
    pendingHeading.current = null;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const heading = headingRefs.current.get(id);
      const container = notesContainer.current;
      if (!heading || !container) return;
      heading.focus({ preventScroll: true });
      container.scrollTo({
        top:
          container.scrollTop +
          heading.getBoundingClientRect().top -
          container.getBoundingClientRect().top -
          28,
        behavior: reducedMotion ? "instant" : "smooth",
      });
    });
  }

  const notes = (
    <AlgorithmNotes
      title={algorithm.title}
      sections={sections}
      containerRef={notesContainer}
      headingRefs={headingRefs}
    />
  );
  const code = (
    <CodePanel
      implementations={algorithm.implementations}
      title={algorithm.title}
    />
  );

  return (
    <motion.div
      key={algorithm.id}
      initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionTimings.normal}
      className="mx-auto flex h-full w-full min-h-0 min-w-0 max-w-[1800px] flex-col overflow-hidden bg-background"
    >
      <header className="max-h-[45%] shrink-0 overflow-y-auto border-b px-4 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 pt-0.5">
            <h1 className="break-words text-xl font-semibold tracking-tight">
              {algorithm.title}
            </h1>
            {algorithm.description && (
              <p className="mt-1.5 max-w-[760px] whitespace-pre-line break-words text-sm leading-6 text-muted-foreground">
                {algorithm.description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={favoriteLabel}
                  aria-pressed={favorite}
                  onClick={changeFavorite}
                >
                  <motion.span
                    key={`${algorithm.id}-${favorite}`}
                    initial={false}
                    animate={{
                      scale: reducedMotion || !favorite ? 1 : [1, 1.18, 1],
                      rotate: reducedMotion || !favorite ? 0 : [0, -8, 0],
                    }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                    className="inline-flex"
                  >
                    <Star
                      aria-hidden="true"
                      className={cn(
                        "size-4",
                        favorite && "fill-primary text-primary",
                      )}
                    />
                  </motion.span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{favoriteLabel}</TooltipContent>
            </Tooltip>
            {sections.length > 0 && (
              <Sheet open={tocOpen} onOpenChange={setTocOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label="打开讲解目录"
                      >
                        <ListTree className="size-4" aria-hidden="true" />
                      </Button>
                    </SheetTrigger>
                  </TooltipTrigger>
                  <TooltipContent>讲解目录</TooltipContent>
                </Tooltip>
                <SheetContent
                  side="right"
                  showCloseButton={false}
                  className="w-[min(340px,90vw)] gap-0 motion-reduce:animate-none"
                  onCloseAutoFocus={focusSelectedHeading}
                >
                  <SheetHeader className="border-b pr-12">
                    <SheetTitle>讲解目录</SheetTitle>
                    <SheetDescription className="break-words">
                      {algorithm.title}
                    </SheetDescription>
                  </SheetHeader>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-3 top-3 size-8"
                      aria-label="关闭讲解目录"
                      title="关闭讲解目录"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </Button>
                  </SheetClose>
                  <nav
                    aria-label="讲解章节"
                    className="min-h-0 flex-1 overflow-y-auto p-3"
                  >
                    <ul className="space-y-1">
                      {sections.map((section) => (
                        <li key={section.id}>
                          <a
                            href={`#${encodeURIComponent(section.id)}`}
                            onClick={(event) => {
                              event.preventDefault();
                              selectHeading(section.id);
                            }}
                            className="block break-words rounded-md px-3 py-2 text-sm leading-6 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {section.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </SheetContent>
              </Sheet>
            )}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="更多算法操作"
                    >
                      <Ellipsis className="size-4" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>更多操作</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onSelect={() => {
                    void copyText(window.location.href, "链接已复制");
                  }}
                >
                  <Link2 aria-hidden="true" />
                  复制当前链接
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!implementation}
                  onSelect={() => {
                    if (implementation)
                      void copyText(implementation.code, "代码已复制");
                  }}
                >
                  <Copy aria-hidden="true" />
                  复制当前语言代码
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={changeFavorite}>
                  <Star
                    aria-hidden="true"
                    className={cn(favorite && "fill-current")}
                  />
                  {favoriteLabel}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    to="/algorithms/$category/$algorithm"
                    params={{
                      category: algorithm.category,
                      algorithm: algorithm.slug,
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink aria-hidden="true" />
                    在新标签页打开
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {(algorithm.tags.length > 0 ||
          algorithm.complexity?.time ||
          algorithm.complexity?.space) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            {algorithm.tags.length > 0 && (
              <ul aria-label="算法标签" className="flex flex-wrap gap-1.5">
                {algorithm.tags.map((tag) => (
                  <li
                    key={tag}
                    className="max-w-full break-words rounded border bg-muted/40 px-1.5 py-0.5 text-muted-foreground"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
            {(algorithm.complexity?.time || algorithm.complexity?.space) && (
              <dl className="flex flex-wrap gap-x-4 gap-y-2 text-muted-foreground">
                {algorithm.complexity.time && (
                  <div className="flex min-w-0 gap-1.5">
                    <dt className="shrink-0">时间</dt>
                    <dd className="break-all font-mono text-foreground">
                      {algorithm.complexity.time}
                    </dd>
                  </div>
                )}
                {algorithm.complexity.space && (
                  <div className="flex min-w-0 gap-1.5">
                    <dt className="shrink-0">空间</dt>
                    <dd className="break-all font-mono text-foreground">
                      {algorithm.complexity.space}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        )}
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">
        {desktop ? (
          <ResizablePanelGroup
            orientation="horizontal"
            className="min-h-0"
            aria-label="算法讲解与代码工作区"
          >
            <ResizablePanel
              defaultSize="45%"
              minSize="25%"
              className="flex min-h-0 min-w-0 flex-col"
            >
              <div className="flex h-11 shrink-0 items-center gap-2 border-b px-5 text-xs font-medium text-muted-foreground">
                <BookOpen className="size-3.5" aria-hidden="true" />
                讲解
              </div>
              <div className="min-h-0 flex-1">{notes}</div>
            </ResizablePanel>
            <ResizableHandle
              withHandle
              aria-label="调整讲解与代码面板宽度"
              className="z-10 transition-colors hover:bg-primary/50 focus-visible:bg-primary"
            />
            <ResizablePanel
              defaultSize="55%"
              minSize="30%"
              className="min-h-0 min-w-0"
            >
              {code}
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full min-h-0 gap-0"
          >
            <div className="shrink-0 border-b px-3">
              <TabsList
                variant="line"
                aria-label="算法工作区"
                className="gap-3 p-0 group-data-[orientation=horizontal]/tabs:h-11"
              >
                {workbenchTabs.map(({ value, label, icon: Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="relative h-11 flex-none rounded-none border-0 px-2 text-xs after:hidden"
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {label}
                    {activeTab === value && (
                      <motion.span
                        layoutId={`${underlineId}-tab`}
                        className="absolute inset-x-1 bottom-0 h-0.5 bg-primary"
                        transition={
                          reducedMotion ? { duration: 0 } : motionTimings.normal
                        }
                      />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <TabsContent value="notes" className="m-0 min-h-0 overflow-hidden">
              {notes}
            </TabsContent>
            <TabsContent value="code" className="m-0 min-h-0 overflow-hidden">
              {code}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </motion.div>
  );
}
