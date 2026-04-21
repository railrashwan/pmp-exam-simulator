"use client";

import { useState, useRef, useEffect } from "react";
import { useExamStore } from "@/store/examStore";
import { usePreferencesStore } from "@/store/preferencesStore";
import type { ExamQuestion } from "@/lib/types";

const OPTION_KEYS = ["A", "B", "C", "D"] as const;
const MIN_W = 320;
const MIN_H = 180;
const DEFAULT_W = 720;
const DEFAULT_H = 340;

function getOptionText(q: ExamQuestion, key: string, lang: "en" | "ar"): string {
  const arMap: Record<string, keyof ExamQuestion> = {
    A: "optionAAr", B: "optionBAr", C: "optionCAr", D: "optionDAr",
  };
  const enMap: Record<string, keyof ExamQuestion> = {
    A: "optionAEn", B: "optionBEn", C: "optionCEn", D: "optionDEn",
  };
  const map = lang === "en" ? enMap : arMap;
  return q[map[key]] as string;
}

interface TranslationWindowProps {
  onClose: () => void;
}

export function TranslationWindow({ onClose }: TranslationWindowProps) {
  const { questions, currentIndex, language } = useExamStore();
  const { fontSize } = usePreferencesStore();
  const question = questions[currentIndex];

  // When exam is in English → show Arabic; when in Arabic → show English
  const targetLang: "en" | "ar" = language === "en" ? "ar" : "en";
  const isTargetRtl = targetLang === "ar";

  const [isMobile, setIsMobile] = useState(false);
  const [pos, setPos] = useState({ x: 20, y: 9999 });
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });
  const [minimized, setMinimized] = useState(false);

  // Detect mobile on mount and on resize
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Clamp default width to viewport on desktop
  useEffect(() => {
    if (!isMobile) {
      const vw = window.innerWidth;
      setSize({ w: Math.min(DEFAULT_W, vw - 40), h: DEFAULT_H });
      setPos({ x: 20, y: Math.max(60, window.innerHeight - DEFAULT_H - 130) });
    }
  }, [isMobile]);

  // Drag state
  const dragging = useRef(false);
  const dragStart = useRef({ clientX: 0, clientY: 0, winX: 0, winY: 0 });

  // Resize state
  const resizing = useRef(false);
  const resizeStart = useRef({ clientX: 0, clientY: 0, w: DEFAULT_W, h: DEFAULT_H });

  function startDrag(clientX: number, clientY: number) {
    dragging.current = true;
    dragStart.current = { clientX, clientY, winX: pos.x, winY: pos.y };
  }

  function startResize(clientX: number, clientY: number) {
    resizing.current = true;
    resizeStart.current = { clientX, clientY, w: size.w, h: size.h };
  }

  function onTitleMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("button")) return;
    startDrag(e.clientX, e.clientY);
    e.preventDefault();
  }

  function onTitleTouchStart(e: React.TouchEvent) {
    if ((e.target as HTMLElement).closest("button")) return;
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
  }

  function onResizeMouseDown(e: React.MouseEvent) {
    startResize(e.clientX, e.clientY);
    e.preventDefault();
    e.stopPropagation();
  }

  function onResizeTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    startResize(t.clientX, t.clientY);
    e.stopPropagation();
  }

  function applyMove(clientX: number, clientY: number) {
    if (dragging.current) {
      const dx = clientX - dragStart.current.clientX;
      const dy = clientY - dragStart.current.clientY;
      setPos({ x: dragStart.current.winX + dx, y: dragStart.current.winY + dy });
    }
    if (resizing.current) {
      const dw = clientX - resizeStart.current.clientX;
      const dh = clientY - resizeStart.current.clientY;
      setSize({
        w: Math.max(MIN_W, resizeStart.current.w + dw),
        h: Math.max(MIN_H, resizeStart.current.h + dh),
      });
    }
  }

  function stopDragResize() {
    dragging.current = false;
    resizing.current = false;
  }

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => applyMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      applyMove(t.clientX, t.clientY);
    };
    const onMouseUp = () => stopDragResize();
    const onTouchEnd = () => stopDragResize();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, size]);

  if (!question) return null;

  const textSize = Math.max(fontSize * 0.88, 0.82);
  const titleLabel = language === "en" ? "Arabic Translation / الترجمة العربية" : "English Translation";
  const questionText = targetLang === "en"
    ? question.questionTextEn
    : (question.questionTextAr || question.questionTextEn);

  const contentBody = (
    <div
      className="flex-1 overflow-y-auto px-4 py-3 bg-white"
      dir={isTargetRtl ? "rtl" : "ltr"}
    >
      <p
        className={`text-gray-900 mb-3 ${isTargetRtl ? "text-right" : ""}`}
        style={{
          fontSize: `${textSize}rem`,
          lineHeight: isTargetRtl ? 1.85 : 1.55,
          fontWeight: "normal",
        }}
      >
        {questionText}
      </p>
      <div className="flex flex-col gap-1.5">
        {OPTION_KEYS.map((key) => (
          <p
            key={key}
            className={`text-gray-700 ${isTargetRtl ? "text-right" : ""}`}
            style={{ fontSize: `${textSize * 0.93}rem`, lineHeight: isTargetRtl ? 1.75 : 1.45 }}
          >
            {getOptionText(question, key, targetLang)}
          </p>
        ))}
      </div>
    </div>
  );

  // ── Mobile: bottom sheet ──────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white flex flex-col"
        style={{
          height: "50vh",
          borderTop: "2px solid #b0b0b0",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header bar */}
        <div
          className="flex items-center justify-between px-4 py-2.5 shrink-0"
          style={{ backgroundColor: "#e8e8e8", borderBottom: "1px solid #c0c0c0" }}
        >
          <span className="text-gray-600 text-sm font-medium">{titleLabel}</span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-red-100 hover:text-red-600 rounded transition-colors"
            aria-label="Close translation"
          >
            ✕
          </button>
        </div>
        {contentBody}
      </div>
    );
  }

  // ── Desktop: draggable floating window ────────────────────────────────────
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
      {/* Title bar */}
      <div
        className="flex items-center px-2 py-1 cursor-move shrink-0"
        style={{ backgroundColor: "#e8e8e8", borderBottom: "1px solid #c0c0c0" }}
        onMouseDown={onTitleMouseDown}
        onTouchStart={onTitleTouchStart}
      >
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
        <span className="ml-2 text-gray-500 text-xs font-medium select-none">{titleLabel}</span>
        <div className="flex-1" />
      </div>

      {!minimized && contentBody}

      {/* Resize handle */}
      {!minimized && (
        <div
          onMouseDown={onResizeMouseDown}
          onTouchStart={onResizeTouchStart}
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-end justify-end p-0.5"
          style={{ userSelect: "none" }}
          title="Drag to resize"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" className="text-gray-400">
            <circle cx="10" cy="10" r="1.2" fill="currentColor" />
            <circle cx="6"  cy="10" r="1.2" fill="currentColor" />
            <circle cx="10" cy="6"  r="1.2" fill="currentColor" />
          </svg>
        </div>
      )}
    </div>
  );
}
