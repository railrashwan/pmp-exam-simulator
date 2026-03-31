"use client";

import { useExamStore } from "@/store/examStore";
import { LanguageToggle } from "./LanguageToggle";
import type { ExamQuestion } from "@/lib/types";

const OPTION_KEYS = ["A", "B", "C", "D"] as const;
const ARABIC_LABELS: Record<string, string> = { A: "أ", B: "ب", C: "ج", D: "د" };
const FONT_SIZE = 24;

function getOptionText(q: ExamQuestion, key: string, lang: "en" | "ar"): string {
  const map: Record<string, keyof ExamQuestion> = {
    A: lang === "en" ? "optionAEn" : "optionAAr",
    B: lang === "en" ? "optionBEn" : "optionBAr",
    C: lang === "en" ? "optionCEn" : "optionCAr",
    D: lang === "en" ? "optionDEn" : "optionDAr",
  };
  return q[map[key]] as string;
}

// Parses "A: Wrong; reason. B: Wrong; reason." → { A: "reason", B: "reason" }
function parseWrongExplanations(text: string | null | undefined): Record<string, string> {
  if (!text) return {};
  const result: Record<string, string> = {};
  const matches = text.matchAll(/\b([A-D]):\s*(.*?)(?=\s+[A-D]:|$)/g);
  for (const m of matches) {
    result[m[1]] = m[2].trim().replace(/\.$/, "");
  }
  return result;
}

export function QuestionDisplay() {
  const { questions, currentIndex, answers, language, selectAnswer, practiceMode } = useExamStore();
  const question = questions[currentIndex];

  if (!question) return null;

  const qText = language === "en" ? question.questionTextEn : question.questionTextAr;
  const selectedAnswer = answers[question.id];
  const isRtl = language === "ar";

  // Practice mode: reveal state — only active once user has selected an answer
  const isRevealed = practiceMode && !!selectedAnswer;
  const correctAnswer = question.correctAnswer;
  const explanation =
    language === "en"
      ? question.explanationEn
      : (question.explanationAr || question.explanationEn);
  const wrongMap = parseWrongExplanations(
    language === "en"
      ? question.wrongExplanationEn
      : (question.wrongExplanationAr || question.wrongExplanationEn)
  );

  return (
    <div className="flex-1 p-4 flex flex-col gap-3">
      {/* Language toggle */}
      <div className="flex justify-center">
        <LanguageToggle />
      </div>

      {/* Question card */}
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm"
      >
        <p
          className={`font-bold text-gray-900 leading-relaxed ${isRtl ? "text-right" : ""}`}
          style={{ fontSize: `${FONT_SIZE}px` }}
        >
          {qText}
        </p>
      </div>

      {/* Options */}
      <div dir={isRtl ? "rtl" : "ltr"} className="flex flex-col gap-2">
        {OPTION_KEYS.map((key) => {
          const optionText = getOptionText(question, key, language);
          const isSelected = selectedAnswer === key;
          const label = isRtl ? ARABIC_LABELS[key] : key;

          // Coloring logic for practice mode after reveal
          const isCorrectOption = isRevealed && correctAnswer === key;
          const isWrongSelected = isRevealed && isSelected && correctAnswer !== key;

          let borderBg: string;
          if (isCorrectOption) {
            borderBg = "border-green-500 bg-green-50 shadow-sm";
          } else if (isWrongSelected) {
            borderBg = "border-red-500 bg-red-50 shadow-sm";
          } else if (!isRevealed && isSelected) {
            borderBg = "border-blue-500 bg-blue-50 shadow-sm";
          } else {
            borderBg = "border-gray-300 bg-white" + (isRevealed ? "" : " hover:bg-gray-50 hover:border-gray-400");
          }

          return (
            <div key={key} className="flex flex-col">
              <label
                className={`flex items-start gap-3 px-3 py-2.5 border rounded-lg transition-all ${borderBg} ${
                  isRevealed ? "cursor-default" : "cursor-pointer"
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={key}
                  checked={isSelected}
                  onChange={() => { if (!isRevealed) selectAnswer(question.id, key); }}
                  disabled={isRevealed}
                  className="mt-0.5 accent-blue-600 shrink-0 w-4 h-4"
                />
                <span
                  className={`flex-1 ${
                    isCorrectOption
                      ? "text-green-900"
                      : isWrongSelected
                      ? "text-red-900"
                      : "text-gray-800"
                  } ${isRtl ? "text-right" : ""}`}
                  style={{ fontSize: `${FONT_SIZE}px` }}
                >
                  <span className="font-semibold">{label}. </span>
                  {optionText}
                  {isCorrectOption && <span className="ml-2 font-bold text-green-700">✓</span>}
                  {isWrongSelected && <span className="ml-2 font-bold text-red-700">✗</span>}
                </span>
              </label>

              {/* Per-option explanation in practice mode */}
              {isRevealed && isCorrectOption && explanation && (
                <div className="mt-1 px-4 py-2 bg-green-50 border-l-4 border-green-400 text-green-800 rounded-r-lg" style={{ fontSize: `${FONT_SIZE - 4}px` }}>
                  <span className="font-semibold">{isRtl ? "لماذا صحيح: " : "Why correct: "}</span>
                  {explanation}
                </div>
              )}
              {isRevealed && !isCorrectOption && wrongMap[key] && (
                <div
                  className={`mt-1 px-4 py-2 rounded-r-lg ${
                    isWrongSelected
                      ? "bg-red-50 border-l-4 border-red-400 text-red-800"
                      : "bg-gray-50 border-l-4 border-gray-300 text-gray-600"
                  }`}
                  style={{ fontSize: `${FONT_SIZE - 4}px` }}
                >
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
          style={{ fontSize: `${FONT_SIZE}px` }}
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
