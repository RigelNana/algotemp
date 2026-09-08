import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowDownAZ,
  ArrowUpRight,
  Clock3,
  FileCode2,
  Files,
  Search,
  Star,
} from "lucide-react";
import { algorithms, categories } from "@/algorithms/registry";
import { usePreferences } from "@/stores/preferences";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EmptyState } from "@/components/shared/empty-state";
import { motionTimings } from "@/lib/motion";
import { toast } from "sonner";

type Collection = "library" | "favorites" | "recent";
const collectionDetails = {
  library: {
    title: "模板库",
    icon: Files,
    emptyTitle: "模板库还是空的",
    emptyDescription: "添加真实算法后，分类、检索与代码工作台会自动就绪。",
  },
  favorites: {
    title: "收藏",
    icon: Star,
    emptyTitle: "还没有收藏",
    emptyDescription: "在算法页面点击星标，将常用模板收在这里。",
  },
  recent: {
    title: "最近访问",
    icon: Clock3,
    emptyTitle: "还没有访问记录",
    emptyDescription: "打开过的算法会自动出现在这里，最近访问的排在最前。",
  },
} as const;

export function AlgorithmLibrary({
  collection,
  category,
}: {
  collection: Collection;
  category?: string;
}) {
  const favorites = usePreferences((state) => state.favorites);
  const recent = usePreferences((state) => state.recentAlgorithms);
  const toggleFavorite = usePreferences((state) => state.toggleFavorite);
  const reducedMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [sorted, setSorted] = useState(false);
  const details = collectionDetails[collection];
  const currentCategory = categories.find((item) => item.slug === category);
  const title = currentCategory?.title ?? details.title;
  useEffect(() => {
    document.title = `${title} · Algorithm`;
    setQuery("");
  }, [title]);
  const entries = useMemo(() => {
    let items =
      collection === "recent"
        ? recent.flatMap((id) => {
            const item = algorithms.find((algorithm) => algorithm.id === id);
            return item ? [item] : [];
          })
        : collection === "favorites"
          ? algorithms.filter((item) => favorites.includes(item.id))
          : algorithms;
    if (category) items = items.filter((item) => item.category === category);
    return items;
  }, [collection, category, favorites, recent]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const result = entries.filter((item) =>
      [
        item.title,
        item.description,
        item.categoryLabel,
        item.category,
        ...item.tags,
        ...(item.aliases ?? []),
        ...(item.keywords ?? []),
        ...item.implementations.map(
          (implementation) => implementation.language,
        ),
        item.complexity?.time,
        item.complexity?.space,
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalized),
    );
    return sorted
      ? result.sort((a, b) => a.title.localeCompare(b.title, "zh-CN"))
      : result;
  }, [entries, query, sorted]);

  return (
    <motion.div
      key={`${collection}/${category ?? ""}`}
      initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionTimings.normal}
      className="flex h-full min-h-0 flex-col"
    >
      <h1 className="sr-only">{title}</h1>
      {entries.length > 0 && (
        <div className="flex shrink-0 items-center gap-3 border-b px-6 py-3 md:px-9">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="筛选当前列表…"
              aria-label="筛选当前列表"
              className="h-9 pl-9 shadow-none"
            />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={sorted ? "secondary" : "ghost"}
                size="icon"
                className="size-8"
                aria-label="按名称排序"
                aria-pressed={sorted}
                onClick={() => setSorted(!sorted)}
              >
                <ArrowDownAZ className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>按名称排序</TooltipContent>
          </Tooltip>
        </div>
      )}
      <ScrollArea className="min-h-0 flex-1">
        {entries.length === 0 ? (
          <div className="mx-auto flex min-h-[480px] max-w-3xl flex-col items-center justify-center px-4 py-8 sm:py-12">
            <EmptyState
              icon={details.icon}
              title={details.emptyTitle}
              description={details.emptyDescription}
            >
              {collection === "library" ? (
                <div className="flex flex-col items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    从算法注册表开始
                  </span>
                  <code className="inline-flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs">
                    <FileCode2 className="size-3.5 text-muted-foreground" />
                    src/algorithms/registry.ts
                  </code>
                </div>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/algorithms">
                    打开模板库
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </Button>
              )}
            </EmptyState>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="没有匹配的模板"
            description="换一个名称、标签或代码语言试试。"
          >
            <Button variant="outline" size="sm" onClick={() => setQuery("")}>
              清除筛选
            </Button>
          </EmptyState>
        ) : (
          <div className="mx-auto max-w-[1400px] px-6 py-4 md:px-9">
            <div className="grid grid-cols-[1fr_auto] items-center border-b py-3 text-xs text-muted-foreground md:grid-cols-[minmax(0,1fr)_160px_130px_36px]">
              <span>算法名称</span>
              <span className="hidden md:block">分类</span>
              <span className="hidden md:block">代码语言</span>
              <span className="sr-only">收藏</span>
            </div>
            <ul>
              {filtered.map((algorithm) => {
                const favorite = favorites.includes(algorithm.id);
                return (
                  <li
                    key={algorithm.id}
                    className="group grid grid-cols-[minmax(0,1fr)_36px] items-center gap-2 border-b border-border/70 py-4 md:grid-cols-[minmax(0,1fr)_160px_130px_36px]"
                  >
                    <Link
                      to="/algorithms/$category/$algorithm"
                      params={{
                        category: algorithm.category,
                        algorithm: algorithm.slug,
                      }}
                      className="min-w-0 rounded-sm pr-4"
                    >
                      <span className="flex items-center gap-2 font-medium transition-colors group-hover:text-primary">
                        <FileCode2 className="size-4 text-muted-foreground" />
                        <span className="truncate">{algorithm.title}</span>
                      </span>
                      {algorithm.description && (
                        <p className="mt-1.5 truncate text-xs text-muted-foreground">
                          {algorithm.description}
                        </p>
                      )}
                    </Link>
                    <Link
                      to="/algorithms/$category"
                      params={{ category: algorithm.category }}
                      className="hidden truncate text-xs text-muted-foreground hover:text-primary md:block"
                    >
                      {algorithm.categoryLabel ?? algorithm.category}
                    </Link>
                    <span className="hidden truncate font-mono text-xs text-muted-foreground md:block">
                      {algorithm.implementations
                        .map(
                          (implementation) =>
                            implementation.label ?? implementation.language,
                        )
                        .join(" / ")}
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          aria-label={`${favorite ? "取消收藏" : "收藏"} ${algorithm.title}`}
                          aria-pressed={favorite}
                          onClick={() => {
                            toggleFavorite(algorithm.id);
                            toast.success(
                              favorite ? "已取消收藏" : "已加入收藏",
                            );
                          }}
                        >
                          <Star
                            className={
                              favorite
                                ? "size-4 fill-primary text-primary"
                                : "size-4 text-muted-foreground"
                            }
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {favorite ? "取消收藏" : "收藏"}
                      </TooltipContent>
                    </Tooltip>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
}
