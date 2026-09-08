import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowDownAZ,
  ArrowLeft,
  ArrowUpRight,
  ChevronRight,
  Clock3,
  FileCode2,
  Search,
  Star,
} from "lucide-react";
import {
  getTopic,
  getTopicTrail,
  isTopicWithin,
  type CatalogCategory,
  type CatalogTopic,
} from "@/algorithms/catalog";
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
import { toast } from "sonner";

type Collection = "library" | "favorites" | "recent";
type LibraryProps = {
  collection: Collection;
  category?: string;
  topic?: string;
};
const collectionDetails = {
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

function TopicPreview({ topics }: { topics: CatalogTopic[] }) {
  if (!topics.length) return null;
  return (
    <p className="mt-1.5 text-xs leading-6 text-muted-foreground [overflow-wrap:anywhere]">
      {topics
        .slice(0, 3)
        .map((topic) => topic.title)
        .join(" · ")}
      {topics.length > 3 && " 等专题"}
    </p>
  );
}

function SourceCredit({ source }: { source: CatalogCategory["source"] }) {
  if (!source) return null;
  return (
    <p className="text-xs leading-6 text-muted-foreground [overflow-wrap:anywhere]">
      目录来源：{source.author} ·{" "}
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-sm underline decoration-border underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        {source.title}
        <ArrowUpRight
          className="ml-1 inline size-3.5 align-text-bottom"
          aria-hidden="true"
        />
      </a>
    </p>
  );
}

export function AlgorithmLibrary(props: LibraryProps) {
  return (
    <LibraryContent
      key={`${props.collection}/${props.category ?? ""}/${props.topic ?? ""}`}
      {...props}
    />
  );
}

function LibraryContent({ collection, category, topic }: LibraryProps) {
  const favorites = usePreferences((state) => state.favorites);
  const recent = usePreferences((state) => state.recentAlgorithms);
  const toggleFavorite = usePreferences((state) => state.toggleFavorite);
  const [query, setQuery] = useState("");
  const [sorted, setSorted] = useState(false);
  const currentCategory = categories.find((item) => item.slug === category);
  const currentTopic =
    category && topic ? getTopic(category, topic) : undefined;
  const trail = category && topic ? getTopicTrail(category, topic) : [];
  const parentTopic = trail.at(-2);
  const topics = currentTopic?.children ?? currentCategory?.topics ?? [];
  const details =
    collection === "library" ? undefined : collectionDetails[collection];
  const title =
    currentTopic?.title ?? currentCategory?.title ?? details?.title ?? "模板库";
  useEffect(() => {
    document.title = `${title} · Algorithm`;
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
    if (collection === "library" && topic)
      items = items.filter((item) => isTopicWithin(item.topicId, topic));
    return items;
  }, [collection, category, topic, favorites, recent]);
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
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <h1 className="sr-only">{title}</h1>
      <ScrollArea className="min-h-0 min-w-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:!block">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 md:px-9">
          {collection === "library" && !currentCategory && (
            <section aria-label="算法专题目录">
              <p className="mb-5 text-xs leading-6 text-muted-foreground">
                专题目录整理自灵茶山艾府（0x3F）题单。目录与算法实现分开维护。
              </p>
              <ul className="border-t">
                {categories.map((item) => (
                  <li
                    key={item.slug}
                    className="border-b border-border/70 py-1"
                  >
                    <Link
                      to="/algorithms/$category"
                      params={{ category: item.slug }}
                      search={{}}
                      className="group -mx-2 flex min-w-0 items-start gap-3 rounded-md px-2 py-3 transition-colors hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium leading-6 transition-colors group-hover:text-primary [overflow-wrap:anywhere]">
                          {item.title}
                        </span>
                        <TopicPreview topics={item.topics} />
                      </div>
                      <ChevronRight
                        className="mt-1 size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </Link>
                    {item.source && (
                      <a
                        href={item.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`查看${item.source.author}的${item.source.title}`}
                        className="mb-2 inline-flex items-center gap-1 rounded-sm text-xs leading-6 text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        原始题单
                        <ArrowUpRight className="size-3" aria-hidden="true" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {collection === "library" && currentCategory && (
            <section aria-label="当前专题目录">
              {currentTopic && (
                <Link
                  to="/algorithms/$category"
                  params={{ category: currentCategory.slug }}
                  search={parentTopic ? { topic: parentTopic.id } : {}}
                  className="mb-5 inline-flex max-w-full items-start gap-2 rounded-sm text-xs leading-6 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <ArrowLeft
                    className="mt-1 size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 [overflow-wrap:anywhere]">
                    上一级：{parentTopic?.title ?? currentCategory.title}
                  </span>
                </Link>
              )}
              {topics.length > 0 && (
                <ul className="border-t">
                  {topics.map((item) => (
                    <li key={item.id} className="border-b border-border/70">
                      <Link
                        to="/algorithms/$category"
                        params={{ category: currentCategory.slug }}
                        search={{ topic: item.id }}
                        className="group -mx-2 flex min-w-0 items-start gap-3 rounded-md px-2 py-4 transition-colors hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium leading-6 transition-colors group-hover:text-primary [overflow-wrap:anywhere]">
                            {item.title}
                          </span>
                          <TopicPreview topics={item.children} />
                        </div>
                        <ChevronRight
                          className="mt-1 size-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {entries.length === 0 && (
                <div className={topics.length ? "pt-6" : "py-8"}>
                  <h2 className="text-sm font-medium leading-6">
                    {topics.length
                      ? "此目录下暂无算法实现"
                      : "此专题尚无算法实现"}
                  </h2>
                  <p className="mt-1 max-w-prose text-sm leading-7 text-muted-foreground">
                    {topics.length
                      ? "可以继续浏览子专题，或前往原始题单查看题目。"
                      : "这里只收录了专题目录，尚未登记代码模板。可返回上一级，或前往原始题单查看题目。"}
                  </p>
                </div>
              )}
              <div className="mt-5">
                <SourceCredit source={currentCategory.source} />
              </div>
            </section>
          )}

          {details && entries.length === 0 && (
            <EmptyState
              icon={details.icon}
              title={details.emptyTitle}
              description={details.emptyDescription}
            >
              <Button variant="outline" size="sm" asChild>
                <Link to="/algorithms" search={{}}>
                  打开模板库
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </Button>
            </EmptyState>
          )}

          {entries.length > 0 && (
            <section
              aria-label="已登记的算法实现"
              className={collection === "library" ? "mt-8" : undefined}
            >
              <div className="flex items-center gap-3 border-b pb-3">
                <div className="relative min-w-0 max-w-sm flex-1">
                  <Search
                    className="absolute top-2.5 left-3 size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="筛选当前算法…"
                    aria-label="筛选当前算法"
                    className="h-9 pl-9 shadow-none"
                  />
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={sorted ? "secondary" : "ghost"}
                      size="icon"
                      className="size-8 shrink-0"
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
              {filtered.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="没有匹配的模板"
                  description="换一个名称、标签或代码语言试试。"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery("")}
                  >
                    清除筛选
                  </Button>
                </EmptyState>
              ) : (
                <>
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
                            className="min-w-0 rounded-sm pr-2 focus-visible:outline-2 focus-visible:outline-ring"
                          >
                            <span className="flex items-start gap-2 text-sm font-medium leading-6 transition-colors group-hover:text-primary">
                              <FileCode2 className="mt-1 size-4 shrink-0 text-muted-foreground" />
                              <span className="min-w-0 [overflow-wrap:anywhere]">
                                {algorithm.title}
                              </span>
                            </span>
                            {algorithm.description && (
                              <p className="mt-1.5 text-xs leading-6 text-muted-foreground [overflow-wrap:anywhere]">
                                {algorithm.description}
                              </p>
                            )}
                          </Link>
                          <Link
                            to="/algorithms/$category"
                            params={{ category: algorithm.category }}
                            search={{}}
                            className="hidden rounded-sm pr-3 text-xs leading-5 text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-ring md:block [overflow-wrap:anywhere]"
                          >
                            {algorithm.categoryLabel ?? algorithm.category}
                          </Link>
                          <span className="hidden truncate font-mono text-xs text-muted-foreground md:block">
                            {algorithm.implementations
                              .map(
                                (implementation) =>
                                  implementation.label ??
                                  implementation.language,
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
                </>
              )}
            </section>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
