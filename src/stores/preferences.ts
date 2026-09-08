import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";
export type CodePreferences = {
  language: string;
  wrap: boolean;
  lineNumbers: boolean;
};

type Preferences = {
  theme: Theme;
  favorites: string[];
  recentAlgorithms: string[];
  sidebarWidth: number;
  codePreferences: CodePreferences;
  setTheme: (theme: Theme) => void;
  toggleFavorite: (id: string) => void;
  visitAlgorithm: (id: string) => void;
  setSidebarWidth: (width: number) => void;
  setCodePreferences: (preferences: Partial<CodePreferences>) => void;
};

export const usePreferences = create<Preferences>()(
  persist(
    (set) => ({
      theme: "system",
      favorites: [],
      recentAlgorithms: [],
      sidebarWidth: 272,
      codePreferences: { language: "", wrap: false, lineNumbers: true },
      setTheme: (theme) => set({ theme }),
      toggleFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter((favorite) => favorite !== id)
            : [...state.favorites, id],
        })),
      visitAlgorithm: (id) =>
        set((state) => ({
          recentAlgorithms: [
            id,
            ...state.recentAlgorithms.filter((recent) => recent !== id),
          ].slice(0, 30),
        })),
      setSidebarWidth: (width) =>
        set({ sidebarWidth: Math.min(360, Math.max(240, width)) }),
      setCodePreferences: (preferences) =>
        set((state) => ({
          codePreferences: { ...state.codePreferences, ...preferences },
        })),
    }),
    {
      name: "algorithm-preferences",
      partialize: ({
        theme,
        favorites,
        recentAlgorithms,
        sidebarWidth,
        codePreferences,
      }) => ({
        theme,
        favorites,
        recentAlgorithms,
        sidebarWidth,
        codePreferences,
      }),
    },
  ),
);
