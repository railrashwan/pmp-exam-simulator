"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useExamStore } from "@/store/examStore";
import { labels } from "@/lib/labels";
import { Calculator } from "./Calculator";
import { EndExamDialog } from "./EndExamDialog";

export function ExamNavigation() {
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
      {/* Main nav */}
      <div className="border-t border-gray-300 bg-gray-100 px-6 py-4 flex items-center justify-between shadow-[0_-2px_8px_rgba(0,0,0,0.07)]">
        <button
          onClick={prevQuestion}
          disabled={currentIndex === 0}
          className="px-8 py-3 text-2xl font-semibold bg-white text-gray-700 border-2 border-gray-400 rounded-lg shadow-md hover:bg-gray-50 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all"
        >
          {L.previous}
        </button>

        <button
          onClick={() => currentQuestion && toggleMarkForReview(currentQuestion.id)}
          className={`px-6 py-3 text-2xl font-semibold rounded-lg border-2 shadow-md flex items-center gap-2 transition-all hover:shadow-lg ${
            isMarked
              ? "bg-red-50 border-red-400 text-red-700 hover:bg-red-100"
              : "bg-white border-gray-400 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <span>🚩</span>
          {isMarked ? L.unmarkForReview : L.markForReview}
        </button>

        <button
          onClick={nextQuestion}
          disabled={currentIndex === questions.length - 1}
          className="px-10 py-3 text-2xl font-semibold bg-blue-600 text-white border-2 border-blue-700 rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all"
        >
          {L.next}
        </button>
      </div>

      {/* Tools row */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 flex items-center justify-end gap-4">
        <button
          onClick={() => setShowCalc(true)}
          className="px-6 py-2.5 text-2xl font-medium bg-white text-gray-700 border-2 border-gray-400 rounded-lg shadow-sm hover:bg-gray-50 hover:shadow-md transition-all"
        >
          {L.calculator}
        </button>
        <button
          onClick={() => setShowEndDialog(true)}
          className="px-6 py-2.5 text-2xl font-medium bg-gray-700 text-white border-2 border-gray-600 rounded-lg shadow-sm hover:bg-gray-800 hover:shadow-md transition-all"
        >
          {L.endExam}
        </button>
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
