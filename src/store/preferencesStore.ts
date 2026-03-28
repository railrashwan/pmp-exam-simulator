"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PreferencesState {
  questionFont: string;
  fontSize: number;  // rem value — 1.5 = 24px (default)
  theme: "light" | "dark";
  setQuestionFont: (font: string) => void;
  setFontSize: (size: number) => void;
  toggleTheme: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      questionFont: "",
      fontSize: 1.5,
      theme: "light",
      setQuestionFont: (font) => set({ questionFont: font }),
      setFontSize: (size) => set({ fontSize: size }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
    }),
    { name: "pmp-preferences" }
  )
);
