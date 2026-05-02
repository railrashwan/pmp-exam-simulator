"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useExamStore } from "@/store/examStore";
import { labels } from "@/lib/labels";
import { EndExamDialog } from "./EndExamDialog";

interface NavigatorModalProps {
  onClose: () => void;
}

export function NavigatorModal({ onClose }: NavigatorModalProps) {
  const {
    questions, currentIndex, answers, markedForReview,
    visitedQuestions, comments, language, goToQuestion, endExam,
  } = useExamStore();
  const router = useRouter();
  const [showEndDialog, setShowEndDialog] = useState(false);
  const L = labels[language];
  const isRtl = language === "ar";

  function getStatus(questionId: number, index: number): "answered" | "current" | "flagged" | "incomplete" | "unseen" {
    if (index === currentIndex) return "current";
    if (answers[questionId]) return "answered";
    if (markedForReview.includes(questionId)) return "flagged";
    if (visitedQuestions.includes(questionId)) return "incomplete";
    return "unseen";
  }

  const unseenOrIncomplete = questions.filter((q) => !answers[q.id]).length;

  // Color per status for the number grid
  const statusStyle: Record<string, string> = {
    answered:   "bg-green-100 text-green-800 border-green-300",
    current:    "bg-yellow-100 text-yellow-800 border-yellow-400 font-bold ring-2 ring-yellow-400",
    flagged:    "bg-orange-100 text-orange-700 border-orange-300",
    incomplete: "bg-blue-50 text-blue-700 border-blue-200",
    unseen:     "bg-gray-100 text-gray-600 border-gray-200",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div
        className="bg-white rounded-t-xl sm:rounded-lg shadow-xl w-full sm:max-w-2xl sm:mx-4 flex flex-col max-h-[85vh] sm:max-h-[80vh]"
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div
          className="px-4 sm:px-5 py-3 flex items-center justify-between rounded-t-xl sm:rounded-t-lg shrink-0"
          style={{ backgroundColor: "#1e3a8a" }}
        >
          <h2 className="text-white font-semibold text-sm">{L.navigatorTitle}</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Legend — always visible */}
        <div className="px-4 py-2 flex flex-wrap gap-2 text-xs border-b border-gray-100 shrink-0 bg-gray-50">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-100 border border-green-300 inline-block"/>{L.answered}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-100 border border-yellow-400 inline-block"/>{L.current}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-100 border border-orange-300 inline-block"/>⚑ {L.flagged}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200 inline-block"/>{L.unseen}</span>
        </div>

        {/* ── Mobile: compact number grid ── */}
        <div className="block sm:hidden overflow-y-auto flex-1 p-3">
          <div className="grid grid-cols-6 gap-1.5">
            {questions.map((q, index) => {
              const status = getStatus(q.id, index);
              const isFlagged = markedForReview.includes(q.id);
              return (
                <button
                  key={q.id}
                  onClick={() => { goToQuestion(index); onClose(); }}
                  className={`relative h-11 rounded border text-xs font-medium transition-colors ${statusStyle[status]}`}
                  title={`Question ${index + 1}`}
                >
                  {index + 1}
                  {isFlagged && (
                    <span className="absolute top-0.5 right-0.5 text-orange-500 text-[8px] leading-none">⚑</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Desktop: table view ── */}
        <div className="hidden sm:block overflow-y-auto flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-100 border-b border-gray-200">
              <tr>
                <th className={`px-4 py-2 font-semibold text-gray-700 ${isRtl ? "text-right" : "text-left"}`}>#</th>
                <th className={`px-4 py-2 font-semibold text-gray-700 ${isRtl ? "text-right" : "text-left"}`}>{L.answered}</th>
                <th className={`px-4 py-2 font-semibold text-gray-700 ${isRtl ? "text-right" : "text-left"}`}>{L.flagged}</th>
                <th className={`px-4 py-2 font-semibold text-gray-700 ${isRtl ? "text-right" : "text-left"}`}>{L.comments}</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, index) => {
                const status = getStatus(q.id, index);
                const isCurrent = index === currentIndex;
                const isFlagged = markedForReview.includes(q.id);
                const hasComment = !!comments[q.id];
                const statusLabel =
                  status === "answered" ? L.answered
                  : status === "incomplete" ? L.incomplete
                  : L.unseen;

                return (
                  <tr
                    key={q.id}
                    onClick={() => { goToQuestion(index); onClose(); }}
                    className={`border-b border-gray-100 cursor-pointer transition-colors ${
                      isCurrent ? "bg-yellow-50 hover:bg-yellow-100" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-2.5 font-medium text-gray-800">
                      {isRtl ? `السؤال ${index + 1}` : `Question ${index + 1}`}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        status === "answered" ? "bg-green-100 text-green-800"
                        : status === "incomplete" ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-600"
                      }`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {isFlagged && <span className="text-orange-500 text-base">⚑</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {hasComment && <span className="text-blue-600 text-xs font-medium">{isRtl ? "نعم" : "yes"}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          className="px-4 sm:px-5 py-3 flex items-center justify-between border-t border-gray-200 shrink-0 bg-gray-50 rounded-b-xl sm:rounded-b-lg"
          dir={isRtl ? "rtl" : "ltr"}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {unseenOrIncomplete > 0
                ? isRtl ? `${unseenOrIncomplete} سؤال غير مكتمل` : `${unseenOrIncomplete} unanswered`
                : isRtl ? "جميع الأسئلة مكتملة" : "All answered"}
            </span>
            <button
              onClick={() => setShowEndDialog(true)}
              className="px-3 py-2 min-h-[40px] text-sm font-medium rounded border border-red-300 text-red-700 hover:bg-red-50 active:bg-red-100 transition-colors"
            >
              {L.endExam}
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 min-h-[40px] text-sm font-medium rounded text-white transition-colors"
            style={{ backgroundColor: "#1e3a8a" }}
          >
            {L.closeNavigator}
          </button>
        </div>

        {showEndDialog && (
          <EndExamDialog
            unanswered={answers ? questions.filter((q) => !answers[q.id]).length : 0}
            onConfirm={() => { endExam(); router.push("/exam/results"); }}
            onCancel={() => setShowEndDialog(false)}
          />
        )}
      </div>
    </div>
  );
}
