"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PreferencesState {
  questionFont: string;
  theme: "light" | "dark";
  setQuestionFont: (font: string) => void;
  toggleTheme: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      questionFont: "",
      theme: "light",
      setQuestionFont: (font) => set({ questionFont: font }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
    }),
    { name: "pmp-preferences" }
  )
);
