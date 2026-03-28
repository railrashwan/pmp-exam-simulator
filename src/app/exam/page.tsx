"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useExamStore } from "@/store/examStore";
import { ExamHeader } from "@/components/exam/ExamHeader";
import { QuestionDisplay } from "@/components/exam/QuestionDisplay";
import { QuestionReviewGrid } from "@/components/exam/QuestionReviewGrid";
import { ExamNavigation } from "@/components/exam/ExamNavigation";
import { FontPanel } from "@/components/exam/FontPanel";

export default function ExamPage() {
  const { questions, isFinished, isPaused, resumeExam, endExam, language } = useExamStore();
  const router = useRouter();
  const [isReviewOpen, setIsReviewOpen] = useState(false);

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
    <div className="h-screen flex flex-col bg-canvas overflow-hidden" dir="ltr">
      <ExamHeader />

      <div className="relative flex flex-1 overflow-hidden">
        <div id="question-area" className="flex-1 overflow-y-auto bg-surface">
          <QuestionDisplay />
        </div>
        <QuestionReviewGrid isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} />

        {/* Pause overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-gray-900/80 flex flex-col items-center justify-center gap-5 z-10">
            <div className="text-white text-3xl font-bold">{pauseLabel}</div>
            <div className="text-gray-300 text-xl">{pauseMsg}</div>
            <button
              onClick={resumeExam}
              className="mt-2 px-10 py-3 bg-green-500 text-white text-xl font-bold rounded-xl hover:bg-green-600 transition-colors shadow-lg"
            >
              {resumeLabel}
            </button>
            <button
              onClick={() => { router.push("/"); }}
              className="mt-3 text-gray-300 hover:text-white text-md underline transition-colors"
            >
              {language === "ar" ? "حفظ والخروج إلى لوحة التحكم" : "Save & Exit to Dashboard"}
            </button>
            <button
              onClick={() => { endExam(); router.push("/exam/results"); }}
              className="mt-6 text-gray-500 hover:text-gray-300 text-xs underline transition-colors"
            >
              {language === "ar" ? "إنهاء الاختبار بشكل دائم" : "Permanently End & Submit"}
            </button>
          </div>
        )}
      </div>

      <ExamNavigation onToggleReview={() => setIsReviewOpen((o) => !o)} />
      <FontPanel />
    </div>
  );
}
