"use client";

import { useEffect, useRef } from "react";
import { useExamStore } from "@/store/examStore";
import { usePreferencesStore } from "@/store/preferencesStore";
import type { ExamQuestion } from "@/lib/types";

const OPTION_KEYS = ["A", "B", "C", "D"] as const;
const ARABIC_LABELS: Record<string, string> = { A: "أ", B: "ب", C: "ج", D: "د" };

function getOptionText(q: ExamQuestion, key: string, lang: "en" | "ar"): string {
  const map: Record<string, keyof ExamQuestion> = {
    A: lang === "en" ? "optionAEn" : "optionAAr",
    B: lang === "en" ? "optionBEn" : "optionBAr",
    C: lang === "en" ? "optionCEn" : "optionCAr",
    D: lang === "en" ? "optionDEn" : "optionDAr",
  };
  return q[map[key]] as string;
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

  const qText = language === "en" ? question.questionTextEn : question.questionTextAr;
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
    <div className="flex-1 p-5 flex flex-col gap-4" data-scheme={colorScheme}>
      {/* Question text */}
      <div dir={isRtl ? "rtl" : "ltr"} onMouseUp={handleMouseUp}>
        {/* Translate button for Arabic mode */}
        {isRtl && onShowTranslation && (
          <button
            onClick={onShowTranslation}
            className="mb-3 px-3 py-1 text-sm font-medium rounded border"
            style={{ backgroundColor: "#4a6fa5", color: "white", borderColor: "#3a5f95" }}
          >
            ترجمة
          </button>
        )}
        <p
          ref={questionRef}
          className={`cs-text font-medium ${isRtl ? "text-right" : ""}`}
          style={{
            fontSize: `${fontSize}rem`,
            lineHeight: isRtl ? "1.85" : "1.6",
            color: "var(--cs-text, var(--color-text-1))",
          }}
        >
          {qText}
        </p>
      </div>

      {/* Options */}
      <div dir={isRtl ? "rtl" : "ltr"} className="flex flex-col gap-1">
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

          // Row styling — Pearson VUE style: minimal, no box on normal state
          let rowStyle = "flex items-start gap-3 px-3 py-2 rounded";
          if (isCorrectOption) {
            rowStyle += " bg-green-50 border border-green-400";
          } else if (isWrongSelected) {
            rowStyle += " bg-red-50 border border-red-400";
          } else if (isSelected && !isRevealed) {
            rowStyle += " bg-blue-50 border border-blue-400";
          } else {
            rowStyle += " hover:bg-gray-50 border border-transparent";
          }

          return (
            <div key={key} className="flex flex-col">
              <label
                className={`${rowStyle} ${isRevealed ? "cursor-default" : strikethroughMode ? "cursor-crosshair" : "cursor-pointer"}`}
                onClick={strikethroughMode ? (e) => { e.preventDefault(); handleOptionClick(); } : undefined}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={key}
                  checked={isSelected}
                  onChange={() => {
                    if (!strikethroughMode && !isRevealed) selectAnswer(question.id, key);
                  }}
                  disabled={isRevealed}
                  className="shrink-0 mt-0.5 w-4 h-4 accent-blue-700"
                />
                <span
                  className={`cs-text ${isRtl ? "text-right" : ""} ${isStruck ? "line-through opacity-50" : ""} ${
                    isCorrectOption ? "text-green-900" : isWrongSelected ? "text-red-900" : ""
                  }`}
                  style={{
                    fontSize: `${fontSize}rem`,
                    lineHeight: isRtl ? "1.85" : "1.6",
                    color: isCorrectOption
                      ? undefined
                      : isWrongSelected
                      ? undefined
                      : "var(--cs-text, var(--color-text-1))",
                  }}
                >
                  <span className="font-semibold">{label}. </span>
                  {optionText}
                  {isCorrectOption && <span className="ml-2 font-bold text-green-700">✓</span>}
                  {isWrongSelected && <span className="ml-2 font-bold text-red-700">✗</span>}
                </span>
              </label>

              {/* Per-option explanation in practice mode */}
              {isRevealed && isCorrectOption && (explanation || wrongMap[key]) && (
                <div className="mt-1 px-4 py-2 bg-green-50 border-l-4 border-green-400 text-green-800 rounded-r-lg text-sm">
                  <span className="font-semibold">{isRtl ? "لماذا صحيح: " : "Why correct: "}</span>
                  {explanation || wrongMap[key]}
                </div>
              )}
              {isRevealed && !isCorrectOption && wrongMap[key] && (
                <div className={`mt-1 px-4 py-2 rounded-r-lg text-sm ${
                  isWrongSelected
                    ? "bg-red-50 border-l-4 border-red-400 text-red-800"
                    : "bg-gray-50 border-l-4 border-gray-300 text-gray-600"
                }`}>
                  <span className="font-semibold">{isRtl ? "لماذا خطأ: " : "Why wrong: "}</span>
                  {wrongMap[key]}
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
