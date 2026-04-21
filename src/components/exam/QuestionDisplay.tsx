"use client";

import { useEffect, useRef } from "react";
import { useExamStore } from "@/store/examStore";
import { usePreferencesStore } from "@/store/preferencesStore";
import type { ExamQuestion } from "@/lib/types";

const OPTION_KEYS = ["A", "B", "C", "D"] as const;
const ARABIC_LABELS: Record<string, string> = { A: "أ", B: "ب", C: "ج", D: "د" };

function getOptionText(q: ExamQuestion, key: string, lang: "en" | "ar"): string {
  const arMap: Record<string, keyof ExamQuestion> = { A: "optionAAr", B: "optionBAr", C: "optionCAr", D: "optionDAr" };
  const enMap: Record<string, keyof ExamQuestion> = { A: "optionAEn", B: "optionBEn", C: "optionCEn", D: "optionDEn" };
  const val = lang === "en" ? q[enMap[key]] : (q[arMap[key]] || q[enMap[key]]);
  return val as string;
}

function parseWrongExplanations(text: string | null | undefined): Record<string, string> {
  if (!text) return {};
  const result: Record<string, string> = {};
  const matches = text.matchAll(/\b([A-D](?:\s*[&,]\s*[A-D])*)\s*:\s*(.*?)(?=\s+[A-D](?:\s*[&,]\s*[A-D])*\s*:|$)/g);
  for (const m of matches) {
    const explanation = m[2].trim().replace(/\.$/, "");
    const letters = m[1].match(/[A-D]/g) ?? [];
    for (const letter of letters) {
      result[letter] = explanation;
    }
  }
  return result;
}

interface QuestionDisplayProps {
  strikethroughMode: boolean;
  highlightMode: boolean;
  onShowTranslation?: () => void;
}

export function QuestionDisplay({ strikethroughMode, highlightMode, onShowTranslation }: QuestionDisplayProps) {
  const {
    questions, currentIndex, answers, language, selectAnswer, practiceMode,
    strikethroughs, toggleStrikethrough, markVisited,
  } = useExamStore();
  const { fontSize, colorScheme } = usePreferencesStore();
  const questionRef = useRef<HTMLParagraphElement>(null);

  // Scroll back to top on every question change
  useEffect(() => {
    document.getElementById("question-area")?.scrollTo(0, 0);
  }, [currentIndex]);

  // Mark question visited when displayed
  useEffect(() => {
    const question = questions[currentIndex];
    if (question) markVisited(question.id);
  }, [currentIndex, questions, markVisited]);

  const question = questions[currentIndex];
  if (!question) return null;

  const qText = (language === "en" ? question.questionTextEn : question.questionTextAr) || question.questionTextEn;
  const selectedAnswer = answers[question.id];
  const isRtl = language === "ar";

  const isRevealed = practiceMode && !!selectedAnswer;
  const correctAnswer = question.correctAnswer;
  const explanation = language === "en" ? question.explanationEn : question.explanationAr;
  const wrongMap = parseWrongExplanations(
    language === "en" ? question.wrongExplanationEn : question.wrongExplanationAr
  );

  const questionStrikethroughs = strikethroughs[question.id] ?? [];

  // Options font is slightly smaller than question for visual hierarchy
  const optionFontSize = Math.max(fontSize * 0.94, 0.875);

  function handleMouseUp() {
    if (!highlightMode) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const mark = document.createElement("mark");
    mark.style.backgroundColor = "#facc15";
    mark.style.color = "inherit";
    try {
      range.surroundContents(mark);
    } catch {
      // Selection spans multiple elements — skip
    }
    sel.removeAllRanges();
  }

  return (
    <div className="flex-1 px-4 sm:px-6 py-2 sm:py-5 flex flex-col gap-0" data-scheme={colorScheme}>
      {/* Question text */}
      <div dir={isRtl ? "rtl" : "ltr"} onMouseUp={handleMouseUp} className="mb-2 sm:mb-5">
        {/* Translate button — compact inline, not full-width */}
        {onShowTranslation && (
          <button
            onClick={onShowTranslation}
            className={`mb-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border transition-colors active:opacity-70 ${
              isRtl ? "float-left" : "float-right"
            }`}
            style={{ borderColor: "#4a72b0", color: "#4a72b0", clear: "both" }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6.5"/>
              <path d="M8 1.5C8 1.5 5.5 5 5.5 8s2.5 6.5 2.5 6.5M8 1.5C8 1.5 10.5 5 10.5 8s-2.5 6.5-2.5 6.5M1.5 8h13" strokeLinecap="round"/>
            </svg>
            {isRtl ? "ترجمة" : "Translate"}
          </button>
        )}
        <p
          ref={questionRef}
          className={`cs-text ${isRtl ? "text-right" : ""} ${onShowTranslation ? "clear-both" : ""}`}
          style={{
            fontSize: `${fontSize}rem`,
            lineHeight: isRtl ? "1.8" : "1.6",
            color: "var(--cs-text, var(--color-text-1))",
            fontWeight: "normal",
            textAlign: "justify",
          }}
        >
          {qText}
        </p>
      </div>

      {/* Options */}
      <div dir={isRtl ? "rtl" : "ltr"} className="flex flex-col">
        {OPTION_KEYS.map((key) => {
          const optionText = getOptionText(question, key, language);
          const isSelected = selectedAnswer === key;
          const label = isRtl ? ARABIC_LABELS[key] : key;
          const isStruck = questionStrikethroughs.includes(key);

          const isCorrectOption = isRevealed && correctAnswer === key;
          const isWrongSelected = isRevealed && isSelected && correctAnswer !== key;

          function handleOptionClick() {
            if (strikethroughMode && !isRevealed) {
              toggleStrikethrough(question.id, key);
              return;
            }
            if (!isRevealed) selectAnswer(question.id, key);
          }

          let rowBg = "";
          if (isCorrectOption) rowBg = "bg-green-50";
          else if (isWrongSelected) rowBg = "bg-red-50";
          else if (isSelected && !isRevealed) rowBg = "bg-blue-50";

          return (
            <div key={key} className="flex flex-col">
              <label
                className={`flex items-center py-3 sm:py-4 px-2 rounded transition-opacity ${rowBg} ${
                  isRevealed
                    ? "cursor-default"
                    : strikethroughMode
                    ? "cursor-crosshair active:opacity-70"
                    : "cursor-pointer active:opacity-80"
                }`}
                onClick={strikethroughMode ? (e) => { e.preventDefault(); handleOptionClick(); } : undefined}
              >
                {/* Radio */}
                <span className="shrink-0 flex items-center" style={{ width: "1.75rem" }}>
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={key}
                    checked={isSelected}
                    onChange={() => {
                      if (!strikethroughMode && !isRevealed) selectAnswer(question.id, key);
                    }}
                    disabled={isRevealed}
                    className="w-5 h-5"
                    style={{ accentColor: "#364395" }}
                  />
                </span>
                {/* Letter label */}
                <span
                  className={`shrink-0 font-normal ${isCorrectOption ? "text-green-900" : isWrongSelected ? "text-red-900" : ""}`}
                  style={{
                    width: "2.2rem",
                    fontSize: `${optionFontSize}rem`,
                    lineHeight: isRtl ? "1.8" : "1.55",
                    color: isCorrectOption || isWrongSelected ? undefined : "var(--cs-text, var(--color-text-1))",
                  }}
                >
                  {label}.
                </span>
                {/* Option text */}
                <span
                  className={`cs-text flex-1 ${isRtl ? "text-right" : ""} ${isStruck ? "line-through opacity-40" : ""} ${
                    isCorrectOption ? "text-green-900" : isWrongSelected ? "text-red-900" : ""
                  }`}
                  style={{
                    fontSize: `${optionFontSize}rem`,
                    lineHeight: isRtl ? "1.8" : "1.55",
                    color: isCorrectOption || isWrongSelected ? undefined : "var(--cs-text, var(--color-text-1))",
                  }}
                >
                  {optionText}
                  {isCorrectOption && <span className="ml-2 text-green-700 font-bold text-sm">✓</span>}
                  {isWrongSelected && <span className="ml-2 text-red-700 font-bold text-sm">✗</span>}
                </span>
              </label>

              {/* Per-option explanation in practice mode */}
              {isRevealed && isCorrectOption && (
                <div className="mt-0.5 px-3 sm:px-4 py-2 bg-green-50 border-l-4 border-green-400 text-green-800 rounded-r-lg text-sm leading-snug">
                  <span className="font-semibold">{isRtl ? "لماذا صحيح: " : "Why correct: "}</span>
                  {wrongMap[key] || explanation || "—"}
                </div>
              )}
              {isRevealed && !isCorrectOption && (
                <div className={`mt-0.5 px-3 sm:px-4 py-2 rounded-r-lg text-sm leading-snug ${
                  isWrongSelected
                    ? "bg-red-50 border-l-4 border-red-400 text-red-800"
                    : "bg-gray-50 border-l-4 border-gray-300 text-gray-600"
                }`}>
                  <span className="font-semibold">{isRtl ? "لماذا خطأ: " : "Why wrong: "}</span>
                  {wrongMap[key] || (isRtl ? "راجع شرح الإجابة الصحيحة أعلاه." : "See the correct answer explanation above.")}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Result banner in practice mode */}
      {isRevealed && (
        <div
          className={`mt-2 px-4 py-2.5 rounded-xl font-bold text-center text-sm sm:text-base ${
            selectedAnswer === correctAnswer
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
          }`}
        >
          {selectedAnswer === correctAnswer
            ? isRtl ? "إجابة صحيحة! 🎉" : "Correct! 🎉"
            : isRtl
              ? `إجابة خاطئة — الإجابة الصحيحة: ${language === "ar" ? { A: "أ", B: "ب", C: "ج", D: "د" }[correctAnswer!] : correctAnswer}`
              : `Incorrect — correct answer: ${correctAnswer}`}
        </div>
      )}
    </div>
  );
}
