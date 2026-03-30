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

// Parses "A: reason. B: reason. C & D: reason." → { A: "reason", B: "reason", C: "reason", D: "reason" }
function parseWrongExplanations(text: string | null | undefined): Record<string, string> {
  if (!text) return {};
  const result: Record<string, string> = {};
  // Match keys like "A:", "C & D:", "A, B:" — then capture content until next key or end
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

  // Practice mode: reveal state — only active once user has selected an answer
  const isRevealed = practiceMode && !!selectedAnswer;
  const correctAnswer = question.correctAnswer;
  const explanation = language === "en" ? question.explanationEn : question.explanationAr;
  const wrongMap = parseWrongExplanations(
    language === "en" ? question.wrongExplanationEn : question.wrongExplanationAr
  );

  const questionStrikethroughs = strikethroughs[question.id] ?? [];

  // Handle text selection for highlight mode
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
    <div className="flex-1 px-6 py-5 flex flex-col gap-0" data-scheme={colorScheme}>
      {/* Question text */}
      <div dir={isRtl ? "rtl" : "ltr"} onMouseUp={handleMouseUp} className="mb-6">
        {/* Translate button — large, prominent, blue */}
        {isRtl && onShowTranslation && (
          <button
            onClick={onShowTranslation}
            className="mb-4 px-8 py-3 text-lg font-bold rounded"
            style={{ backgroundColor: "#4a72b0", color: "white", minWidth: "140px" }}
          >
            ترجمة
          </button>
        )}
        <p
          ref={questionRef}
          className={`cs-text ${isRtl ? "text-right" : ""}`}
          style={{
            fontSize: `${fontSize}rem`,
            lineHeight: isRtl ? "1.85" : "1.6",
            color: "var(--cs-text, var(--color-text-1))",
            fontWeight: "normal",
          }}
        >
          {qText}
        </p>
      </div>

      {/* Options — tabular layout matching Pearson VUE: ○  A.    text */}
      <div dir={isRtl ? "rtl" : "ltr"} className="flex flex-col">
        {OPTION_KEYS.map((key) => {
          const optionText = getOptionText(question, key, language);
          const isSelected = selectedAnswer === key;
          const label = isRtl ? ARABIC_LABELS[key] : key;
          const isStruck = questionStrikethroughs.includes(key);

          // Practice mode coloring
          const isCorrectOption = isRevealed && correctAnswer === key;
          const isWrongSelected = isRevealed && isSelected && correctAnswer !== key;

          function handleOptionClick() {
            if (strikethroughMode && !isRevealed) {
              toggleStrikethrough(question.id, key);
              return;
            }
            if (!isRevealed) selectAnswer(question.id, key);
          }

          // Row background — Pearson VUE: no border, subtle bg on selected only
          let rowBg = "";
          if (isCorrectOption) rowBg = "bg-green-50";
          else if (isWrongSelected) rowBg = "bg-red-50";
          else if (isSelected && !isRevealed) rowBg = "bg-blue-50";

          return (
            <div key={key} className="flex flex-col">
              <label
                className={`flex items-center py-3 px-2 rounded ${rowBg} ${
                  isRevealed ? "cursor-default" : strikethroughMode ? "cursor-crosshair" : "cursor-pointer"
                }`}
                onClick={strikethroughMode ? (e) => { e.preventDefault(); handleOptionClick(); } : undefined}
              >
                {/* Radio */}
                <span className="shrink-0 flex items-center" style={{ width: "1.5rem" }}>
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={key}
                    checked={isSelected}
                    onChange={() => {
                      if (!strikethroughMode && !isRevealed) selectAnswer(question.id, key);
                    }}
                    disabled={isRevealed}
                    className="w-3.5 h-3.5"
                    style={{ accentColor: "#364395" }}
                  />
                </span>
                {/* Letter label — fixed width column */}
                <span
                  className={`shrink-0 font-normal leading-none ${isCorrectOption ? "text-green-900" : isWrongSelected ? "text-red-900" : ""}`}
                  style={{
                    width: "2.5rem",
                    fontSize: `${fontSize}rem`,
                    lineHeight: isRtl ? "1.85" : "1.6",
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
                    fontSize: `${fontSize}rem`,
                    lineHeight: isRtl ? "1.85" : "1.6",
                    color: isCorrectOption || isWrongSelected ? undefined : "var(--cs-text, var(--color-text-1))",
                  }}
                >
                  {optionText}
                  {isCorrectOption && <span className="ml-2 text-green-700 font-bold">✓</span>}
                  {isWrongSelected && <span className="ml-2 text-red-700 font-bold">✗</span>}
                </span>
              </label>

              {/* Per-option explanation in practice mode — always shown for all 4 options */}
              {isRevealed && isCorrectOption && (
                <div className="mt-1 px-4 py-2 bg-green-50 border-l-4 border-green-400 text-green-800 rounded-r-lg text-sm">
                  <span className="font-semibold">{isRtl ? "لماذا صحيح: " : "Why correct: "}</span>
                  {wrongMap[key] || explanation || "—"}
                </div>
              )}
              {isRevealed && !isCorrectOption && (
                <div className={`mt-1 px-4 py-2 rounded-r-lg text-sm ${
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
          className={`mt-2 px-5 py-3 rounded-xl font-bold text-center ${
            selectedAnswer === correctAnswer
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
          }`}
          style={{ fontSize: `${fontSize}rem` }}
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
