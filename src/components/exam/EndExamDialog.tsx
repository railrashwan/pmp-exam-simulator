"use client";

import { useEffect, useRef } from "react";
import { useExamStore } from "@/store/examStore";
import { labels } from "@/lib/labels";

interface Props {
  unanswered: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function EndExamDialog({ unanswered, onConfirm, onCancel }: Props) {
  const { language } = useExamStore();
  const L = labels[language];
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { cancelRef.current?.focus(); }, []);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-exam-title"
    >
      <div className="bg-canvas border border-edge rounded-lg shadow-xl w-[440px] overflow-hidden">
        <div className="bg-surface border-b border-edge px-5 py-4">
          <h2 id="end-exam-title" className="font-semibold text-content text-[15px]">
            {L.endExamConfirm}
          </h2>
        </div>
        <div className="p-5">
          <p className="text-[14px] text-content leading-relaxed">{L.endExamMessage(unanswered)}</p>
        </div>
        <div className="flex gap-2 px-5 pb-5 justify-end">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="px-5 py-2 text-[14px] border border-edge rounded text-content hover:bg-surface font-medium transition-colors"
          >
            {L.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 text-[14px] bg-err text-inverse rounded hover:opacity-90 font-medium transition-opacity"
          >
            {L.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
