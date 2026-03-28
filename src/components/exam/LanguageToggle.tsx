"use client";

import { useExamStore } from "@/store/examStore";
import { labels } from "@/lib/labels";

export function LanguageToggle() {
  const { language, toggleLanguage } = useExamStore();
  const L = labels[language];

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => language === "ar" && toggleLanguage()}
        className={`w-24 py-2 rounded-full text-sm-type font-bold transition-all border text-center ${
          language === "en"
            ? "bg-interact text-white border-interact shadow-sm"
            : "bg-transparent text-muted border-edge hover:bg-surface-2 hover:text-content"
        }`}
      >
        {L.english}
      </button>
      <span className="text-muted text-base select-none shrink-0">⇌</span>
      <button
        onClick={() => language === "en" && toggleLanguage()}
        className={`w-24 py-2 rounded-full text-sm-type font-bold transition-all border text-center ${
          language === "ar"
            ? "bg-interact text-white border-interact shadow-sm"
            : "bg-transparent text-muted border-edge hover:bg-surface-2 hover:text-content"
        }`}
      >
        {L.arabic}
      </button>
    </div>
  );
}
