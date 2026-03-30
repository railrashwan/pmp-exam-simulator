"use client";

import { useState, useRef, useEffect } from "react";
import { useExamStore } from "@/store/examStore";
import { usePreferencesStore } from "@/store/preferencesStore";
import type { ExamQuestion } from "@/lib/types";

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

function getOptionEn(q: ExamQuestion, key: string): string {
  const map: Record<string, keyof ExamQuestion> = {
    A: "optionAEn", B: "optionBEn", C: "optionCEn", D: "optionDEn",
  };
  return q[map[key]] as string;
}

interface TranslationWindowProps {
  onClose: () => void;
}

export function TranslationWindow({ onClose }: TranslationWindowProps) {
  const { questions, currentIndex } = useExamStore();
  const { fontSize } = usePreferencesStore();
  const question = questions[currentIndex];

  // Position state for dragging
  const [pos, setPos] = useState({ x: 40, y: 100 });
  const [minimized, setMinimized] = useState(false);
  const dragging = useRef(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, winX: 0, winY: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  function onMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("button")) return;
    dragging.current = true;
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, winX: pos.x, winY: pos.y };
    e.preventDefault();
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging.current) return;
      const dx = e.clientX - dragStart.current.mouseX;
      const dy = e.clientY - dragStart.current.mouseY;
      setPos({ x: dragStart.current.winX + dx, y: dragStart.current.winY + dy });
    }
    function onMouseUp() { dragging.current = false; }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  if (!question) return null;

  return (
    <div
      ref={windowRef}
      className="fixed z-50 w-96 max-w-[90vw] bg-white border border-gray-300 rounded shadow-xl flex flex-col"
      style={{ left: pos.x, top: pos.y, userSelect: "none" }}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-move rounded-t select-none"
        style={{ backgroundColor: "#1e3a8a" }}
        onMouseDown={onMouseDown}
      >
        <span className="text-white text-sm font-semibold">English Translation</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized((m) => !m)}
            className="text-white/70 hover:text-white px-1.5 py-0.5 text-xs leading-none rounded hover:bg-white/20"
            title={minimized ? "Restore" : "Minimize"}
          >
            {minimized ? "□" : "─"}
          </button>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white px-1.5 py-0.5 text-xs leading-none rounded hover:bg-white/20"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      {!minimized && (
        <div className="p-4 flex flex-col gap-3 max-h-96 overflow-y-auto bg-white rounded-b">
          <p className="text-gray-900 font-medium" style={{ fontSize: `${fontSize}rem`, lineHeight: "1.6" }}>
            {question.questionTextEn}
          </p>
          <div className="flex flex-col gap-1 mt-1">
            {OPTION_KEYS.map((key) => (
              <div key={key} className="flex items-start gap-2 text-gray-800" style={{ fontSize: `${fontSize * 0.9}rem` }}>
                <span className="font-semibold shrink-0">{key}.</span>
                <span>{getOptionEn(question, key)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
