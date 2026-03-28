"use client";

import { useEffect, useRef } from "react";
import { useExamStore } from "@/store/examStore";
import { labels } from "@/lib/labels";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function ExamHeader() {
  const { questions, currentIndex, timeRemaining, language, tick, isFinished, isPaused, pauseExam, resumeExam } =
    useExamStore();
  const L = labels[language];
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isFinished || isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => { tick(); }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isFinished, isPaused, tick]);

  const isLow = timeRemaining < 300 && !isPaused;

  return (
    <div className="bg-canvas border-b border-edge px-4 sm:px-6 py-4 flex items-center justify-between gap-3 shadow-sm">
      <div className="min-w-0">
        <div className="font-bold text-content text-2xl leading-tight truncate">{L.examTitle}</div>
        <div className="text-muted text-xl mt-1 tabular-nums">
          {L.questionOf(currentIndex + 1, questions.length)}
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <button
          onClick={isPaused ? resumeExam : pauseExam}
          className={`px-4 sm:px-5 py-2 text-xl font-semibold rounded-lg border-2 transition-colors ${
            isPaused
              ? "bg-ok text-inverse border-ok hover:opacity-90"
              : "bg-canvas text-content border-edge hover:bg-surface"
          }`}
        >
          {isPaused ? L.resume : L.pause}
        </button>
        <div
          className={`font-mono font-bold text-2xl tracking-wide tabular-nums ${
            isLow ? "text-caution animate-pulse" : isPaused ? "text-muted" : "text-content"
          }`}
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="hidden sm:inline">{L.timeRemaining} </span>
          {formatTime(timeRemaining)}
        </div>
      </div>
    </div>
  );
}
