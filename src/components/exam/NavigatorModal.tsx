"use client";

import { useExamStore } from "@/store/examStore";
import { labels } from "@/lib/labels";

interface NavigatorModalProps {
  onClose: () => void;
}

export function NavigatorModal({ onClose }: NavigatorModalProps) {
  const {
    questions, currentIndex, answers, markedForReview,
    visitedQuestions, comments, language, goToQuestion,
  } = useExamStore();
  const L = labels[language];
  const isRtl = language === "ar";

  function getStatus(questionId: number, index: number): string {
    if (answers[questionId]) return L.answered;
    if (visitedQuestions.includes(questionId) || index === currentIndex) return L.incomplete;
    return L.unseen;
  }

  const unseenOrIncomplete = questions.filter((q) => !answers[q.id]).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[80vh]"
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div
          className="px-5 py-3 flex items-center justify-between rounded-t-lg shrink-0"
          style={{ backgroundColor: "#1e3a8a" }}
        >
          <h2 className="text-white font-semibold text-sm">{L.navigatorTitle}</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-100 border-b border-gray-200">
              <tr>
                <th className={`px-4 py-2 font-semibold text-gray-700 ${isRtl ? "text-right" : "text-left"}`}>
                  #
                </th>
                <th className={`px-4 py-2 font-semibold text-gray-700 ${isRtl ? "text-right" : "text-left"}`}>
                  {L.answered}
                </th>
                <th className={`px-4 py-2 font-semibold text-gray-700 ${isRtl ? "text-right" : "text-left"}`}>
                  {L.flagged}
                </th>
                <th className={`px-4 py-2 font-semibold text-gray-700 ${isRtl ? "text-right" : "text-left"}`}>
                  {L.comments}
                </th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, index) => {
                const status = getStatus(q.id, index);
                const isCurrent = index === currentIndex;
                const isFlagged = markedForReview.includes(q.id);
                const hasComment = !!comments[q.id];

                return (
                  <tr
                    key={q.id}
                    onClick={() => { goToQuestion(index); onClose(); }}
                    className={`border-b border-gray-100 cursor-pointer transition-colors ${
                      isCurrent
                        ? "bg-yellow-50 hover:bg-yellow-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-2 font-medium text-gray-800">
                      {isRtl ? `السؤال ${index + 1}` : `Question ${index + 1}`}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        status === L.answered
                          ? "bg-green-100 text-green-800"
                          : status === L.incomplete
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      {isFlagged && <span className="text-orange-500 text-base">⚑</span>}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {hasComment && (
                        <span className="text-blue-600 text-xs font-medium">
                          {isRtl ? "نعم" : "yes"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 flex items-center justify-between border-t border-gray-200 shrink-0 bg-gray-50 rounded-b-lg"
          dir={isRtl ? "rtl" : "ltr"}
        >
          <span className="text-sm text-gray-600">
            {unseenOrIncomplete > 0
              ? isRtl
                ? `${unseenOrIncomplete} سؤال غير مكتمل`
                : `${unseenOrIncomplete} unanswered / incomplete`
              : isRtl
              ? "جميع الأسئلة مكتملة"
              : "All questions answered"}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded text-white transition-colors"
            style={{ backgroundColor: "#1e3a8a" }}
          >
            {L.closeNavigator}
          </button>
        </div>
      </div>
    </div>
  );
}
