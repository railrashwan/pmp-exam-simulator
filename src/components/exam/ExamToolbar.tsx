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

  // Keyboard shortcuts
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

  const toolbarBtnBase =
    "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-white/90 hover:bg-white/20 transition-colors border border-transparent";
  const toolbarBtnActive =
    "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-white/25 text-white border border-white/40 transition-colors";

  const schemeNames = L.colorSchemes as Record<string, string>;

  return (
    <div
      className="flex items-center gap-1 px-3 py-1.5 shrink-0 flex-wrap"
      style={{ backgroundColor: "#4a6fa5" }}
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {/* Comment */}
      <button onClick={onOpenComment} className={toolbarBtnBase}>
        <span>💬</span>
        <span>{L.comment}</span>
        {hasComment && (
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-300" title="Has comment" />
        )}
      </button>

      {/* Highlight (J) */}
      <button
        onClick={onToggleHighlight}
        className={highlightMode ? toolbarBtnActive : toolbarBtnBase}
        title={`${L.highlight} (J)`}
      >
        <span>🖊</span>
        <span>{L.highlight}</span>
        <span className="text-white/60 text-xs">(J)</span>
      </button>

      {/* Strikethrough (W) */}
      <button
        onClick={onToggleStrikethrough}
        className={strikethroughMode ? toolbarBtnActive : toolbarBtnBase}
        title={`${L.strikethrough} (W)`}
      >
        <span>S̶</span>
        <span>{L.strikethrough}</span>
        <span className="text-white/60 text-xs">(W)</span>
      </button>

      {/* Calculator */}
      <button onClick={() => setCalcOpen(true)} className={toolbarBtnBase}>
        <span>🖩</span>
        <span>{L.calculator}</span>
      </button>

      {/* Flag for Review */}
      <button
        onClick={() => question && toggleMarkForReview(question.id)}
        className={isFlagged ? toolbarBtnActive : toolbarBtnBase}
      >
        <span>{isFlagged ? "⚑" : "⚐"}</span>
        <span>{L.flagForReview}</span>
      </button>

      {/* Color Scheme */}
      <div className="relative">
        <button
          onClick={() => setSchemeOpen((o) => !o)}
          className={toolbarBtnBase}
        >
          <span>🎨</span>
          <span>{L.colorScheme}</span>
          <span className="text-white/60 text-xs">▼</span>
        </button>
        {schemeOpen && (
          <div
            className="absolute top-full mt-1 z-50 bg-white border border-gray-200 rounded shadow-lg py-1 min-w-[180px]"
            style={{ [language === "ar" ? "right" : "left"]: 0 }}
          >
            {COLOR_SCHEMES.map((scheme) => (
              <button
                key={scheme}
                onClick={() => {
                  setColorScheme(scheme as ColorScheme);
                  setSchemeOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                  colorScheme === scheme ? "font-semibold text-blue-700" : "text-gray-800"
                }`}
              >
                {schemeNames[scheme] ?? scheme}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Calculator modal */}
      {calcOpen && <Calculator onClose={() => setCalcOpen(false)} />}

      {/* Click-outside to close scheme dropdown */}
      {schemeOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setSchemeOpen(false)}
        />
      )}
    </div>
  );
}
