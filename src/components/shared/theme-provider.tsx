import { useEffect, type ReactNode } from "react";
import { ThemeProvider as NextThemeProvider, useTheme } from "next-themes";
import { usePreferences } from "@/stores/preferences";

function ThemeSync() {
  const preference = usePreferences((state) => state.theme);
  const { setTheme, resolvedTheme } = useTheme();
  useEffect(() => {
    setTheme(preference);
  }, [preference, setTheme]);
  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        "content",
        resolvedTheme === "dark" ? "#17171a" : "#fafafa",
      );
  }, [resolvedTheme]);
  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="algorithm-theme"
      disableTransitionOnChange
    >
      <ThemeSync />
      {children}
    </NextThemeProvider>
  );
}
