import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePreferences } from "@/stores/preferences";

const themes = [
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "跟随系统", icon: Monitor },
] as const;

export function ThemeToggle({ compact = true }: { compact?: boolean }) {
  const theme = usePreferences((state) => state.theme);
  const setTheme = usePreferences((state) => state.setTheme);
  const index = themes.findIndex((option) => option.value === theme);
  const selected = themes[index] ?? themes[2];
  const next = themes[(index + 1) % themes.length];
  const Icon = selected.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? "icon" : "sm"}
          className={
            compact ? "size-8 text-muted-foreground" : "text-muted-foreground"
          }
          aria-label={`当前${selected.label}，切换为${next.label}`}
          onClick={() => setTheme(next.value)}
        >
          <Icon className="size-4" />
          {!compact && selected.label}
        </Button>
      </TooltipTrigger>
      <TooltipContent>切换为{next.label}</TooltipContent>
    </Tooltip>
  );
}
