import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePreferences, type Theme } from "@/stores/preferences";
import { modifierKey } from "@/lib/keyboard";

const shortcuts = [
  ["搜索算法", "K"],
  ["快速打开", "P"],
  ["命令面板", "Shift P"],
  ["切换侧边栏", "B"],
] as const;

export function SettingsDialog({
  open,
  onOpenChange,
  section = "preferences",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section?: "preferences" | "shortcuts";
}) {
  const theme = usePreferences((state) => state.theme);
  const setTheme = usePreferences((state) => state.setTheme);
  const preferences = usePreferences((state) => state.codePreferences);
  const setCodePreferences = usePreferences(
    (state) => state.setCodePreferences,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>
            {section === "shortcuts" ? "键盘快捷键" : "设置"}
          </DialogTitle>
          <DialogDescription>
            {section === "shortcuts"
              ? "不离开键盘，快速浏览与切换。"
              : "偏好设置会保存在当前浏览器。"}
          </DialogDescription>
        </DialogHeader>
        {section === "preferences" && (
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between gap-4 py-4">
              <label htmlFor="settings-theme" className="text-sm font-medium">
                外观
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
            <label className="flex cursor-pointer items-center justify-between gap-4 py-4">
              <span>
                <span className="block text-sm font-medium">显示行号</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  在代码左侧显示行号
                </span>
              </span>
              <input
                type="checkbox"
                checked={preferences.lineNumbers}
                onChange={(event) =>
                  setCodePreferences({ lineNumbers: event.target.checked })
                }
                className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-4 py-4">
              <span>
                <span className="block text-sm font-medium">自动换行</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  长代码行根据面板宽度折行
                </span>
              </span>
              <input
                type="checkbox"
                checked={preferences.wrap}
                onChange={(event) =>
                  setCodePreferences({ wrap: event.target.checked })
                }
                className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              />
            </label>
          </div>
        )}
        <section
          aria-label="键盘快捷键"
          className={section === "preferences" ? "border-t pt-4" : ""}
        >
          {section === "preferences" && (
            <h3 className="mb-3 text-sm font-medium">键盘快捷键</h3>
          )}
          <dl className="space-y-3">
            {shortcuts.map(([label, key]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd>
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
                    {modifierKey} {key}
                  </kbd>
                </dd>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm">
              <dt className="text-muted-foreground">关闭对话框</dt>
              <dd>
                <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
                  Esc
                </kbd>
              </dd>
            </div>
          </dl>
        </section>
      </DialogContent>
    </Dialog>
  );
}
