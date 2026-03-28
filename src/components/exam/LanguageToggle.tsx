"use client";

import { useExamStore } from "@/store/examStore";
import { labels } from "@/lib/labels";

export function LanguageToggle() {
  const { language, toggleLanguage } = useExamStore();
  const L = labels[language];

  return (
    <div className="inline-flex rounded border border-edge overflow-hidden">
      <button
        onClick={() => language === "ar" && toggleLanguage()}
        className={`px-4 py-1.5 text-xs-type font-medium transition-colors ${
          language === "en"
            ? "bg-primary text-inverse"
            : "bg-canvas text-muted hover:bg-surface"
        }`}
      >
        {L.english}
      </button>
      <button
        onClick={() => language === "en" && toggleLanguage()}
        className={`px-4 py-1.5 text-xs-type font-medium transition-colors border-l border-edge ${
          language === "ar"
            ? "bg-primary text-inverse"
            : "bg-canvas text-muted hover:bg-surface"
        }`}
      >
        {L.arabic}
      </button>
    </div>
  );
}
