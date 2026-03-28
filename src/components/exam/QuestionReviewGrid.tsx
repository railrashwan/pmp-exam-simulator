"use client";

import { useExamStore } from "@/store/examStore";
import { labels } from "@/lib/labels";

export function QuestionReviewGrid() {
  const { questions, currentIndex, answers, markedForReview, language, goToQuestion } =
    useExamStore();
  const L = labels[language];

  return (
    <div className="w-80 border-l border-gray-300 bg-gray-50 flex flex-col shrink-0">
      {/* Header */}
      <div className="bg-gray-200 px-3 py-3 text-lg font-bold text-gray-700 text-center border-b border-gray-300 tracking-wide uppercase">
        {L.questionReviewList}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-5 gap-1.5">
          {questions.map((q, idx) => {
            const isAnswered = answers[q.id] !== undefined;
            const isCurrent = idx === currentIndex;
            const isMarked = markedForReview.includes(q.id);

            let cellCls = "bg-white border border-gray-400 text-gray-700";
            if (isCurrent) cellCls = "bg-teal-500 border-teal-600 text-white font-bold";
            else if (isAnswered) cellCls = "bg-green-100 border-green-500 text-green-700";

            return (
              <button
                key={q.id}
                onClick={() => goToQuestion(idx)}
                aria-label={`Question ${idx + 1}${isCurrent ? ", current" : isAnswered ? ", answered" : ""}${isMarked ? ", marked" : ""}`}
                aria-current={isCurrent ? "true" : undefined}
                className={`relative border rounded text-2xl font-medium h-14 flex items-center justify-center transition-all hover:opacity-80 ${cellCls}`}
              >
                {isAnswered && !isCurrent ? (
                  <span className="text-green-600 font-bold text-2xl" aria-hidden="true">✓</span>
                ) : (
                  <span aria-hidden="true">{idx + 1}</span>
                )}
                {isMarked && (
                  <span
                    className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-bl"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-gray-300 p-3 space-y-2 bg-white">
        <div className="flex items-center gap-2 text-xl text-gray-700">
          <span className="w-7 h-7 bg-green-100 border border-green-500 rounded flex items-center justify-center text-green-600 font-bold shrink-0 text-xl" aria-hidden="true">✓</span>
          {L.answered}
        </div>
        <div className="flex items-center gap-2 text-xl text-gray-700">
          <span className="w-7 h-7 bg-teal-500 border border-teal-600 rounded shrink-0" aria-hidden="true" />
          {L.current}
        </div>
        <div className="flex items-center gap-2 text-xl text-gray-700">
          <span className="w-7 h-7 relative bg-white border border-gray-400 rounded shrink-0" aria-hidden="true">
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-bl" />
          </span>
          {L.markedForReview}
        </div>
      </div>
    </div>
  );
}
