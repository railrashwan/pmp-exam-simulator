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
    if (questions.length === 0) {
      router.replace("/");
    }
  }, [questions, router]);

  useEffect(() => {
    if (isFinished && questions.length > 0) {
      router.push("/exam/results");
    }
  }, [isFinished, questions, router]);

  if (questions.length === 0) return null;

  const pauseLabel = language === "ar" ? "الاختبار متوقف" : "Exam Paused";
  const pauseMsg = language === "ar" ? "اختبارك متوقف. الوقت مجمّد." : "Your exam is paused. Your timer is frozen.";
  const resumeLabel = language === "ar" ? "استئناف" : "Resume Exam";

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <ExamHeader />

      {/* Main content */}
      <div className="relative flex flex-1 overflow-hidden">
        <div id="question-area" className="flex-1 overflow-y-auto bg-gray-50">
          <QuestionDisplay />
        </div>
        <QuestionReviewGrid />

        {/* Pause overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-gray-900/80 flex flex-col items-center justify-center gap-6 z-10">
            <div className="text-white text-5xl font-bold">{pauseLabel}</div>
            <div className="text-gray-300 text-2xl">{pauseMsg}</div>
            <button
              onClick={resumeExam}
              className="mt-2 px-10 py-4 bg-green-500 text-white text-2xl font-bold rounded-xl hover:bg-green-600 transition-all shadow-lg"
            >
              {resumeLabel}
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ExamNavigation />

      <FontPanel />
    </div>
  );
}
