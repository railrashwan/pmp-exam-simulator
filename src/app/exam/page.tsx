"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useExamStore } from "@/store/examStore";
import { usePreferencesStore } from "@/store/preferencesStore";
import { ExamHeader } from "@/components/exam/ExamHeader";
import { ExamToolbar } from "@/components/exam/ExamToolbar";
import { QuestionDisplay } from "@/components/exam/QuestionDisplay";
import { ExamNavigation } from "@/components/exam/ExamNavigation";
import { NavigatorModal } from "@/components/exam/NavigatorModal";
import { CommentModal } from "@/components/exam/CommentModal";
import { TranslationWindow } from "@/components/exam/TranslationWindow";
import { FontPanel } from "@/components/exam/FontPanel";

export default function ExamPage() {
  const { questions, isFinished, isPaused, resumeExam, endExam, language } = useExamStore();
  const { colorScheme } = usePreferencesStore();
  const router = useRouter();

  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [translationOpen, setTranslationOpen] = useState(false);
  const [highlightMode, setHighlightMode] = useState(false);
  const [strikethroughMode, setStrikethroughMode] = useState(false);

  useEffect(() => {
    if (questions.length === 0) router.replace("/");
  }, [questions, router]);

  useEffect(() => {
    if (isFinished && questions.length > 0) router.push("/exam/results");
  }, [isFinished, questions, router]);

  if (questions.length === 0) return null;

  const isRtl = language === "ar";

  return (
    <div className="h-screen flex flex-col bg-canvas overflow-hidden" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Tier 1: Dark navy header — title + timer/counter */}
      <ExamHeader />

      {/* Tier 2: Medium blue toolbar — Comment, Highlight, Strikethrough, Calculator, Flag, Color Scheme */}
      <ExamToolbar
        onOpenComment={() => setCommentOpen(true)}
        highlightMode={highlightMode}
        onToggleHighlight={() => setHighlightMode((m) => !m)}
        strikethroughMode={strikethroughMode}
        onToggleStrikethrough={() => setStrikethroughMode((m) => !m)}
      />

      {/* Content area */}
      <div className="relative flex flex-1 overflow-hidden">
        <div
          id="question-area"
          className="flex-1 overflow-y-auto"
          data-scheme={colorScheme}
        >
          <QuestionDisplay
            strikethroughMode={strikethroughMode}
            highlightMode={highlightMode}
            onShowTranslation={isRtl ? () => setTranslationOpen(true) : undefined}
          />
        </div>

        {/* Pause overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-gray-900/80 flex flex-col items-center justify-center gap-5 z-10" dir={isRtl ? "rtl" : "ltr"}>
            <div className="text-white text-3xl font-bold">
              {isRtl ? "الاختبار متوقف" : "Exam Paused"}
            </div>
            <div className="text-gray-300 text-xl">
              {isRtl ? "اختبارك متوقف. الوقت مجمّد." : "Your exam is paused. Your timer is frozen."}
            </div>
            <button
              onClick={resumeExam}
              className="mt-2 px-10 py-3 bg-green-500 text-white text-xl font-bold rounded-xl hover:bg-green-600 transition-colors shadow-lg"
            >
              {isRtl ? "استئناف" : "Resume Exam"}
            </button>
            <button
              onClick={() => router.push("/")}
              className="mt-3 text-gray-300 hover:text-white text-md underline transition-colors"
            >
              {isRtl ? "حفظ والخروج إلى لوحة التحكم" : "Save & Exit to Dashboard"}
            </button>
            <button
              onClick={() => { endExam(); router.push("/exam/results"); }}
              className="mt-6 text-gray-500 hover:text-gray-300 text-xs underline transition-colors"
            >
              {isRtl ? "إنهاء الاختبار بشكل دائم" : "Permanently End & Submit"}
            </button>
          </div>
        )}

        {/* Floating translation window */}
        {translationOpen && (
          <TranslationWindow onClose={() => setTranslationOpen(false)} />
        )}
      </div>

      {/* Footer nav: Help | ← Previous | ⚙ Navigator | Next → | End Exam */}
      <ExamNavigation onToggleNavigator={() => setNavigatorOpen(true)} />

      {/* Modals */}
      {navigatorOpen && <NavigatorModal onClose={() => setNavigatorOpen(false)} />}
      {commentOpen && <CommentModal onClose={() => setCommentOpen(false)} />}

      <FontPanel />
    </div>
  );
}
