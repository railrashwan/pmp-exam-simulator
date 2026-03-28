"use client";

import { useExamStore } from "@/store/examStore";
import { labels } from "@/lib/labels";

export function QuestionReviewGrid() {
  const { questions, currentIndex, answers, markedForReview, language, goToQuestion } =
    useExamStore();
  const L = labels[language];

  return (
    <div className="w-72 border-l border-edge bg-surface flex flex-col shrink-0">
      {/* Header */}
      <div className="bg-surface-2 px-3 py-2.5 text-label-caps text-muted text-center border-b border-edge">
        {L.questionReviewList}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-5 gap-1.5">
          {questions.map((q, idx) => {
            const isAnswered = answers[q.id] !== undefined;
            const isCurrent = idx === currentIndex;
            const isMarked = markedForReview.includes(q.id);

            let cellCls = "bg-canvas border-edge text-muted";
            if (isCurrent) cellCls = "bg-primary border-primary text-inverse font-bold";
            else if (isAnswered) cellCls = "bg-correct border-correct text-correct";

            return (
              <button
                key={q.id}
                onClick={() => goToQuestion(idx)}
                aria-label={`Question ${idx + 1}${isCurrent ? ", current" : isAnswered ? ", answered" : ""}${isMarked ? ", marked for review" : ""}`}
                aria-current={isCurrent ? "true" : undefined}
                className={`relative border rounded text-xs-type font-medium h-11 flex items-center justify-center transition-colors hover:opacity-80 ${cellCls}`}
              >
                {isAnswered && !isCurrent ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <span aria-hidden="true">{idx + 1}</span>
                )}
                {isMarked && (
                  <span
                    className="absolute top-0 right-0 w-2.5 h-2.5 bg-wrong rounded-bl"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-edge p-3 space-y-2 bg-canvas">
        <div className="flex items-center gap-2 text-xs-type text-content">
          <span className="w-6 h-6 bg-correct border border-correct rounded flex items-center justify-center text-correct shrink-0" aria-hidden="true">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          {L.answered}
        </div>
        <div className="flex items-center gap-2 text-xs-type text-content">
          <span className="w-6 h-6 bg-primary border border-primary rounded shrink-0" aria-hidden="true" />
          {L.current}
        </div>
        <div className="flex items-center gap-2 text-xs-type text-content">
          <span className="w-6 h-6 relative bg-canvas border border-edge rounded shrink-0" aria-hidden="true">
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-wrong rounded-bl" />
          </span>
          {L.markedForReview}
        </div>
      </div>
    </div>
  );
}
