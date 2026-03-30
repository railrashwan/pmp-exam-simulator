"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useExamStore } from "@/store/examStore";
import { labels } from "@/lib/labels";
import { EndExamDialog } from "./EndExamDialog";

interface Props {
  onToggleNavigator: () => void;
}

export function ExamNavigation({ onToggleNavigator }: Props) {
  const {
    questions, currentIndex, answers, language, prevQuestion, nextQuestion, endExam,
  } = useExamStore();
  const L = labels[language];
  const router = useRouter();
  const [showEndDialog, setShowEndDialog] = useState(false);
  const isRtl = language === "ar";

  const unanswered = questions.filter((q) => answers[q.id] === undefined).length;

  function handleEndExam() {
    endExam();
    router.push("/exam/results");
  }

  const btnBase =
    "flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white/90 hover:bg-white/15 rounded transition-colors border border-transparent select-none";

  const btnNavBase =
    "flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/15 rounded transition-colors border border-white/20 select-none";

  return (
    <>
      <div
        className="flex items-center justify-end px-4 py-2 shrink-0"
        style={{ backgroundColor: "#1e3a8a" }}
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* ← Previous */}
        <button
          onClick={prevQuestion}
          disabled={currentIndex === 0}
          className={`${btnBase} disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {isRtl ? "→" : "←"} {L.previous}
        </button>

        {/* ⚙ Navigator */}
        <button onClick={onToggleNavigator} className={btnNavBase}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
            <circle cx="8" cy="8" r="6.5"/>
            <circle cx="8" cy="8" r="1.8" fill="currentColor" stroke="none"/>
            <path d="M8 1.5V4M8 12v2.5M1.5 8H4M12 8h2.5" strokeLinecap="round"/>
          </svg>
          {L.navigator}
        </button>

        {/* Next → */}
        <button
          onClick={nextQuestion}
          disabled={currentIndex === questions.length - 1}
          className={`${btnBase} disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {L.next} {isRtl ? "←" : "→"}
        </button>
      </div>

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
