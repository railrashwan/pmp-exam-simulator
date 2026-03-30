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
  const { questions, currentIndex, timeRemaining, language, tick, isFinished, isPaused, pauseExam, resumeExam, practiceMode } =
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
    <div className="bg-white border-b border-gray-300 px-6 py-4 flex items-center justify-between shadow-sm">
      <div>
        <div className="font-bold text-gray-900 text-2xl leading-tight">{L.examTitle}</div>
        <div className="text-gray-500 text-xl mt-1">
          {L.questionOf(currentIndex + 1, questions.length)}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {practiceMode ? (
          <span className="px-4 py-1.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xl font-semibold">
            {language === "ar" ? "وضع التدريب" : "Practice Mode"}
          </span>
        ) : (
          <>
            <button
              onClick={isPaused ? resumeExam : pauseExam}
              className={`px-5 py-2 text-xl font-semibold rounded-lg border-2 transition-all ${
                isPaused
                  ? "bg-green-600 text-white border-green-700 hover:bg-green-700"
                  : "bg-white text-gray-700 border-gray-400 hover:bg-gray-50"
              }`}
            >
              {isPaused ? L.resume : L.pause}
            </button>
            <div
              className={`font-mono font-bold text-2xl tracking-wide ${isLow ? "text-red-600 animate-pulse" : isPaused ? "text-yellow-600" : "text-gray-800"}`}
              aria-live="polite"
              aria-atomic="true"
            >
              {L.timeRemaining} {formatTime(timeRemaining)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
