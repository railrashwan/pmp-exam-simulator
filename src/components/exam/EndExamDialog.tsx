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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="end-exam-title">
      <div className="bg-white rounded-xl shadow-2xl w-[480px] overflow-hidden">
        <div className="bg-gray-700 text-white px-6 py-4">
          <h2 id="end-exam-title" className="font-semibold text-2xl">{L.endExamConfirm}</h2>
        </div>
        <div className="p-6">
          <p className="text-2xl text-gray-700 leading-relaxed">{L.endExamMessage(unanswered)}</p>
        </div>
        <div className="flex gap-3 px-6 pb-6 justify-end">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="px-7 py-3 text-2xl border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium shadow-sm hover:shadow-md transition-all"
          >
            {L.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="px-7 py-3 text-2xl bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm hover:shadow-md transition-all"
          >
            {L.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
