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
  const { questions, currentIndex, language, markedForReview, toggleMarkForReview, comments } = useExamStore();
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

  const btnBase =
    "flex items-center gap-1.5 px-2.5 py-1 text-sm text-white/90 hover:bg-white/20 rounded transition-colors whitespace-nowrap";
  const btnActive =
    "flex items-center gap-1.5 px-2.5 py-1 text-sm text-white bg-white/25 rounded transition-colors whitespace-nowrap border border-white/40";

  const schemeNames = L.colorSchemes as Record<string, string>;
  const isRtl = language === "ar";

  return (
    <div
      className="flex items-center px-2 py-1 shrink-0 gap-0.5"
      style={{ backgroundColor: "#4a72b0" }}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* LEFT group: Comment, Highlight, Strikethrough, Calculator */}
      <div className="flex items-center gap-0.5">
        {/* Comment */}
        <button onClick={onOpenComment} className={btnBase}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 2h12v9H9l-3 3v-3H2V2z" fillOpacity="0.85" stroke="currentColor" strokeWidth="0.5" fill="none"/>
            <rect x="4" y="5" width="8" height="1.2" rx="0.6" fill="currentColor"/>
            <rect x="4" y="7.4" width="5" height="1.2" rx="0.6" fill="currentColor"/>
          </svg>
          <span>
            {L.comment}
            {hasComment && <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-300 ml-1 align-middle" />}
          </span>
        </button>

        {/* Highlight (J) */}
        <button onClick={onToggleHighlight} className={highlightMode ? btnActive : btnBase} title={`${L.highlight} (J)`}>
          {/* Yellow color swatch */}
          <span className="flex items-center gap-0.5">
            <span
              className="inline-block w-4 h-3 rounded-sm border border-white/40"
              style={{ backgroundColor: "#facc15" }}
            />
            <span className="text-white/70 text-[10px] leading-none">▼</span>
          </span>
          <span>{L.highlight} <span className="underline">({L.highlight === "Highlight" ? "J" : "J"})</span></span>
        </button>

        {/* Strikethrough (W) */}
        <button onClick={onToggleStrikethrough} className={strikethroughMode ? btnActive : btnBase} title={`${L.strikethrough} (W)`}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 8h10M5 5c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2M5 11c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          </svg>
          <span>{L.strikethrough} <span className="underline">({L.strikethrough === "Strikethrough" ? "W" : "W"})</span></span>
        </button>

        {/* Calculator */}
        <button onClick={() => setCalcOpen(true)} className={btnBase}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="2" y="1" width="12" height="14" rx="1.5"/>
            <rect x="4" y="3" width="8" height="2.5" rx="0.5" fill="currentColor" stroke="none"/>
            <circle cx="5" cy="8.5" r="0.8" fill="currentColor" stroke="none"/>
            <circle cx="8" cy="8.5" r="0.8" fill="currentColor" stroke="none"/>
            <circle cx="11" cy="8.5" r="0.8" fill="currentColor" stroke="none"/>
            <circle cx="5" cy="11.5" r="0.8" fill="currentColor" stroke="none"/>
            <circle cx="8" cy="11.5" r="0.8" fill="currentColor" stroke="none"/>
            <circle cx="11" cy="11.5" r="0.8" fill="currentColor" stroke="none"/>
          </svg>
          <span>{L.calculator}</span>
        </button>
      </div>

      {/* Spacer — pushes Flag & Color Scheme to far right */}
      <div className="flex-1" />

      {/* RIGHT group: Flag for Review, Color Scheme */}
      <div className="flex items-center gap-0.5">
        {/* Flag for Review */}
        <button
          onClick={() => question && toggleMarkForReview(question.id)}
          className={isFlagged ? btnActive : btnBase}
        >
          <svg width="13" height="14" viewBox="0 0 13 14" fill={isFlagged ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.3">
            <path d="M2 1v12M2 1h8l-2 4 2 4H2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{L.flagForReview}</span>
        </button>

        {/* Color Scheme */}
        <div className="relative">
          <button onClick={() => setSchemeOpen((o) => !o)} className={btnBase}>
            <span>{L.colorScheme}</span>
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
                  className={`w-full text-left px-4 py-1.5 text-sm hover:bg-blue-50 ${
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
