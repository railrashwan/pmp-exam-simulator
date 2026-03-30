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

  return (
    <div
      className="flex items-center justify-between px-4 sm:px-6 py-3 shadow-md shrink-0"
      style={{ backgroundColor: "#1e3a8a" }}
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {/* Left: title */}
      <div className="font-bold text-white text-base sm:text-lg tracking-wide truncate">
        {L.examTitle}
      </div>

      {/* Right: timer + counter (or practice badge) */}
      <div className="flex items-center gap-4 shrink-0">
        {practiceMode ? (
          <span className="px-3 py-1 bg-white/20 text-white border border-white/30 rounded text-sm font-semibold">
            {language === "ar" ? "وضع التدريب" : "Practice Mode"}
          </span>
        ) : (
          <div
            className={`font-mono font-bold text-lg tabular-nums ${
              isLow ? "text-red-400 animate-pulse" : isPaused ? "text-white/60" : "text-white"
            }`}
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="text-white/70 font-normal text-sm mr-1">{L.timeRemaining}</span>
            {formatTime(timeRemaining)}
          </div>
        )}
        <div className="text-white/80 text-sm tabular-nums">
          ≡ {L.questionOf(currentIndex + 1, questions.length)}
        </div>
      </div>
    </div>
  );
}
