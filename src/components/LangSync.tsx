"use client";

import { useEffect } from "react";
import { useExamStore } from "@/store/examStore";

/**
 * Syncs the language store to <html lang> and <html dir>.
 * Fixes WCAG 3.1.1 — screen readers need the correct lang to pronounce Arabic correctly.
 */
export function LangSync() {
  const language = useExamStore((s) => s.language);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = "ltr";
  }, [language]);

  return null;
}
