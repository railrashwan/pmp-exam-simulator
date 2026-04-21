"use client";

import { useState, useEffect, useCallback } from "react";
import { useExamStore } from "@/store/examStore";
import { usePreferencesStore, COLOR_SCHEMES, type ColorScheme } from "@/store/preferencesStore";
import { labels } from "@/lib/labels";
import { Calculator } from "./Calculator";

interface ExamToolbarProps {
  onOpenComment: () => void;
  highlightMode: boolean;
  onToggleHighlight: () => void;
  strikethroughMode: boolean;
  onToggleStrikethrough: () => void;
}

export function ExamToolbar({
  onOpenComment,
  highlightMode,
  onToggleHighlight,
  strikethroughMode,
  onToggleStrikethrough,
}: ExamToolbarProps) {
  const { questions, currentIndex, language, toggleLanguage, markedForReview, toggleMarkForReview, comments } = useExamStore();
  const { colorScheme, setColorScheme } = usePreferencesStore();
  const L = labels[language];

  const [calcOpen, setCalcOpen] = useState(false);
  const [schemeOpen, setSchemeOpen] = useState(false);

  const question = questions[currentIndex];
  const isFlagged = question ? markedForReview.includes(question.id) : false;
  const hasComment = question ? !!comments[question.id] : false;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "j" || e.key === "J") onToggleHighlight();
      if (e.key === "w" || e.key === "W") onToggleStrikethrough();
    },
    [onToggleHighlight, onToggleStrikethrough]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Base styles — py-2 gives ~32px height; on mobile with icon-only this is acceptable;
  // the label row touch target is primarily the option rows in QuestionDisplay
  const btnBase =
    "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-2 text-sm text-white/90 hover:bg-white/20 active:bg-white/30 rounded transition-colors whitespace-nowrap";
  const btnActive =
    "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-2 text-sm text-white bg-white/25 rounded transition-colors whitespace-nowrap border border-white/40";

  const schemeNames = L.colorSchemes as Record<string, string>;
  const isRtl = language === "ar";

  return (
    <div
      className="flex items-center px-1 sm:px-2 py-0.5 shrink-0 gap-0.5 overflow-x-auto"
      style={{ backgroundColor: "#4a72b0" }}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* LEFT group: Comment, Highlight, Strikethrough, Calculator */}
      <div className="flex items-center gap-0.5 shrink-0">
        {/* Comment */}
        <button onClick={onOpenComment} className={btnBase} title={L.comment}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
            <path d="M2 2h12v9H9l-3 3v-3H2V2z" fillOpacity="0.85" stroke="currentColor" strokeWidth="0.5" fill="none"/>
            <rect x="4" y="5" width="8" height="1.2" rx="0.6" fill="currentColor"/>
            <rect x="4" y="7.4" width="5" height="1.2" rx="0.6" fill="currentColor"/>
          </svg>
          <span className="hidden sm:inline">{L.comment}</span>
          {/* Dot indicator always visible */}
          {hasComment && <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-300 shrink-0" />}
        </button>

        {/* Highlight (J) */}
        <button
          onClick={onToggleHighlight}
          className={highlightMode ? btnActive : btnBase}
          title={`${L.highlight} (J)`}
        >
          <span className="flex items-center gap-0.5 shrink-0">
            <span
              className="inline-block w-4 h-3 rounded-sm border border-white/40"
              style={{ backgroundColor: "#facc15" }}
            />
            <span className="text-white/70 text-[10px] leading-none">▼</span>
          </span>
          <span className="hidden sm:inline">{L.highlight}</span>
        </button>

        {/* Strikethrough (W) */}
        <button
          onClick={onToggleStrikethrough}
          className={strikethroughMode ? btnActive : btnBase}
          title={`${L.strikethrough} (W)`}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
            <path d="M3 8h10M5 5c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2M5 11c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          </svg>
          <span className="hidden sm:inline">{L.strikethrough}</span>
        </button>

        {/* Calculator */}
        <button onClick={() => setCalcOpen(true)} className={btnBase} title={L.calculator}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" className="shrink-0">
            <rect x="2" y="1" width="12" height="14" rx="1.5"/>
            <rect x="4" y="3" width="8" height="2.5" rx="0.5" fill="currentColor" stroke="none"/>
            <circle cx="5" cy="8.5" r="0.8" fill="currentColor" stroke="none"/>
            <circle cx="8" cy="8.5" r="0.8" fill="currentColor" stroke="none"/>
            <circle cx="11" cy="8.5" r="0.8" fill="currentColor" stroke="none"/>
            <circle cx="5" cy="11.5" r="0.8" fill="currentColor" stroke="none"/>
            <circle cx="8" cy="11.5" r="0.8" fill="currentColor" stroke="none"/>
            <circle cx="11" cy="11.5" r="0.8" fill="currentColor" stroke="none"/>
          </svg>
          <span className="hidden sm:inline">{L.calculator}</span>
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* RIGHT group: Language Toggle, Flag, Color Scheme */}
      <div className="flex items-center gap-0.5 shrink-0">
        {/* Language Toggle */}
        <div className="flex items-center gap-0 mr-0.5 rounded overflow-hidden border border-white/30">
          <button
            onClick={() => language === "ar" && toggleLanguage()}
            className={`px-2 sm:px-2.5 py-2 text-sm transition-colors ${
              language === "en" ? "bg-white/30 text-white font-semibold" : "text-white/75 hover:bg-white/15"
            }`}
            title="English"
          >
            EN
          </button>
          <span className="text-white/30 text-xs select-none">|</span>
          <button
            onClick={() => language === "en" && toggleLanguage()}
            className={`px-2 sm:px-2.5 py-2 text-sm transition-colors ${
              language === "ar" ? "bg-white/30 text-white font-semibold" : "text-white/75 hover:bg-white/15"
            }`}
            title="العربية"
          >
            ع
          </button>
        </div>

        {/* Flag for Review */}
        <button
          onClick={() => question && toggleMarkForReview(question.id)}
          className={isFlagged ? btnActive : btnBase}
          title={isFlagged ? L.unmarkForReview : L.flagForReview}
        >
          <svg width="13" height="14" viewBox="0 0 13 14" fill={isFlagged ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.3" className="shrink-0">
            <path d="M2 1v12M2 1h8l-2 4 2 4H2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="hidden sm:inline">{L.flagForReview}</span>
        </button>

        {/* Color Scheme */}
        <div className="relative">
          <button onClick={() => setSchemeOpen((o) => !o)} className={btnBase} title={L.colorScheme}>
            {/* Small palette icon for mobile */}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="5.5" cy="6" r="1.5" fill="#facc15"/>
              <circle cx="10.5" cy="6" r="1.5" fill="#f87171"/>
              <circle cx="8" cy="10.5" r="1.5" fill="#60a5fa"/>
            </svg>
            <span className="hidden sm:inline">{L.colorScheme}</span>
            <span className="text-white/70 text-[10px]">▼</span>
          </button>
          {schemeOpen && (
            <div
              className="absolute top-full mt-0.5 z-50 bg-white border border-gray-200 shadow-lg py-1 min-w-[190px]"
              style={{ [isRtl ? "left" : "right"]: 0 }}
            >
              {COLOR_SCHEMES.map((scheme) => (
                <button
                  key={scheme}
                  onClick={() => { setColorScheme(scheme as ColorScheme); setSchemeOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 ${
                    colorScheme === scheme ? "font-semibold text-blue-700 bg-blue-50" : "text-gray-800"
                  }`}
                >
                  {schemeNames[scheme] ?? scheme}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {calcOpen && <Calculator onClose={() => setCalcOpen(false)} />}
      {schemeOpen && <div className="fixed inset-0 z-40" onClick={() => setSchemeOpen(false)} />}
    </div>
  );
}
