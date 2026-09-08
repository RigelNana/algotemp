import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { defaultFilter } from "cmdk";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  BookOpen,
  Clock3,
  FileCode2,
  Folder,
  Keyboard,
  Monitor,
  Moon,
  PanelLeft,
  Search,
  Settings2,
  Star,
  Sun,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useSidebar } from "@/components/ui/sidebar";
import { algorithms, categories } from "@/algorithms/registry";
import { catalogEntries, getTopicTrail } from "@/algorithms/catalog";
import { usePreferences } from "@/stores/preferences";
import { motionTimings } from "@/lib/motion";

export type CommandMode = "search" | "open" | "commands";
const CommandMenuContext = createContext<{
  openCommand: (mode?: CommandMode) => void;
} | null>(null);

export function useCommandMenu() {
  const context = useContext(CommandMenuContext);
  if (!context) throw new Error("useCommandMenu must be used within AppShell.");
  return context;
}

const directoryRoots = categories.map((category) => ({
  id: `category:${category.slug}`,
  category: category.slug,
  title: category.title,
  topic: undefined as string | undefined,
  context: category.title,
  keywords: [category.title, category.slug],
}));
const directoryEntries = [
  ...directoryRoots,
  ...catalogEntries.map(({ category, topic, trail }) => ({
    id: `topic:${topic.id}`,
    category: category.slug,
    title: topic.title,
    topic: topic.id,
    context: [category.title, ...trail.map((item) => item.title)].join(" / "),
    keywords: [
      category.title,
      category.slug,
      ...trail.map((item) => item.title),
    ],
  })),
];
const searchEntries = algorithms.map((algorithm) => {
  const category = categories.find((item) => item.slug === algorithm.category);
  const context = [
    category?.title ?? algorithm.categoryLabel ?? algorithm.category,
    ...getTopicTrail(algorithm.category, algorithm.topicId ?? "").map(
      (topic) => topic.title,
    ),
    algorithm.title,
  ].join(" / ");
  return {
    algorithm,
    context,
    keywords: [
      context,
      algorithm.title,
      algorithm.description ?? "",
      algorithm.category,
      algorithm.categoryLabel ?? "",
      ...(algorithm.aliases ?? []),
      ...algorithm.tags,
      ...(algorithm.keywords ?? []),
      ...algorithm.implementations.flatMap((implementation) => [
        implementation.language,
        implementation.label ?? "",
      ]),
      algorithm.complexity?.time ?? "",
      algorithm.complexity?.space ?? "",
    ],
  };
});
const directoryResultLimit = 40;

export function CommandMenuProvider({
  children,
  openSettings,
}: {
  children: ReactNode;
  openSettings: (section?: "preferences" | "shortcuts") => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CommandMode>("search");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { toggleSidebar, setOpenMobile } = useSidebar();
  const setTheme = usePreferences((state) => state.setTheme);
  const recent = usePreferences((state) => state.recentAlgorithms);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();

  const openCommand = useCallback(
    (nextMode: CommandMode = "search") => {
      if (!open)
        restoreFocus.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
      setMode(nextMode);
      setQuery("");
      setOpenMobile(false);
      setOpen(true);
    },
    [open, setOpenMobile],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        !(event.metaKey || event.ctrlKey) ||
        event.altKey ||
        event.isComposing
      )
        return;
      const key = event.key.toLowerCase();
      if (key === "k" && !event.shiftKey) {
        event.preventDefault();
        openCommand("search");
      } else if (key === "p") {
        event.preventDefault();
        openCommand(event.shiftKey ? "commands" : "open");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openCommand]);

  useEffect(() => {
    if (!open && restoreFocus.current) {
      const element = restoreFocus.current;
      const frame = requestAnimationFrame(() => {
        if (element.isConnected) element.focus();
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [open]);

  const context = useMemo(() => ({ openCommand }), [openCommand]);
  const entries = useMemo(
    () =>
      mode === "open"
        ? [...searchEntries].sort((a, b) => {
            const aIndex = recent.indexOf(a.algorithm.id);
            const bIndex = recent.indexOf(b.algorithm.id);
            return (
              (aIndex === -1 ? Infinity : aIndex) -
              (bIndex === -1 ? Infinity : bIndex)
            );
          })
        : searchEntries,
    [mode, recent],
  );
  const directoryMatches = useMemo(() => {
    if (!query.trim()) return directoryRoots;
    return directoryEntries
      .map((entry) => ({
        entry,
        score: defaultFilter(entry.id, query, entry.keywords),
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ entry }) => entry);
  }, [query]);

  const run = (action: () => void) => {
    setOpen(false);
    setOpenMobile(false);
    action();
  };
  const showSettings = (section: "preferences" | "shortcuts") => {
    restoreFocus.current = null;
    run(() => window.setTimeout(() => openSettings(section), 0));
  };
  const title =
    mode === "commands"
      ? "命令面板"
      : mode === "open"
        ? "快速打开"
        : "搜索目录与算法";

  return (
    <CommandMenuContext.Provider value={context}>
      {children}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description="使用上下方向键选择，Enter 打开，Esc 关闭。"
        showCloseButton={false}
        className="top-[20%] translate-y-0 gap-0 sm:max-w-[560px]"
      >
        <div>
          <CommandInput
            aria-label={title}
            placeholder={
              mode === "commands"
                ? "输入命令…"
                : mode === "open"
                  ? "输入分类、专题或算法名称…"
                  : "搜索目录、祖先分类、标签或算法…"
            }
            value={query}
            onValueChange={setQuery}
          />
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
            transition={reducedMotion ? { duration: 0 } : motionTimings.fast}
          >
            <CommandList className="max-h-[min(400px,50dvh)] min-h-40">
              <CommandEmpty>
                <div className="mx-auto flex max-w-80 flex-col items-center px-5 py-5">
                  <Search className="mb-3 size-5 text-muted-foreground" />
                  <p>没有找到匹配结果</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    试试其他专题名称、上级分类或关键词。
                  </p>
                </div>
              </CommandEmpty>
              {mode !== "commands" && directoryMatches.length > 0 && (
                <CommandGroup
                  heading={
                    query.trim()
                      ? directoryMatches.length > directoryResultLimit
                        ? `目录 · 最相关的 ${directoryResultLimit} 项`
                        : "目录"
                      : "专题目录"
                  }
                >
                  {directoryMatches
                    .slice(0, directoryResultLimit)
                    .map((entry) => (
                      <CommandItem
                        key={entry.id}
                        value={entry.id}
                        keywords={entry.keywords}
                        aria-label={entry.context}
                        onSelect={() =>
                          run(
                            () =>
                              void navigate({
                                to: "/algorithms/$category",
                                params: { category: entry.category },
                                search: entry.topic
                                  ? { topic: entry.topic }
                                  : {},
                              }),
                          )
                        }
                      >
                        <Folder />
                        <div className="min-w-0 flex-1" title={entry.context}>
                          <span className="block truncate">{entry.title}</span>
                          {entry.topic && (
                            <span className="block text-xs leading-5 text-muted-foreground">
                              {entry.context}
                            </span>
                          )}
                        </div>
                        <ArrowUpRight className="size-3.5 shrink-0" />
                      </CommandItem>
                    ))}
                </CommandGroup>
              )}
              {mode !== "commands" && entries.length > 0 && (
                <CommandGroup
                  heading={mode === "open" ? "算法 · 最近访问优先" : "算法"}
                >
                  {entries.map(({ algorithm, keywords, context }) => (
                    <CommandItem
                      key={algorithm.id}
                      value={algorithm.id}
                      keywords={keywords}
                      aria-label={context}
                      onSelect={() =>
                        run(
                          () =>
                            void navigate({
                              to: "/algorithms/$category/$algorithm",
                              params: {
                                category: algorithm.category,
                                algorithm: algorithm.slug,
                              },
                            }),
                        )
                      }
                    >
                      <FileCode2 />
                      <div className="min-w-0 flex-1" title={context}>
                        <span className="block truncate">
                          {algorithm.title}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {context}
                          {algorithm.implementations.length
                            ? ` · ${algorithm.implementations.map((item) => item.label ?? item.language).join(", ")}`
                            : ""}
                        </span>
                      </div>
                      <ArrowUpRight className="size-3.5" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {mode === "commands" && (
                <>
                  <CommandGroup heading="前往">
                    <CommandItem
                      value="模板库 library"
                      onSelect={() =>
                        run(() => void navigate({ to: "/algorithms" }))
                      }
                    >
                      <BookOpen />
                      模板库
                    </CommandItem>
                    <CommandItem
                      value="收藏 favorites"
                      onSelect={() =>
                        run(() => void navigate({ to: "/favorites" }))
                      }
                    >
                      <Star />
                      收藏
                    </CommandItem>
                    <CommandItem
                      value="最近访问 recent"
                      onSelect={() =>
                        run(() => void navigate({ to: "/recent" }))
                      }
                    >
                      <Clock3 />
                      最近访问
                    </CommandItem>
                  </CommandGroup>
                  <CommandGroup heading="工作区">
                    <CommandItem
                      value="切换侧边栏 sidebar"
                      onSelect={() => run(toggleSidebar)}
                    >
                      <PanelLeft />
                      切换侧边栏
                    </CommandItem>
                    <CommandItem
                      value="设置 settings"
                      onSelect={() => showSettings("preferences")}
                    >
                      <Settings2 />
                      打开设置
                    </CommandItem>
                    <CommandItem
                      value="键盘快捷键 shortcuts"
                      onSelect={() => showSettings("shortcuts")}
                    >
                      <Keyboard />
                      查看键盘快捷键
                    </CommandItem>
                  </CommandGroup>
                  <CommandGroup heading="外观">
                    <CommandItem
                      value="浅色主题 light"
                      onSelect={() => run(() => setTheme("light"))}
                    >
                      <Sun />
                      切换为浅色
                    </CommandItem>
                    <CommandItem
                      value="深色主题 dark"
                      onSelect={() => run(() => setTheme("dark"))}
                    >
                      <Moon />
                      切换为深色
                    </CommandItem>
                    <CommandItem
                      value="跟随系统 system"
                      onSelect={() => run(() => setTheme("system"))}
                    >
                      <Monitor />
                      跟随系统
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </motion.div>
        </AnimatePresence>
        <div className="flex items-center justify-between border-t px-4 py-2.5 text-[11px] text-muted-foreground">
          <span>{title}</span>
          <span>
            <kbd className="font-mono">↑ ↓</kbd> 选择{" "}
            <kbd className="ml-2 font-mono">Enter</kbd> 打开{" "}
            <kbd className="ml-2 font-mono">Esc</kbd> 关闭
          </span>
        </div>
      </CommandDialog>
    </CommandMenuContext.Provider>
  );
}
