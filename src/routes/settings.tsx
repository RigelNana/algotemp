import { useEffect } from "react";
import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePreferences, type Theme } from "@/stores/preferences";
import { modifierKey } from "@/lib/keyboard";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

const shortcuts = [
  ["搜索算法", `${modifierKey} K`],
  ["快速打开", `${modifierKey} P`],
  ["命令面板", `${modifierKey} Shift P`],
  ["切换侧边栏", `${modifierKey} B`],
  ["关闭对话框", "Esc"],
];

function SettingsPage() {
  const hash = useRouterState({ select: (state) => state.location.hash });
  const theme = usePreferences((state) => state.theme);
  const setTheme = usePreferences((state) => state.setTheme);
  const preferences = usePreferences((state) => state.codePreferences);
  const setCodePreferences = usePreferences(
    (state) => state.setCodePreferences,
  );
  useEffect(() => {
    document.title = "设置 · Algorithm";
    if (hash === "shortcuts")
      document.getElementById("shortcuts")?.scrollIntoView();
  }, [hash]);
  return (
    <ScrollArea className="h-full min-h-0">
      <div className="mx-auto max-w-3xl px-6 py-8 sm:px-10">
        <h1 className="text-xl font-semibold">设置</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          偏好设置保存在当前浏览器。
        </p>
        <section aria-labelledby="appearance" className="mt-8">
          <h2 id="appearance" className="mb-2 text-sm font-medium">
            外观与代码
          </h2>
          <div className="divide-y border-y">
            <div className="flex items-center justify-between gap-4 py-5">
              <label htmlFor="settings-theme" className="text-sm">
                主题
              </label>
              <Select
                value={theme}
                onValueChange={(value) => setTheme(value as Theme)}
              >
                <SelectTrigger id="settings-theme" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">浅色</SelectItem>
                  <SelectItem value="dark">深色</SelectItem>
                  <SelectItem value="system">跟随系统</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center justify-between gap-4 py-5 text-sm">
              <span>显示行号</span>
              <input
                type="checkbox"
                checked={preferences.lineNumbers}
                onChange={(event) =>
                  setCodePreferences({ lineNumbers: event.target.checked })
                }
                className="size-4 accent-primary"
              />
            </label>
            <label className="flex items-center justify-between gap-4 py-5 text-sm">
              <span>代码自动换行</span>
              <input
                type="checkbox"
                checked={preferences.wrap}
                onChange={(event) =>
                  setCodePreferences({ wrap: event.target.checked })
                }
                className="size-4 accent-primary"
              />
            </label>
          </div>
        </section>
        <section
          id="shortcuts"
          aria-labelledby="shortcuts-title"
          className="mt-10 scroll-mt-8"
        >
          <h2 id="shortcuts-title" className="mb-5 text-sm font-medium">
            键盘快捷键
          </h2>
          <dl className="space-y-4">
            {shortcuts.map(([label, keys]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd>
                  <kbd className="shortcut-key">{keys}</kbd>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </ScrollArea>
  );
}
