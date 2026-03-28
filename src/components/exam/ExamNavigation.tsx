"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useExamStore } from "@/store/examStore";
import { labels } from "@/lib/labels";
import { Calculator } from "./Calculator";
import { EndExamDialog } from "./EndExamDialog";

interface Props {
  onToggleReview: () => void;
}

export function ExamNavigation({ onToggleReview }: Props) {
  const {
    questions, currentIndex, answers, markedForReview,
    language, prevQuestion, nextQuestion, toggleMarkForReview, endExam,
  } = useExamStore();
  const L = labels[language];
  const router = useRouter();

  const [showCalc, setShowCalc] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isMarked = currentQuestion ? markedForReview.includes(currentQuestion.id) : false;
  const unanswered = questions.filter((q) => answers[q.id] === undefined).length;

  function handleEndExam() {
    endExam();
    router.push("/exam/results");
  }

  return (
    <>
      {/* Main nav bar */}
      <div className="border-t border-edge bg-surface px-4 sm:px-6 py-4 flex items-center justify-between gap-3 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        <button
          onClick={prevQuestion}
          disabled={currentIndex === 0}
          className="px-6 sm:px-8 py-2.5 text-sm font-bold bg-canvas text-content border border-edge rounded-lg hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {L.previous}
        </button>

        <button
          onClick={() => currentQuestion && toggleMarkForReview(currentQuestion.id)}
          className={`px-4 sm:px-6 py-2.5 text-sm font-bold rounded-lg border flex items-center gap-2 transition-colors shadow-sm ${
            isMarked
              ? "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
              : "bg-surface border-edge text-content hover:bg-surface-2"
          }`}
        >
          <span>🚩</span>
          <span className="hidden sm:inline">{isMarked ? L.unmarkForReview : L.markForReview}</span>
        </button>

        <button
          onClick={nextQuestion}
          disabled={currentIndex === questions.length - 1}
          className="px-8 sm:px-10 py-2.5 text-sm font-bold bg-interact text-white rounded-lg hover:bg-interact-h disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {L.next}
        </button>
      </div>

      {/* Tools row — always LTR so Calculator/End Exam stay on the right */}
      <div dir="ltr" className="border-t border-edge bg-canvas px-4 sm:px-6 py-3 flex items-center gap-3">
        {/* Review toggle — only shown on mobile/tablet */}
        <button
          onClick={onToggleReview}
          className="lg:hidden px-4 py-2 text-sm font-semibold bg-surface text-content border border-edge rounded-lg hover:bg-surface-2 transition-colors shadow-sm"
          aria-label="Open question review panel"
        >
          {language === "ar" ? "المراجعة" : "Review"}
        </button>
        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={() => setShowCalc(true)}
            className="px-5 py-2 text-sm font-semibold bg-surface text-content border border-edge rounded-lg hover:bg-surface-2 transition-colors shadow-sm"
          >
            {L.calculator}
          </button>
          <button
            onClick={() => setShowEndDialog(true)}
            className="px-5 py-2 text-sm font-bold bg-err text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
          >
            {L.endExam}
          </button>
        </div>
      </div>

      {showCalc && <Calculator onClose={() => setShowCalc(false)} />}
      {showEndDialog && (
        <EndExamDialog
          unanswered={unanswered}
          onConfirm={handleEndExam}
          onCancel={() => setShowEndDialog(false)}
        />
      )}
    </>
  );
}
