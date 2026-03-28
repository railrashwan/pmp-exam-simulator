"use client";

import { useExamStore } from "@/store/examStore";
import { LanguageToggle } from "./LanguageToggle";
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

export function QuestionDisplay() {
  const { questions, currentIndex, answers, language, selectAnswer } = useExamStore();
  const question = questions[currentIndex];

  if (!question) return null;

  const qText = language === "en" ? question.questionTextEn : question.questionTextAr;
  const selectedAnswer = answers[question.id];
  const isRtl = language === "ar";

  return (
    <div className="flex-1 p-5 flex flex-col gap-4">
      {/* Language toggle */}
      <div className="flex justify-center">
        <LanguageToggle />
      </div>

      {/* Question card */}
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className="border border-edge rounded-md p-4 bg-canvas"
      >
        <p
          className={`font-semibold text-content leading-relaxed ${isRtl ? "text-right" : ""}`}
          style={{ fontSize: "17px" }}
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
              className={`flex items-start gap-3 px-4 py-3 border rounded-md cursor-pointer transition-colors ${
                isSelected
                  ? "border-selected bg-selected"
                  : "border-edge bg-canvas hover:bg-surface hover:border-edge-2"
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={key}
                checked={isSelected}
                onChange={() => selectAnswer(question.id, key)}
                className="mt-0.5 shrink-0 w-4 h-4 accent-[var(--color-primary)]"
              />
              <span
                className={`text-content ${isRtl ? "text-right" : ""}`}
                style={{ fontSize: "15px", lineHeight: "1.5" }}
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
