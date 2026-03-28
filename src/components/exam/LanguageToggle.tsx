"use client";

import { useExamStore } from "@/store/examStore";
import { labels } from "@/lib/labels";

export function LanguageToggle() {
  const { language, toggleLanguage } = useExamStore();
  const L = labels[language];

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => language === "ar" && toggleLanguage()}
        className={`px-3 py-1.5 rounded-full text-xs-type font-bold transition-all border ${
          language === "en"
            ? "bg-interact text-white border-interact shadow-sm"
            : "bg-transparent text-muted border-edge hover:bg-surface-2 hover:text-content"
        }`}
      >
        {L.english}
      </button>
      <span className="text-muted text-sm select-none">⇌</span>
      <button
        onClick={() => language === "en" && toggleLanguage()}
        className={`px-3 py-1.5 rounded-full text-xs-type font-bold transition-all border ${
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
