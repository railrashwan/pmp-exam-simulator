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
  const { questions, currentIndex, timeRemaining, language, tick, isFinished, isPaused, practiceMode } =
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

  const isLow = timeRemaining < 300 && !isPaused && !practiceMode;
  const progressPct = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  return (
    <div
      className="shrink-0 relative"
      style={{ backgroundColor: "#1e3a8a" }}
    >
      <div
        className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        {/* Left: title */}
        <div className="font-bold text-white text-sm sm:text-lg tracking-wide truncate min-w-0 mr-2 sm:mr-0">
          {L.examTitle}
        </div>

        {/* Right: timer + counter (or practice badge) */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {practiceMode ? (
            <span className="px-2 sm:px-3 py-1 bg-white/20 text-white border border-white/30 rounded text-xs sm:text-sm font-semibold">
              {language === "ar" ? "وضع التدريب" : "Practice"}
            </span>
          ) : (
            <div
              className={`font-mono font-bold text-base sm:text-lg tabular-nums ${
                isLow ? "text-red-400 animate-pulse" : isPaused ? "text-white/60" : "text-white"
              }`}
              aria-live="polite"
              aria-atomic="true"
            >
              <span className="hidden sm:inline text-white/70 font-normal text-sm mr-1">{L.timeRemaining}</span>
              {formatTime(timeRemaining)}
            </div>
          )}
          <div className="text-white/80 text-xs sm:text-sm tabular-nums whitespace-nowrap">
            {L.questionOf(currentIndex + 1, questions.length)}
          </div>
        </div>
      </div>

      {/* Progress bar — thin stripe at the bottom of the header */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
        <div
          className="h-full bg-white/50 transition-all duration-300 ease-out"
          style={{ width: `${progressPct}%` }}
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={questions.length}
        />
      </div>
    </div>
  );
}
