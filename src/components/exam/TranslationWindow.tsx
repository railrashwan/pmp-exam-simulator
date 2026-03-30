"use client";

import { useState, useRef, useEffect } from "react";
import { useExamStore } from "@/store/examStore";
import { usePreferencesStore } from "@/store/preferencesStore";
import type { ExamQuestion } from "@/lib/types";

const OPTION_KEYS = ["A", "B", "C", "D"] as const;
const MIN_W = 380;
const MIN_H = 200;
const DEFAULT_W = 780;
const DEFAULT_H = 360;

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

  // Position — bottom-left by default, calculated after mount
  const [pos, setPos] = useState({ x: 20, y: 9999 }); // 9999 = unset, replaced on mount
  // Size — wide landscape by default
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });
  const [minimized, setMinimized] = useState(false);

  // Drag state
  const dragging = useRef(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, winX: 0, winY: 0 });

  // Resize state
  const resizing = useRef(false);
  const resizeStart = useRef({ mouseX: 0, mouseY: 0, w: DEFAULT_W, h: DEFAULT_H });

  function onTitleMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("button")) return;
    dragging.current = true;
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, winX: pos.x, winY: pos.y };
    e.preventDefault();
  }

  function onResizeMouseDown(e: React.MouseEvent) {
    resizing.current = true;
    resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, w: size.w, h: size.h };
    e.preventDefault();
    e.stopPropagation();
  }

  // Set bottom-left position once we know the viewport height
  useEffect(() => {
    setPos({ x: 20, y: Math.max(60, window.innerHeight - DEFAULT_H - 130) });
  }, []);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (dragging.current) {
        const dx = e.clientX - dragStart.current.mouseX;
        const dy = e.clientY - dragStart.current.mouseY;
        setPos({ x: dragStart.current.winX + dx, y: dragStart.current.winY + dy });
      }
      if (resizing.current) {
        const dw = e.clientX - resizeStart.current.mouseX;
        const dh = e.clientY - resizeStart.current.mouseY;
        setSize({
          w: Math.max(MIN_W, resizeStart.current.w + dw),
          h: Math.max(MIN_H, resizeStart.current.h + dh),
        });
      }
    }
    function onMouseUp() {
      dragging.current = false;
      resizing.current = false;
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  if (!question) return null;

  const textSize = Math.max(fontSize * 0.88, 0.82);

  return (
    <div
      className="fixed z-50 bg-white flex flex-col"
      style={{
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: minimized ? "auto" : size.h,
        userSelect: "none",
        border: "1px solid #b0b0b0",
        boxShadow: "2px 4px 14px rgba(0,0,0,0.2)",
      }}
    >
      {/* Title bar — light gray, OS-style, draggable, controls on LEFT */}
      <div
        className="flex items-center px-2 py-1 cursor-move shrink-0"
        style={{ backgroundColor: "#e8e8e8", borderBottom: "1px solid #c0c0c0" }}
        onMouseDown={onTitleMouseDown}
      >
        {/* Controls: ✕ □ ─  (left-aligned, like macOS-style) */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={onClose}
            className="w-5 h-5 flex items-center justify-center text-gray-600 hover:bg-red-400 hover:text-white rounded text-xs leading-none"
            title="Close"
          >
            ✕
          </button>
          <button
            className="w-5 h-5 flex items-center justify-center text-gray-400 rounded text-xs leading-none cursor-default"
            disabled
            title="Maximize"
          >
            □
          </button>
          <button
            onClick={() => setMinimized((m) => !m)}
            className="w-5 h-5 flex items-center justify-center text-gray-600 hover:bg-gray-300 rounded text-xs leading-none"
            title={minimized ? "Restore" : "Minimize"}
          >
            ─
          </button>
        </div>
        {/* Drag affordance fills the rest */}
        <div className="flex-1" />
      </div>

      {/* Content — scrollable */}
      {!minimized && (
        <div
          className="flex-1 overflow-y-auto px-4 py-3 bg-white"
          dir="ltr"
        >
          {/* Question */}
          <p
            className="text-gray-900 mb-3"
            style={{ fontSize: `${textSize}rem`, lineHeight: 1.55, fontWeight: "normal" }}
          >
            {question.questionTextEn}
          </p>

          {/* Options — plain text, no letter labels */}
          <div className="flex flex-col gap-1.5">
            {OPTION_KEYS.map((key) => (
              <p
                key={key}
                className="text-gray-700"
                style={{ fontSize: `${textSize * 0.93}rem`, lineHeight: 1.45 }}
              >
                {getOptionEn(question, key)}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Resize handle — bottom-right corner */}
      {!minimized && (
        <div
          onMouseDown={onResizeMouseDown}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          style={{ userSelect: "none" }}
          title="Drag to resize"
        >
          {/* Grip dots */}
          <svg width="14" height="14" viewBox="0 0 14 14" className="absolute bottom-0.5 right-0.5 text-gray-400">
            <circle cx="10" cy="10" r="1.2" fill="currentColor" />
            <circle cx="6"  cy="10" r="1.2" fill="currentColor" />
            <circle cx="10" cy="6"  r="1.2" fill="currentColor" />
          </svg>
        </div>
      )}
    </div>
  );
}
