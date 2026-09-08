import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowDownAZ,
  ArrowUpRight,
  Clock3,
  FileCode2,
  Search,
  Star,
} from "lucide-react";
import {
  catalogEntries,
  getTopic,
  isTopicWithin,
  type CatalogCategory,
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

function SourceCredit({ source }: { source: CatalogCategory["source"] }) {
  if (!source) return null;
  return (
    <p className="text-xs leading-6 text-muted-foreground [overflow-wrap:anywhere]">
      标签来源：{source.author} ·{" "}
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
  return <LibraryContent key={props.collection} {...props} />;
}

function LibraryContent({ collection, category, topic }: LibraryProps) {
  const favorites = usePreferences((state) => state.favorites);
  const recent = usePreferences((state) => state.recentAlgorithms);
  const toggleFavorite = usePreferences((state) => state.toggleFavorite);
  const [query, setQuery] = useState("");
  const [sorted, setSorted] = useState(false);
  const [topicQuery, setTopicQuery] = useState("");
  const currentCategory = categories.find((item) => item.slug === category);
  const currentTopic =
    category && topic ? getTopic(category, topic) : undefined;
  const topicChoices = useMemo(() => {
    const choices = catalogEntries.filter(
      (entry) => entry.category.slug === category,
    );
    const titleCounts = new Map<string, number>();
    for (const { topic: item } of choices)
      titleCounts.set(item.title, (titleCounts.get(item.title) ?? 0) + 1);
    return choices.map(({ topic: item, trail }) => ({
      id: item.id,
      title:
        (titleCounts.get(item.title) ?? 0) > 1
          ? trail.map((part) => part.title).join(" · ")
          : item.title,
      context: trail.map((part) => part.title).join(" · "),
    }));
  }, [category]);
  const visibleTopics = useMemo(() => {
    const normalized = topicQuery.trim().toLocaleLowerCase();
    return topicChoices.filter(
      (item) =>
        item.id === currentTopic?.id ||
        item.context.toLocaleLowerCase().includes(normalized),
    );
  }, [topicChoices, topicQuery, currentTopic?.id]);
  const clearQueries = () => {
    setQuery("");
    setTopicQuery("");
  };
  useEffect(() => {
    setQuery("");
    setTopicQuery("");
  }, [category]);
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
          {collection === "library" && (
            <section aria-label="标签筛选" className="space-y-5">
              <div
                className="flex min-w-0 flex-wrap gap-2"
                role="group"
                aria-label="分类标签"
              >
                <Button
                  variant={!currentCategory ? "default" : "outline"}
                  size="sm"
                  className="shadow-none"
                  asChild
                >
                  <Link
                    activeOptions={{ exact: true }}
                    to="/algorithms"
                    search={{}}
                    resetScroll={false}
                    aria-current={!currentCategory ? "true" : undefined}
                    onClick={clearQueries}
                  >
                    全部
                  </Link>
                </Button>
                {categories.map((item) => (
                  <Button
                    key={item.slug}
                    variant={category === item.slug ? "default" : "outline"}
                    size="sm"
                    className="h-auto min-h-8 max-w-full whitespace-normal py-1.5 text-left leading-5 shadow-none [overflow-wrap:anywhere]"
                    asChild
                  >
                    <Link
                      to="/algorithms/$category"
                      params={{ category: item.slug }}
                      search={{}}
                      resetScroll={false}
                      aria-current={category === item.slug ? "true" : undefined}
                      onClick={clearQueries}
                    >
                      {item.title}
                    </Link>
                  </Button>
                ))}
              </div>
              {currentCategory && (
                <div className="min-w-0 space-y-3 border-t pt-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="text-xs font-medium" id="topic-tags-label">
                      专题标签
                    </span>
                    <Button
                      variant={!currentTopic ? "secondary" : "ghost"}
                      size="xs"
                      asChild
                    >
                      <Link
                        activeOptions={{ exact: true }}
                        to="/algorithms/$category"
                        params={{ category: currentCategory.slug }}
                        search={{}}
                        resetScroll={false}
                        aria-current={!currentTopic ? "true" : undefined}
                        onClick={() => setTopicQuery("")}
                      >
                        全部专题
                      </Link>
                    </Button>
                    {topicChoices.length > 20 && (
                      <div className="flex w-full min-w-0 items-center gap-2 sm:ml-auto sm:w-auto">
                        <label
                          htmlFor="topic-tag-filter"
                          className="shrink-0 text-xs text-muted-foreground"
                        >
                          筛选标签
                        </label>
                        <Input
                          id="topic-tag-filter"
                          value={topicQuery}
                          onChange={(event) =>
                            setTopicQuery(event.target.value)
                          }
                          placeholder="标签关键词"
                          className="h-8 min-w-0 flex-1 shadow-none sm:w-44"
                        />
                      </div>
                    )}
                  </div>
                  <div
                    role="group"
                    aria-labelledby="topic-tags-label"
                    className="flex max-h-64 min-w-0 flex-wrap content-start gap-1.5 overflow-y-auto overscroll-contain p-1"
                  >
                    {visibleTopics.map((item) => (
                      <Button
                        key={item.id}
                        variant={
                          currentTopic?.id === item.id ? "default" : "secondary"
                        }
                        size="sm"
                        className="h-auto min-h-8 max-w-full whitespace-normal py-1.5 text-left text-xs leading-5 shadow-none [overflow-wrap:anywhere]"
                        asChild
                      >
                        <Link
                          to="/algorithms/$category"
                          params={{ category: currentCategory.slug }}
                          search={{ topic: item.id }}
                          resetScroll={false}
                          aria-current={
                            currentTopic?.id === item.id ? "true" : undefined
                          }
                          aria-label={item.context}
                          title={item.context}
                        >
                          {item.title}
                        </Link>
                      </Button>
                    ))}
                    {visibleTopics.length === 0 && (
                      <p
                        className="py-2 text-xs text-muted-foreground"
                        role="status"
                      >
                        没有匹配的标签，请换个关键词。
                      </p>
                    )}
                  </div>
                  <SourceCredit source={currentCategory.source} />
                </div>
              )}
              {!currentCategory && (
                <p className="text-xs leading-6 text-muted-foreground">
                  专题标签整理自灵茶山艾府（0x3F）题单，选择分类标签可筛选全部专题。
                </p>
              )}
              {entries.length === 0 && (
                <div className="border-t py-6">
                  <h2 className="text-sm font-medium leading-6">
                    {currentCategory
                      ? "这些标签下暂无代码模板"
                      : "尚未收录代码模板"}
                  </h2>
                  <p className="mt-1 max-w-prose text-sm leading-7 text-muted-foreground">
                    {currentCategory
                      ? "标签用于筛选算法实现。可以更换或清除标签，也可以查看原始题单。"
                      : "目前提供专题标签与原始题单索引，算法实现尚未登记。"}
                  </p>
                </div>
              )}
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
                    <span className="hidden md:block">分类标签</span>
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
