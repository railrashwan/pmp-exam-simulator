"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const COLOR_SCHEMES = [
  "black-on-white",
  "black-on-yellow",
  "black-on-lt-yellow",
  "black-on-salmon",
  "blue-on-white",
  "blue-on-yellow",
  "lt-yellow-on-black",
  "white-on-black",
  "white-on-blue",
] as const;

export type ColorScheme = typeof COLOR_SCHEMES[number];

interface PreferencesState {
  questionFont: string;
  fontSize: number;  // rem value — 1.5 = 24px (default)
  theme: "light" | "dark";
  colorScheme: ColorScheme;
  setQuestionFont: (font: string) => void;
  setFontSize: (size: number) => void;
  toggleTheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      questionFont: "",
      fontSize: 1.5,
      theme: "light",
      colorScheme: "black-on-white",
      setQuestionFont: (font) => set({ questionFont: font }),
      setFontSize: (size) => set({ fontSize: size }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
      setColorScheme: (scheme) => set({ colorScheme: scheme }),
    }),
    { name: "pmp-preferences" }
  )
);
