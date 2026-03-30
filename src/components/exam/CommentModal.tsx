"use client";

import { useEffect, useRef, useState } from "react";
import { useExamStore } from "@/store/examStore";
import { labels } from "@/lib/labels";

interface CommentModalProps {
  onClose: () => void;
}

export function CommentModal({ onClose }: CommentModalProps) {
  const { questions, currentIndex, comments, setComment, language } = useExamStore();
  const L = labels[language];
  const question = questions[currentIndex];
  const existing = question ? (comments[question.id] ?? "") : "";
  const [text, setText] = useState(existing);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  function handleSave() {
    if (question) setComment(question.id, text);
    onClose();
  }

  function handleDelete() {
    if (question) setComment(question.id, "");
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onKeyDown={handleKeyDown}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 flex flex-col"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        <div
          className="px-5 py-3 flex items-center justify-between rounded-t-lg"
          style={{ backgroundColor: "#1e3a8a" }}
        >
          <h2 className="text-white font-semibold">{L.commentTitle}</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={L.commentPlaceholder}
            rows={5}
            className="w-full border border-gray-300 rounded p-3 text-sm resize-none focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-3 justify-end">
            {existing && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium rounded border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
              >
                {L.commentDelete}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {L.cancel}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium rounded text-white transition-colors"
              style={{ backgroundColor: "#1e3a8a" }}
            >
              {L.commentSave}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
