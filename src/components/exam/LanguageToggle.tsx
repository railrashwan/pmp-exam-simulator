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
        className={`px-7 py-2 rounded-full text-2xl font-medium transition-all border-2 ${
          language === "en"
            ? "bg-sky-400 text-white border-sky-400 shadow-md"
            : "bg-transparent text-gray-500 border-gray-300 hover:border-gray-400"
        }`}
      >
        {L.english}
      </button>
      <span className="text-gray-400 text-2xl select-none">⇌</span>
      <button
        onClick={() => language === "en" && toggleLanguage()}
        className={`px-7 py-2 rounded-full text-2xl font-medium transition-all border-2 ${
          language === "ar"
            ? "bg-sky-400 text-white border-sky-400 shadow-md"
            : "bg-transparent text-gray-500 border-gray-300 hover:border-gray-400"
        }`}
      >
        {L.arabic}
      </button>
    </div>
  );
}
