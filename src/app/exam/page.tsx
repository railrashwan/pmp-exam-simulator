"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useExamStore } from "@/store/examStore";
import { ExamHeader } from "@/components/exam/ExamHeader";
import { QuestionDisplay } from "@/components/exam/QuestionDisplay";
import { QuestionReviewGrid } from "@/components/exam/QuestionReviewGrid";
import { ExamNavigation } from "@/components/exam/ExamNavigation";
import { FontPanel } from "@/components/exam/FontPanel";

export default function ExamPage() {
  const { questions, isFinished, isPaused, resumeExam, language } = useExamStore();
  const router = useRouter();

  useEffect(() => {
    if (questions.length === 0) router.replace("/");
  }, [questions, router]);

  useEffect(() => {
    if (isFinished && questions.length > 0) router.push("/exam/results");
  }, [isFinished, questions, router]);

  if (questions.length === 0) return null;

  const pauseLabel = language === "ar" ? "الاختبار متوقف" : "Exam Paused";
  const pauseMsg   = language === "ar" ? "اختبارك متوقف. الوقت مجمّد." : "Your exam is paused. Your timer is frozen.";
  const resumeLabel = language === "ar" ? "استئناف" : "Resume Exam";

  return (
    <div className="h-screen flex flex-col bg-canvas overflow-hidden">
      <ExamHeader />

      <div className="relative flex flex-1 overflow-hidden">
        <div id="question-area" className="flex-1 overflow-y-auto bg-surface">
          <QuestionDisplay />
        </div>
        <QuestionReviewGrid />

        {/* Pause overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-5 z-10">
            <div className="text-inverse text-2xl font-bold">{pauseLabel}</div>
            <div className="text-inverse/70 text-[15px]">{pauseMsg}</div>
            <button
              onClick={resumeExam}
              className="mt-1 px-8 py-2.5 bg-interact text-inverse text-[15px] font-semibold rounded hover:bg-interact-h transition-colors"
            >
              {resumeLabel}
            </button>
          </div>
        )}
      </div>

      <ExamNavigation />
      <FontPanel />
    </div>
  );
}
