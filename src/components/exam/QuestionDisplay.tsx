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

export function QuestionDisplay() {
  const { questions, currentIndex, answers, language, selectAnswer } = useExamStore();
  const question = questions[currentIndex];

  if (!question) return null;

  const qText = language === "en" ? question.questionTextEn : question.questionTextAr;
  const selectedAnswer = answers[question.id];
  const isRtl = language === "ar";

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
          return (
            <label
              key={key}
              className={`flex items-start gap-3 px-3 py-2.5 border rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400"
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={key}
                checked={isSelected}
                onChange={() => selectAnswer(question.id, key)}
                className="mt-0.5 accent-blue-600 shrink-0 w-4 h-4"
              />
              <span
                className={`text-gray-800 ${isRtl ? "text-right" : ""}`}
                style={{ fontSize: `${FONT_SIZE}px` }}
              >
                <span className="font-semibold">{label}. </span>
                {optionText}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
