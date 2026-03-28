"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PreferencesState {
  questionFont: string;
  setQuestionFont: (font: string) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      questionFont: "",
      setQuestionFont: (font) => set({ questionFont: font }),
    }),
    { name: "pmp-preferences" }
  )
);
