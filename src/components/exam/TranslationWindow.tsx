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

  const [pos, setPos] = useState({ x: 40, y: 80 });
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

  const textSize = Math.max(fontSize * 0.9, 0.9);

  return (
    <div
      ref={windowRef}
      className="fixed z-50 bg-white flex flex-col"
      style={{
        left: pos.x,
        top: pos.y,
        width: 400,
        maxWidth: "90vw",
        userSelect: "none",
        border: "1px solid #b0b0b0",
        boxShadow: "2px 4px 12px rgba(0,0,0,0.18)",
      }}
    >
      {/* Title bar — light gray, OS-style */}
      <div
        className="flex items-center justify-end px-2 py-1 cursor-move shrink-0"
        style={{ backgroundColor: "#e8e8e8", borderBottom: "1px solid #c0c0c0" }}
        onMouseDown={onMouseDown}
      >
        {/* Window controls: minimize, maximize (disabled), close */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setMinimized((m) => !m)}
            className="w-5 h-5 flex items-center justify-center text-gray-600 hover:bg-gray-300 rounded text-xs leading-none"
            title="Minimize"
          >
            ─
          </button>
          <button
            className="w-5 h-5 flex items-center justify-center text-gray-400 rounded text-xs leading-none cursor-default"
            title="Maximize"
            disabled
          >
            □
          </button>
          <button
            onClick={onClose}
            className="w-5 h-5 flex items-center justify-center text-gray-600 hover:bg-red-400 hover:text-white rounded text-xs leading-none"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      {!minimized && (
        <div
          className="p-4 flex flex-col gap-3 overflow-y-auto bg-white"
          style={{ maxHeight: "60vh" }}
          dir="ltr"
        >
          {/* English question text */}
          <p
            className="text-gray-900"
            style={{ fontSize: `${textSize}rem`, lineHeight: 1.55, fontWeight: "normal" }}
          >
            {question.questionTextEn}
          </p>

          {/* Options — plain text, no letter labels */}
          <div className="flex flex-col gap-2 mt-1">
            {OPTION_KEYS.map((key) => (
              <p
                key={key}
                className="text-gray-800"
                style={{ fontSize: `${textSize * 0.93}rem`, lineHeight: 1.5 }}
              >
                {getOptionEn(question, key)}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
