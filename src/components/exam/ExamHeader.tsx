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
    <div className="bg-primary border-b border-primary px-4 sm:px-6 py-5 flex items-center justify-between gap-3 shadow-sm" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="min-w-0">
        <div className="font-bold text-white text-2xl tracking-wide drop-shadow-sm truncate">{L.examTitle}</div>
        <div className="text-white/90 text-sm mt-0.5 tabular-nums">
          {L.questionOf(currentIndex + 1, questions.length)}
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <button
          onClick={isPaused ? resumeExam : pauseExam}
          className={`px-4 sm:px-5 py-2 text-sm font-semibold rounded-lg border transition-colors ${
            isPaused
              ? "bg-ok text-white border-ok hover:opacity-90"
              : "bg-white/10 text-white border-white/20 hover:bg-white/20"
          }`}
        >
          {isPaused ? L.resume : L.pause}
        </button>
        <div
          className={`font-mono font-bold text-xl tracking-wide tabular-nums ${
            isLow ? "text-red-400 animate-pulse" : isPaused ? "text-white/60" : "text-white/95"
          }`}
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="hidden sm:inline opacity-80">{L.timeRemaining} </span>
          {formatTime(timeRemaining)}
        </div>
      </div>
    </div>
  );
}
