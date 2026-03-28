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
      <div className="border-t border-edge bg-canvas px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
        <button
          onClick={prevQuestion}
          disabled={currentIndex === 0}
          className="px-4 sm:px-6 py-2 text-xs-type font-semibold bg-canvas text-content border border-edge rounded hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {L.previous}
        </button>

        <button
          onClick={() => currentQuestion && toggleMarkForReview(currentQuestion.id)}
          aria-label={isMarked ? L.unmarkForReview : L.markForReview}
          className={`px-3 sm:px-5 py-2 text-xs-type font-semibold rounded border flex items-center gap-2 transition-colors ${
            isMarked
              ? "bg-wrong-bg border-wrong text-wrong hover:opacity-90"
              : "bg-canvas border-edge text-muted hover:bg-surface"
          }`}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill={isMarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 2h10v10l-5-3-5 3V2z"/>
          </svg>
          <span className="hidden sm:inline">{isMarked ? L.unmarkForReview : L.markForReview}</span>
        </button>

        <button
          onClick={nextQuestion}
          disabled={currentIndex === questions.length - 1}
          className="px-4 sm:px-6 py-2 text-xs-type font-semibold bg-primary text-inverse border border-primary rounded hover:bg-primary-h disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {L.next}
        </button>
      </div>

      {/* Tools row */}
      <div className="border-t border-edge bg-surface px-6 py-2 flex items-center justify-between gap-3">
        {/* Review toggle — only shown on mobile/tablet; desktop has the permanent sidebar */}
        <button
          onClick={onToggleReview}
          className="lg:hidden px-4 py-1.5 text-xs-type font-medium bg-canvas text-content border border-edge rounded hover:bg-surface-2 transition-colors flex items-center gap-1.5"
          aria-label="Open question review panel"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/>
            <rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/>
          </svg>
          {language === "ar" ? "المراجعة" : "Review"}
        </button>
        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={() => setShowCalc(true)}
            className="px-4 py-1.5 text-xs-type font-medium bg-canvas text-content border border-edge rounded hover:bg-surface-2 transition-colors"
          >
            {L.calculator}
          </button>
          <button
            onClick={() => setShowEndDialog(true)}
            className="px-4 py-1.5 text-xs-type font-medium bg-canvas text-wrong border border-wrong rounded hover:bg-wrong-bg transition-colors"
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
