"use client";

import { useEffect, useRef, useState } from "react";
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
  const { questions, isFinished, isPaused, resumeExam, endExam, language, nextQuestion, prevQuestion } = useExamStore();
  const { colorScheme } = usePreferencesStore();
  const router = useRouter();

  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [translationOpen, setTranslationOpen] = useState(false);
  const [highlightMode, setHighlightMode] = useState(false);
  const [strikethroughMode, setStrikethroughMode] = useState(false);

  // Swipe gesture: track touch start X to navigate prev/next on mobile
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (questions.length === 0) router.replace("/");
  }, [questions, router]);

  useEffect(() => {
    if (isFinished && questions.length > 0) router.push("/exam/results");
  }, [isFinished, questions, router]);

  if (questions.length === 0) return null;

  const isRtl = language === "ar";

  return (
    // safe-area-inset-top handles iPhone notch; bottom handled in ExamNavigation
    <div
      className="flex flex-col bg-canvas overflow-hidden"
      dir={language === "ar" ? "rtl" : "ltr"}
      style={{
        height: "100dvh",  // dynamic viewport height — accounts for mobile browser chrome
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      {/* Tier 1: Dark navy header — title + timer/counter + progress bar */}
      <ExamHeader />

      {/* Tier 2: Medium blue toolbar — icons on mobile, labeled on desktop */}
      <ExamToolbar
        onOpenComment={() => setCommentOpen(true)}
        highlightMode={highlightMode}
        onToggleHighlight={() => setHighlightMode((m) => !m)}
        strikethroughMode={strikethroughMode}
        onToggleStrikethrough={() => setStrikethroughMode((m) => !m)}
      />

      {/* Content area — swipe left/right to navigate questions on mobile */}
      <div className="relative flex flex-1 overflow-hidden">
        <div
          id="question-area"
          className="flex-1 overflow-y-auto"
          data-scheme={colorScheme}
          onTouchStart={(e) => {
            // Only register if touch starts near the top (not from scrolling deep)
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            touchStartX.current = null;
            // Require a meaningful horizontal swipe (>60px) and block if modals are open
            if (Math.abs(dx) < 60 || navigatorOpen || commentOpen) return;
            const isRtl = language === "ar";
            if (dx < 0) {
              // Swipe left → next (LTR) or prev (RTL)
              isRtl ? prevQuestion() : nextQuestion();
            } else {
              // Swipe right → prev (LTR) or next (RTL)
              isRtl ? nextQuestion() : prevQuestion();
            }
          }}
        >
          <QuestionDisplay
            strikethroughMode={strikethroughMode}
            highlightMode={highlightMode}
            onShowTranslation={() => setTranslationOpen(true)}
          />
        </div>

        {/* Pause overlay */}
        {isPaused && (
          <div
            className="absolute inset-0 bg-gray-900/85 flex flex-col items-center justify-center gap-4 z-10 px-6"
            dir={isRtl ? "rtl" : "ltr"}
          >
            <div className="text-white text-2xl sm:text-3xl font-bold text-center">
              {isRtl ? "الاختبار متوقف" : "Exam Paused"}
            </div>
            <div className="text-gray-300 text-base sm:text-xl text-center">
              {isRtl ? "اختبارك متوقف. الوقت مجمّد." : "Your exam is paused. Your timer is frozen."}
            </div>
            <button
              onClick={resumeExam}
              className="mt-2 w-full max-w-xs py-4 bg-green-500 text-white text-lg font-bold rounded-xl hover:bg-green-600 active:bg-green-700 transition-colors shadow-lg"
            >
              {isRtl ? "استئناف" : "Resume Exam"}
            </button>
            <button
              onClick={() => router.push("/")}
              className="text-gray-300 hover:text-white text-sm underline transition-colors py-2"
            >
              {isRtl ? "حفظ والخروج إلى لوحة التحكم" : "Save & Exit to Dashboard"}
            </button>
            <button
              onClick={() => { endExam(); router.push("/exam/results"); }}
              className="text-gray-500 hover:text-gray-300 text-xs underline transition-colors py-2"
            >
              {isRtl ? "إنهاء الاختبار بشكل دائم" : "Permanently End & Submit"}
            </button>
          </div>
        )}

        {/* Floating / bottom-sheet translation window */}
        {translationOpen && (
          <TranslationWindow onClose={() => setTranslationOpen(false)} />
        )}
      </div>

      {/* Footer nav — safe area handled inside ExamNavigation */}
      <ExamNavigation onToggleNavigator={() => setNavigatorOpen(true)} />

      {/* Modals */}
      {navigatorOpen && <NavigatorModal onClose={() => setNavigatorOpen(false)} />}
      {commentOpen && <CommentModal onClose={() => setCommentOpen(false)} />}

      <FontPanel />
    </div>
  );
}
