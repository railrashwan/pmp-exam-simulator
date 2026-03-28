"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useExamStore } from "@/store/examStore";
import { LanguageToggle } from "@/components/exam/LanguageToggle";
import type { ExamResultsResponse, ExamResult } from "@/lib/types";

// Parses "A: Wrong; reason. B: Wrong; reason." → { A: "reason", B: "reason" }
function parseWrongExplanations(text: string | null): Record<string, string> {
  if (!text) return {};
  const result: Record<string, string> = {};
  const matches = text.matchAll(/\b([A-D]):\s*(.*?)(?=\s+[A-D]:|$)/g);
  for (const m of matches) {
    result[m[1]] = m[2].trim().replace(/\.$/, "");
  }
  return result;
}

export default function ResultsPage() {
  const { questions, answers, examSet, savedAttemptId, setSavedAttemptId, resetExam, language } = useExamStore();
  const router = useRouter();
  const [results, setResults] = useState<ExamResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const isRtl = language === "ar";
  const savingRef = useRef(false);

  useEffect(() => {
    if (questions.length === 0) { router.replace("/"); return; }
    const answersPayload: Record<string, string> = {};
    questions.forEach((q) => { if (answers[q.id]) answersPayload[String(q.id)] = answers[q.id]; });

    fetch("/api/exam/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: answersPayload,
        allQuestionIds: questions.map((q) => q.id),
      }),
    })
      .then((r) => { if (!r.ok) throw new Error("Failed to calculate results"); return r.json(); })
      .then((data: ExamResultsResponse) => {
        setResults(data);
        setLoading(false);

        // Save attempt once — skip if already saved or currently saving
        if (!savedAttemptId && !savingRef.current) {
          savingRef.current = true;
          fetch("/api/profile/save-attempt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              examSet,
              totalQuestions: data.totalQuestions,
              correctAnswers: data.correctAnswers,
              score: data.score,
              passed: data.passed,
              domainBreakdown: data.domainBreakdown,
              results: data.results.map((r) => ({
                questionId: r.questionId,
                selectedAnswer: r.selectedAnswer,
                isCorrect: r.isCorrect,
              })),
            }),
          })
            .then((r) => r.json())
            .then(({ attemptId }) => { if (attemptId) setSavedAttemptId(attemptId); })
            .catch(() => { /* non-critical — don't block results display */ });
        }
      })
      .catch((e) => { setError(e instanceof Error ? e.message : "An error occurred"); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRetake() { resetExam(); window.location.href = "/"; }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-2xl">Calculating results...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <p className="text-red-600 text-2xl">{error}</p>
          <button onClick={handleRetake} className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-2xl font-medium shadow-md">
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!results) return null;

  const { score, passed, correctAnswers, totalQuestions, domainBreakdown, results: qResults } = results;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky language bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm px-6 py-3 flex items-center justify-between">
        <a
          href="/"
          className="px-5 py-2 text-xl font-medium text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
        >
          {language === "ar" ? "← الرئيسية" : "← Home"}
        </a>
        <LanguageToggle />
      </div>

      <div className="max-w-4xl mx-auto space-y-6 px-6 pt-6 pb-10">

        {/* Score Card */}
        <div className={`bg-white rounded-2xl shadow-md p-8 text-center border-t-4 ${passed ? "border-green-500" : "border-red-500"}`}>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {language === "ar" ? "نتيجة الاختبار" : "Exam Results"}
          </h1>
          <div className={`text-8xl font-bold my-6 ${passed ? "text-green-600" : "text-red-600"}`}>
            {score}%
          </div>
          <div className={`text-3xl font-bold mb-3 ${passed ? "text-green-700" : "text-red-700"}`}>
            {passed
              ? language === "ar" ? "✓ ناجح" : "✓ PASSED"
              : language === "ar" ? "✗ راسب" : "✗ FAILED"}
          </div>
          <p className="text-gray-600 text-2xl">
            {language === "ar"
              ? `${correctAnswers} إجابة صحيحة من ${totalQuestions}`
              : `${correctAnswers} correct out of ${totalQuestions} questions`}
          </p>
          <p className="text-gray-400 text-xl mt-1">
            {language === "ar" ? "درجة النجاح: 65%" : "Passing score: 65%"}
          </p>
        </div>

        {/* Domain Breakdown */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-bold text-gray-800 text-2xl mb-4">
            {language === "ar" ? "الأداء حسب المجال" : "Performance by Domain"}
          </h2>
          <div className="space-y-4">
            {Object.entries(domainBreakdown).map(([domain, { correct, total }]) => {
              const pct = Math.round((correct / total) * 100);
              return (
                <div key={domain}>
                  <div className="flex justify-between text-2xl mb-2">
                    <span className="text-gray-700">{domain}</span>
                    <span className="font-semibold">{correct}/{total} ({pct}%)</span>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct >= 65 ? "bg-green-500" : "bg-red-400"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Per-question review */}
        <div className="bg-white rounded-2xl shadow-md">
          <h2 className="font-bold text-gray-800 text-2xl p-6 border-b">
            {language === "ar" ? "مراجعة الأسئلة" : "Question Review"}
          </h2>
          <div className="divide-y">
            {qResults.map((r: ExamResult, idx: number) => {
              const wrongMap = isRtl
                ? parseWrongExplanations(r.wrongExplanationAr)
                : parseWrongExplanations(r.wrongExplanationEn);

              return (
                <div key={r.questionId} className="p-4">
                  <button
                    className="w-full text-left flex items-start gap-4"
                    onClick={() => setExpanded(expanded === idx ? null : idx)}
                  >
                    <span className={`mt-1 shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xl font-bold ${
                      r.isCorrect ? "bg-green-500 text-white" : "text-white " + (r.selectedAnswer ? "bg-red-500" : "bg-gray-400")
                    }`}>
                      {r.isCorrect ? "✓" : r.selectedAnswer ? "✗" : "—"}
                    </span>
                    <span className="text-2xl text-gray-700 flex-1 leading-relaxed" dir={isRtl ? "rtl" : "ltr"}>
                      {idx + 1}. {isRtl ? r.questionTextAr : r.questionTextEn}
                    </span>
                    <span className="text-gray-400 text-xl shrink-0 mt-1">{expanded === idx ? "▲" : "▼"}</span>
                  </button>

                  {expanded === idx && (
                    <div className="mt-4 ml-12 space-y-3" dir={isRtl ? "rtl" : "ltr"}>
                      {(["A", "B", "C", "D"] as const).map((key) => {
                        const textMap: Record<string, string> = {
                          A: isRtl ? r.optionAAr : r.optionAEn,
                          B: isRtl ? r.optionBAr : r.optionBEn,
                          C: isRtl ? r.optionCAr : r.optionCEn,
                          D: isRtl ? r.optionDAr : r.optionDEn,
                        };
                        const isCorrectOption = key === r.correctAnswer;
                        const isSelected = key === r.selectedAnswer;
                        const wrongExpl = wrongMap[key];

                        return (
                          <div key={key}>
                            {/* Option row */}
                            <div className={`px-4 py-3 rounded-lg text-2xl ${
                              isCorrectOption
                                ? "bg-green-100 border border-green-400 text-green-900"
                                : isSelected
                                ? "bg-red-100 border border-red-400 text-red-900"
                                : "bg-gray-50 border border-gray-200 text-gray-600"
                            }`}>
                              <span className="font-semibold">{key}.</span> {textMap[key]}
                              {isCorrectOption && <span className="ml-2 font-bold text-green-700">✓</span>}
                              {isSelected && !isCorrectOption && <span className="ml-2 font-bold text-red-700">✗</span>}
                            </div>
                            {/* Inline explanation */}
                            {isCorrectOption && (
                              <div className="mt-1 px-4 py-2 bg-green-50 border-l-4 border-green-400 text-green-800 text-xl rounded-r-lg">
                                <span className="font-semibold">{isRtl ? "لماذا صحيح: " : "Why correct: "}</span>
                                {isRtl ? r.explanationAr : r.explanationEn}
                              </div>
                            )}
                            {!isCorrectOption && wrongExpl && (
                              <div className={`mt-1 px-4 py-2 text-xl rounded-r-lg ${
                                isSelected
                                  ? "bg-red-50 border-l-4 border-red-400 text-red-800"
                                  : "bg-gray-50 border-l-4 border-gray-300 text-gray-600"
                              }`}>
                                <span className="font-semibold">{isRtl ? "لماذا خطأ: " : "Why wrong: "}</span>
                                {wrongExpl}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center pb-4">
          <button
            onClick={handleRetake}
            className="px-10 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-2xl shadow-md hover:shadow-lg transition-all"
          >
            {language === "ar" ? "بدء اختبار جديد" : "Start New Exam"}
          </button>
        </div>
      </div>
    </div>
  );
}
