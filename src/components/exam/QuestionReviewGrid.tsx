"use client";

import { useExamStore } from "@/store/examStore";
import { labels } from "@/lib/labels";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function QuestionReviewGrid({ isOpen, onClose }: Props) {
  const { questions, currentIndex, answers, markedForReview, language, goToQuestion } =
    useExamStore();
  const L = labels[language];

  return (
    <>
      {/* Mobile/tablet backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      {/* Panel: drawer on mobile, static sidebar on desktop */}
      <div
        className={[
          "border-l border-edge bg-surface flex flex-col shrink-0",
          "fixed top-0 right-0 h-full z-30 w-72 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
          "lg:relative lg:translate-x-0 lg:z-auto lg:h-auto lg:w-80",
        ].join(" ")}
      >
        {/* Header */}
        <div className="bg-surface-2 px-3 py-3 border-b border-edge flex items-center justify-between">
          <span className="flex-1 text-center text-lg font-bold text-content tracking-wide uppercase">
            {L.questionReviewList}
          </span>
          <button
            onClick={onClose}
            aria-label="Close review panel"
            className="lg:hidden text-muted hover:text-content text-xl leading-none px-1 -mr-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = idx === currentIndex;
              const isMarked = markedForReview.includes(q.id);

              let cellCls = "bg-canvas border border-edge text-content";
              if (isCurrent) cellCls = "bg-teal-500 border-teal-600 text-white font-bold";
              else if (isAnswered) cellCls = "bg-green-100 border-green-500 text-green-700";

              return (
                <button
                  key={q.id}
                  onClick={() => { goToQuestion(idx); onClose(); }}
                  aria-label={`Question ${idx + 1}${isCurrent ? ", current" : isAnswered ? ", answered" : ""}${isMarked ? ", marked for review" : ""}`}
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
        <div className="border-t border-edge p-3 space-y-2 bg-canvas">
          <div className="flex items-center gap-2 text-xl text-content">
            <span
              className="w-7 h-7 bg-green-100 border border-green-500 rounded flex items-center justify-center text-green-600 font-bold shrink-0"
              aria-hidden="true"
            >
              ✓
            </span>
            {L.answered}
          </div>
          <div className="flex items-center gap-2 text-xl text-content">
            <span className="w-7 h-7 bg-teal-500 border border-teal-600 rounded shrink-0" aria-hidden="true" />
            {L.current}
          </div>
          <div className="flex items-center gap-2 text-xl text-content">
            <span className="w-7 h-7 relative bg-canvas border border-edge rounded shrink-0" aria-hidden="true">
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-bl" />
            </span>
            {L.markedForReview}
          </div>
        </div>
      </div>
    </>
  );
}
