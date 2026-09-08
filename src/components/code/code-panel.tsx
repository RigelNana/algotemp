import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ComponentProps, KeyboardEvent, Ref } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";
import {
  Check,
  Code2,
  Copy,
  Focus,
  Hash,
  Maximize2,
  Minimize2,
  RotateCcw,
  WrapText,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { AlgorithmImplementation } from "@/algorithms/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { copyText } from "@/lib/clipboard";
import { highlightCode, plainCode } from "@/lib/highlighter";
import type { HighlightedCode } from "@/lib/highlighter";
import { motionTimings } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/stores/preferences";
import type { CodePreferences } from "@/stores/preferences";
import "./code-panel.css";

type HighlightState = {
  code: string;
  language: string;
  dark: boolean;
} & (
  | { status: "ready"; result: HighlightedCode }
  | { status: "error"; message: string }
);

function useHighlight(
  code: string | undefined,
  language: string,
  dark: boolean,
) {
  const [state, setState] = useState<HighlightState>();
  useEffect(() => {
    if (code === undefined) return;
    let current = true;
    const request = { code, language, dark };
    highlightCode(code, language, dark).then(
      (result) => {
        if (current) setState({ ...request, status: "ready", result });
      },
      (error: unknown) => {
        if (current)
          setState({
            ...request,
            status: "error",
            message: error instanceof Error ? error.message : String(error),
          });
      },
    );
    return () => {
      current = false;
    };
  }, [code, language, dark]);
  return state &&
    state.code === code &&
    state.language === language &&
    state.dark === dark
    ? state
    : undefined;
}

type IconActionProps = ComponentProps<typeof Button> & { label: string };
function IconAction({ label, children, ...props }: IconActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

type LineSelection = {
  implementation: AlgorithmImplementation;
  anchor: number;
  end: number;
};
type CodeSurfaceProps = {
  implementations: AlgorithmImplementation[];
  active: AlgorithmImplementation;
  activeIndex: number;
  title: string;
  preferences: CodePreferences;
  onPreferences: (preferences: Partial<CodePreferences>) => void;
  highlight: HighlightState | undefined;
  selection: LineSelection | null;
  onSelectLine: (line: number, extend: boolean) => void;
  onClearSelection: () => void;
  emphasized: Set<number>;
  focus: boolean;
  onFocus: () => void;
  copied: boolean;
  onCopy: () => void;
  fullscreen?: boolean;
  onFullscreen: () => void;
  fullscreenRef?: Ref<HTMLButtonElement>;
};

function CodeSurface({
  implementations,
  active,
  activeIndex,
  title,
  preferences,
  onPreferences,
  highlight,
  selection,
  onSelectLine,
  onClearSelection,
  emphasized,
  focus,
  onFocus,
  copied,
  onCopy,
  fullscreen = false,
  onFullscreen,
  fullscreenRef,
}: CodeSurfaceProps) {
  const scopeId = useId();
  const helpId = `${scopeId}-line-help`;
  const reducedMotion = useReducedMotion();
  const [keyboardLine, setKeyboardLine] = useState(1);
  const fallback = useMemo(() => plainCode(active.code), [active.code]);
  const tokens =
    highlight?.status === "ready" ? highlight.result.tokens : fallback;
  const selectionStart = selection
    ? Math.min(selection.anchor, selection.end)
    : 0;
  const selectionEnd = selection
    ? Math.max(selection.anchor, selection.end)
    : 0;
  const selectedCount = selection ? selectionEnd - selectionStart + 1 : 0;
  const focusEnabled = focus && emphasized.size > 0;
  const tabValue = String(activeIndex);
  const compactLanguages = implementations.length > 4;

  function handleLineKey(
    event: KeyboardEvent<HTMLButtonElement>,
    line: number,
  ) {
    let next: number | undefined;
    if (event.key === "ArrowDown") next = Math.min(tokens.length, line + 1);
    if (event.key === "ArrowUp") next = Math.max(1, line - 1);
    if (event.key === "Home") next = 1;
    if (event.key === "End") next = tokens.length;
    if (next !== undefined) {
      event.preventDefault();
      setKeyboardLine(next);
      event.currentTarget
        .closest("[data-code-lines]")
        ?.querySelector<HTMLButtonElement>(`[data-line-select="${next}"]`)
        ?.focus();
      if (event.shiftKey) {
        if (!selection) onSelectLine(line, false);
        onSelectLine(next, true);
      }
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      onSelectLine(line, event.shiftKey);
    } else if (event.key === "Escape" && selection && !fullscreen) {
      event.preventDefault();
      event.stopPropagation();
      onClearSelection();
    }
  }

  return (
    <LayoutGroup id={scopeId}>
      <Tabs
        value={tabValue}
        onValueChange={(value) => {
          const next = implementations[Number(value)];
          if (next) onPreferences({ language: next.language });
          setKeyboardLine(1);
        }}
        className="code-workbench flex h-full min-h-0 min-w-0 gap-0 overflow-hidden bg-code-background"
      >
        <div className="flex min-h-11 shrink-0 items-center justify-between gap-2 border-b px-2">
          {compactLanguages ? (
            <Select
              value={tabValue}
              onValueChange={(value) => {
                const next = implementations[Number(value)];
                if (next) onPreferences({ language: next.language });
                setKeyboardLine(1);
              }}
            >
              <SelectTrigger
                size="sm"
                className="min-w-0 max-w-48 border-0 text-xs shadow-none"
                aria-label="代码语言"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {implementations.map((implementation, index) => (
                  <SelectItem
                    key={`${implementation.language}-${index}`}
                    value={String(index)}
                  >
                    {implementation.label ||
                      implementation.language ||
                      "纯文本"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <TabsList
              variant="line"
              aria-label="代码语言"
              className="min-w-0 justify-start overflow-x-auto p-0 group-data-[orientation=horizontal]/tabs:h-11"
            >
              {implementations.map((implementation, index) => (
                <TabsTrigger
                  key={`${implementation.language}-${index}`}
                  value={String(index)}
                  className="relative h-11 shrink-0 flex-none rounded-none px-3 text-xs after:hidden"
                >
                  {implementation.label || implementation.language || "纯文本"}
                  {index === activeIndex && (
                    <motion.span
                      layoutId="language-indicator"
                      className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary"
                      transition={
                        reducedMotion ? { duration: 0 } : motionTimings.layout
                      }
                    />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          )}
          <IconAction
            label={fullscreen ? "退出全屏" : "全屏查看代码"}
            onClick={onFullscreen}
            ref={fullscreenRef}
          >
            {fullscreen ? <Minimize2 /> : <Maximize2 />}
          </IconAction>
        </div>
        <div className="flex min-h-10 shrink-0 flex-wrap items-center justify-between gap-x-2 border-b bg-muted/20 px-2 py-1">
          <span
            className="flex min-w-0 flex-1 items-center gap-2 px-1 text-xs text-muted-foreground"
            title={active.filename || active.label || active.language}
          >
            <Code2 className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate font-mono">
              {active.filename || active.label || active.language || "纯文本"}
            </span>
          </span>
          <div className="flex shrink-0 items-center gap-0.5">
            <IconAction
              label={preferences.lineNumbers ? "隐藏行号" : "显示行号"}
              aria-pressed={preferences.lineNumbers}
              onClick={() =>
                onPreferences({ lineNumbers: !preferences.lineNumbers })
              }
            >
              <Hash />
            </IconAction>
            <IconAction
              label={preferences.wrap ? "关闭自动换行" : "开启自动换行"}
              aria-pressed={preferences.wrap}
              onClick={() => onPreferences({ wrap: !preferences.wrap })}
            >
              <WrapText />
            </IconAction>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="inline-flex"
                  tabIndex={emphasized.size ? undefined : 0}
                  aria-label={
                    emphasized.size ? undefined : "先选择代码行，再开启聚焦"
                  }
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={
                      focusEnabled ? "退出代码聚焦" : "聚焦选中与高亮行"
                    }
                    aria-pressed={focusEnabled}
                    disabled={!emphasized.size}
                    onClick={onFocus}
                  >
                    <Focus />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6}>
                {emphasized.size
                  ? focusEnabled
                    ? "退出代码聚焦"
                    : "聚焦选中与高亮行"
                  : "先选择代码行，再开启聚焦"}
              </TooltipContent>
            </Tooltip>
            <IconAction
              label={copied ? "已复制代码" : "复制代码"}
              onClick={onCopy}
            >
              <AnimatePresence initial={false} mode="wait">
                <motion.span
                  key={copied ? "copied" : "copy"}
                  className="inline-flex"
                  initial={{
                    opacity: 0,
                    scale: reducedMotion ? 1 : 0.8,
                    rotate: reducedMotion ? 0 : -12,
                  }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{
                    opacity: 0,
                    scale: reducedMotion ? 1 : 0.8,
                    rotate: reducedMotion ? 0 : 12,
                  }}
                  transition={motionTimings.fast}
                >
                  {copied ? (
                    <Check className="size-4 text-primary" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </motion.span>
              </AnimatePresence>
            </IconAction>
          </div>
        </div>
        {highlight?.status === "error" && (
          <div
            role="alert"
            className="flex shrink-0 items-start justify-between gap-3 border-b bg-destructive/5 px-3 py-2 text-xs"
          >
            <div className="min-w-0">
              <p className="text-destructive">
                语法高亮加载失败，已显示原始代码。
              </p>
              <details className="mt-1 text-muted-foreground">
                <summary className="cursor-pointer">错误详情</summary>
                <p className="mt-1 break-words">{highlight.message}</p>
              </details>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => window.location.reload()}
            >
              <RotateCcw />
              重新加载
            </Button>
          </div>
        )}
        <TabsContent
          value={tabValue}
          role={compactLanguages ? "region" : "tabpanel"}
          aria-labelledby={undefined}
          className="m-0 flex min-h-0 min-w-0 flex-1 flex-col"
          aria-label={`${title} · ${active.label || active.language}代码`}
        >
          {!highlight ? (
            <div
              role="status"
              aria-label="正在加载语法高亮"
              className="min-h-0 flex-1 space-y-3 overflow-hidden px-5 py-5"
            >
              <span className="sr-only">正在加载语法高亮</span>
              {[64, 82, 48, 73, 58, 88, 40].map((width, index) => (
                <Skeleton
                  key={index}
                  className="h-3 max-w-96"
                  style={{ width: `${width}%` }}
                />
              ))}
            </div>
          ) : (
            <ScrollArea
              className="code-scroll min-h-0 min-w-0 flex-1"
              data-wrap={preferences.wrap}
            >
              <motion.pre
                key={`${activeIndex}-${active.language}`}
                data-code-lines
                initial={{ opacity: 0, y: reducedMotion ? 0 : 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={motionTimings.normal}
                className="code-lines m-0 py-4 font-mono text-[13px] leading-6"
                aria-describedby={helpId}
              >
                <code>
                  {tokens.map((line, index) => {
                    const lineNumber = index + 1;
                    const selected =
                      lineNumber >= selectionStart &&
                      lineNumber <= selectionEnd;
                    const highlighted = emphasized.has(lineNumber);
                    return (
                      <span
                        key={index}
                        className={cn(
                          "code-line",
                          selected && "code-line-selected",
                          highlighted && !selected && "code-line-highlighted",
                          focusEnabled && !highlighted && "code-line-dimmed",
                        )}
                      >
                        <button
                          type="button"
                          data-line-select={lineNumber}
                          className={cn(
                            "code-line-number",
                            !preferences.lineNumbers &&
                              "code-line-number-hidden",
                          )}
                          aria-label={`第 ${lineNumber} 行${selected ? "，已选择" : ""}${highlighted && !selected ? "，重点行" : ""}`}
                          aria-pressed={selected}
                          tabIndex={
                            lineNumber === Math.min(keyboardLine, tokens.length)
                              ? 0
                              : -1
                          }
                          onFocus={() => setKeyboardLine(lineNumber)}
                          onClick={(event) =>
                            onSelectLine(lineNumber, event.shiftKey)
                          }
                          onKeyDown={(event) =>
                            handleLineKey(event, lineNumber)
                          }
                        >
                          {preferences.lineNumbers ? (
                            lineNumber
                          ) : (
                            <span aria-hidden="true">·</span>
                          )}
                        </button>
                        <span className="code-line-content">
                          {line.length
                            ? line.map((token, tokenIndex) => (
                                <span
                                  key={tokenIndex}
                                  style={{
                                    color: token.color,
                                    fontStyle:
                                      (token.fontStyle ?? 0) & 1
                                        ? "italic"
                                        : undefined,
                                    fontWeight:
                                      (token.fontStyle ?? 0) & 2
                                        ? 700
                                        : undefined,
                                    textDecoration:
                                      (token.fontStyle ?? 0) & 4
                                        ? "underline"
                                        : undefined,
                                  }}
                                >
                                  {token.content}
                                </span>
                              ))
                            : "\u200b"}
                        </span>
                      </span>
                    );
                  })}
                </code>
              </motion.pre>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </TabsContent>
        <div className="flex min-h-8 shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t px-3 py-1 text-[11px] text-muted-foreground">
          <span id={helpId}>
            点击行{preferences.lineNumbers ? "号" : "侧"}选择 · Shift 连选
          </span>
          <div className="flex items-center gap-2">
            <span role="status" aria-live="polite">
              {selectedCount
                ? `已选 ${selectedCount} 行`
                : `${tokens.length} 行`}
              {highlight?.status === "ready" && highlight.result.plainText
                ? " · 纯文本"
                : ""}
            </span>
            {selectedCount > 0 && (
              <IconAction
                label="清除行选择"
                size="icon-xs"
                onClick={onClearSelection}
              >
                <X />
              </IconAction>
            )}
          </div>
        </div>
      </Tabs>
    </LayoutGroup>
  );
}

export function CodePanel({
  implementations,
  title,
}: {
  implementations: AlgorithmImplementation[];
  title: string;
}) {
  const preferences = usePreferences((state) => state.codePreferences);
  const setPreferences = usePreferences((state) => state.setCodePreferences);
  const { resolvedTheme } = useTheme();
  const activeIndex = Math.max(
    0,
    implementations.findIndex(
      (implementation) => implementation.language === preferences.language,
    ),
  );
  const active = implementations[activeIndex];
  const highlight = useHighlight(
    active?.code,
    active?.language ?? "",
    resolvedTheme === "dark",
  );
  const [selection, setSelection] = useState<LineSelection | null>(null);
  const [focus, setFocus] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const fullscreenRef = useRef<HTMLButtonElement>(null);
  const currentSelection =
    selection?.implementation === active ? selection : null;
  const lineCount = useMemo(
    () => active?.code.split(/\r\n|\r|\n/).length ?? 0,
    [active?.code],
  );
  const emphasized = useMemo(() => {
    const lines = new Set(
      (active?.highlightedLines ?? []).filter(
        (line) => Number.isInteger(line) && line > 0 && line <= lineCount,
      ),
    );
    if (currentSelection) {
      for (
        let line = Math.min(currentSelection.anchor, currentSelection.end);
        line <= Math.max(currentSelection.anchor, currentSelection.end);
        line++
      )
        lines.add(line);
    }
    return lines;
  }, [active, currentSelection, lineCount]);

  useEffect(
    () => () => {
      clearTimeout(copyTimer.current);
    },
    [],
  );

  if (!active) {
    return (
      <section
        className="flex h-full min-h-0 min-w-0 flex-col bg-code-background"
        aria-label="代码实现"
      >
        <div className="flex h-11 shrink-0 items-center gap-2 border-b px-4 text-xs font-medium">
          <Code2 className="size-4 text-muted-foreground" />
          代码实现
        </div>
        <div className="flex flex-1 items-center justify-center p-8 text-center">
          <div>
            <p className="text-sm font-medium">暂无代码实现</p>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              此算法尚未添加代码。
            </p>
          </div>
        </div>
      </section>
    );
  }

  const surfaceProps: Omit<CodeSurfaceProps, "onFullscreen"> = {
    implementations,
    active,
    activeIndex,
    title,
    preferences,
    onPreferences: setPreferences,
    highlight,
    selection: currentSelection,
    emphasized,
    focus,
    onFocus: () => setFocus((value) => !value),
    onSelectLine: (line, extend) =>
      setSelection((previous) => ({
        implementation: active,
        anchor:
          extend && previous?.implementation === active
            ? previous.anchor
            : line,
        end: line,
      })),
    onClearSelection: () => setSelection(null),
    copied: copiedCode === active.code,
    onCopy: async () => {
      if (await copyText(active.code, "代码已复制")) {
        setCopiedCode(active.code);
        clearTimeout(copyTimer.current);
        copyTimer.current = setTimeout(() => setCopiedCode(null), 1500);
      }
    },
  };

  return (
    <Dialog open={fullscreen} onOpenChange={setFullscreen}>
      <section className="h-full min-h-0 min-w-0" aria-label="代码实现">
        <CodeSurface
          {...surfaceProps}
          onFullscreen={() => setFullscreen(true)}
          fullscreenRef={fullscreenRef}
        />
      </section>
      <DialogContent
        showCloseButton={false}
        className="flex h-[min(900px,calc(100dvh-2rem))] max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-none min-w-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-[1440px]"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          fullscreenRef.current?.focus();
        }}
      >
        <DialogTitle className="sr-only">{title} · 代码全屏查看</DialogTitle>
        <DialogDescription className="sr-only">
          只读代码查看器，可切换语言、选择行、调整换行或复制代码。按 Escape
          退出全屏。
        </DialogDescription>
        <CodeSurface
          {...surfaceProps}
          fullscreen
          onFullscreen={() => setFullscreen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
