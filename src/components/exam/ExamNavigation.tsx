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
  const [showHelp, setShowHelp] = useState(false);
  const isRtl = language === "ar";

  const unanswered = questions.filter((q) => answers[q.id] === undefined).length;

  function handleEndExam() {
    endExam();
    router.push("/exam/results");
  }

  const btnBase =
    "flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white/90 rounded hover:bg-white/20 border border-transparent transition-colors";

  return (
    <>
      <div
        className="flex items-center justify-between px-4 sm:px-6 py-2.5 shrink-0 shadow-[0_-2px_8px_rgba(0,0,0,0.3)]"
        style={{ backgroundColor: "#1e3a8a" }}
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Left: Help + End Exam */}
        <div className="flex items-center gap-2">
          <button onClick={() => setShowHelp(true)} className={btnBase}>
            <span className="font-bold">?</span>
            <span>{L.help}</span>
          </button>
          <button
            onClick={() => setShowEndDialog(true)}
            className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-red-300 hover:text-red-100 rounded hover:bg-white/10 transition-colors"
          >
            {L.endExam}
          </button>
        </div>

        {/* Right: Prev | Navigator | Next */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevQuestion}
            disabled={currentIndex === 0}
            className={`${btnBase} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {isRtl ? "→" : "←"} {L.previous}
          </button>

          <button
            onClick={onToggleNavigator}
            className={`${btnBase} border-white/30 bg-white/10`}
          >
            ⚙ {L.navigator}
          </button>

          <button
            onClick={nextQuestion}
            disabled={currentIndex === questions.length - 1}
            className={`${btnBase} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {L.next} {isRtl ? "←" : "→"}
          </button>
        </div>
      </div>

      {/* Help modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" dir={isRtl ? "rtl" : "ltr"}>
            <div
              className="px-5 py-3 flex items-center justify-between rounded-t-lg"
              style={{ backgroundColor: "#1e3a8a" }}
            >
              <h2 className="text-white font-semibold">{L.helpTitle}</h2>
              <button onClick={() => setShowHelp(false)} className="text-white/70 hover:text-white text-xl leading-none">✕</button>
            </div>
            <div className="p-5 text-gray-700 text-sm leading-relaxed">
              {L.helpText}
            </div>
            <div className="px-5 pb-5 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="px-4 py-2 text-sm font-medium rounded text-white"
                style={{ backgroundColor: "#1e3a8a" }}
              >
                {L.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

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
