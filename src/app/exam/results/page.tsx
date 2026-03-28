"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useExamStore } from "@/store/examStore";
import { LanguageToggle } from "@/components/exam/LanguageToggle";
import type { ExamResultsResponse, ExamResult } from "@/lib/types";

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
            .catch(() => {});
        }
      })
      .catch((e) => { setError(e instanceof Error ? e.message : "An error occurred"); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRetake() { resetExam(); window.location.href = "/"; }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="text-muted text-sm-type">Calculating results...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="text-center space-y-4">
          <p className="text-wrong text-sm-type">{error}</p>
          <button onClick={handleRetake} className="px-6 py-2.5 bg-interact text-inverse rounded hover:bg-interact-h text-xs-type font-medium transition-colors">
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!results) return null;

  const { score, passed, correctAnswers, totalQuestions, domainBreakdown, results: qResults } = results;

  return (
    <div className="min-h-screen bg-surface">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 bg-canvas border-b border-edge px-4 sm:px-6 py-3 flex items-center justify-between">
        <a
          href="/"
          className="text-xs-type font-medium text-content border border-edge rounded px-3 py-1.5 hover:bg-surface transition-colors"
        >
          {language === "ar" ? "← الرئيسية" : "← Home"}
        </a>
        <LanguageToggle />
      </div>

      <div className="max-w-4xl mx-auto space-y-5 px-4 sm:px-6 pt-6 pb-10">

        {/* Score Card */}
        <div className={`bg-canvas border rounded-lg overflow-hidden ${passed ? "border-correct" : "border-wrong"}`}>
          <div className={`px-6 py-3 text-xs-type font-semibold ${passed ? "bg-correct text-inverse" : "bg-wrong text-inverse"}`}>
            {language === "ar" ? "نتيجة الاختبار" : "Exam Results"}
          </div>
          <div className="p-6 text-center">
            <div className={`text-6xl font-bold my-4 tabular-nums ${passed ? "text-correct" : "text-wrong"}`}>
              {score}%
            </div>
            <div className={`text-xl font-bold mb-2 ${passed ? "text-correct" : "text-wrong"}`}>
              {passed
                ? language === "ar" ? "ناجح" : "PASSED"
                : language === "ar" ? "راسب" : "FAILED"}
            </div>
            <p className="text-content text-sm-type">
              {language === "ar"
                ? `${correctAnswers} إجابة صحيحة من ${totalQuestions}`
                : `${correctAnswers} correct out of ${totalQuestions} questions`}
            </p>
            <p className="text-muted text-xs-type mt-1">
              {language === "ar" ? "درجة النجاح: 65%" : "Passing score: 65%"}
            </p>
          </div>
        </div>

        {/* Domain Breakdown */}
        <div className="bg-canvas border border-edge rounded-lg p-5">
          <h2 className="font-bold text-content text-sm-type mb-4">
            {language === "ar" ? "الأداء حسب المجال" : "Performance by Domain"}
          </h2>
          <div className="space-y-4">
            {Object.entries(domainBreakdown).map(([domain, { correct, total }]) => {
              const pct = Math.round((correct / total) * 100);
              return (
                <div key={domain}>
                  <div className="flex justify-between text-xs-type mb-1.5">
                    <span className="text-content">{domain}</span>
                    <span className="font-semibold text-content">{correct}/{total} ({pct}%)</span>
                  </div>
                  <div className="h-2.5 bg-surface-2 rounded-full overflow-hidden border border-edge">
                    <div
                      className={`h-full rounded-full transition-all ${pct >= 65 ? "bg-correct" : "bg-wrong"}`}
                      style={{ width: `${pct}%`, backgroundColor: pct >= 65 ? "var(--color-ok)" : "var(--color-err)" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Question Review */}
        <div className="bg-canvas border border-edge rounded-lg overflow-hidden">
          <div className="font-bold text-content text-sm-type px-5 py-4 border-b border-edge">
            {language === "ar" ? "مراجعة الأسئلة" : "Question Review"}
          </div>
          <div className="divide-y divide-edge">
            {qResults.map((r: ExamResult, idx: number) => {
              const wrongMap = isRtl
                ? parseWrongExplanations(r.wrongExplanationAr)
                : parseWrongExplanations(r.wrongExplanationEn);

              return (
                <div key={r.questionId} className="p-4">
                  <button
                    className="w-full text-left flex items-start gap-3"
                    onClick={() => setExpanded(expanded === idx ? null : idx)}
                  >
                    <span className={`mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs-type font-bold text-inverse ${
                      r.isCorrect ? "bg-correct" : r.selectedAnswer ? "bg-wrong" : "bg-edge-2"
                    }`}
                    style={{ backgroundColor: r.isCorrect ? "var(--color-ok)" : r.selectedAnswer ? "var(--color-err)" : "var(--color-border-2)" }}
                    >
                      {r.isCorrect ? "✓" : r.selectedAnswer ? "✗" : "—"}
                    </span>
                    <span className="text-sm-type text-content flex-1" dir={isRtl ? "rtl" : "ltr"}>
                      {idx + 1}. {isRtl ? r.questionTextAr : r.questionTextEn}
                    </span>
                    <span className="text-muted text-xs-type shrink-0 mt-1">{expanded === idx ? "▲" : "▼"}</span>
                  </button>

                  {expanded === idx && (
                    <div className="mt-3 ml-0 sm:ml-9 space-y-2" dir={isRtl ? "rtl" : "ltr"}>
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
                            <div className={`px-3 py-2.5 rounded border text-xs-type ${
                              isCorrectOption
                                ? "bg-correct border-correct text-correct"
                                : isSelected
                                ? "bg-wrong border-wrong text-wrong"
                                : "bg-surface border-edge text-muted"
                            }`}
                            style={
                              isCorrectOption
                                ? { backgroundColor: "var(--color-ok-bg)", borderColor: "var(--color-ok)", color: "var(--color-ok)" }
                                : isSelected
                                ? { backgroundColor: "var(--color-err-bg)", borderColor: "var(--color-err)", color: "var(--color-err)" }
                                : undefined
                            }
                            >
                              <span className="font-semibold">{key}.</span> {textMap[key]}
                              {isCorrectOption && (
                                <span className="ml-2 font-bold" style={{ color: "var(--color-ok)" }}>✓</span>
                              )}
                              {isSelected && !isCorrectOption && (
                                <span className="ml-2 font-bold" style={{ color: "var(--color-err)" }}>✗</span>
                              )}
                            </div>
                            {isCorrectOption && (
                              <div className="mt-1 px-3 py-2 text-xs-type rounded-r border-l-2 bg-surface"
                                style={{ borderLeftColor: "var(--color-ok)", color: "var(--color-ok)" }}>
                                <span className="font-semibold">{isRtl ? "لماذا صحيح: " : "Why correct: "}</span>
                                <span className="text-content">{isRtl ? r.explanationAr : r.explanationEn}</span>
                              </div>
                            )}
                            {!isCorrectOption && wrongExpl && (
                              <div className={`mt-1 px-3 py-2 text-xs-type rounded-r border-l-2 bg-surface`}
                                style={{ borderLeftColor: isSelected ? "var(--color-err)" : "var(--color-border)", color: isSelected ? "var(--color-err)" : "var(--color-text-2)" }}>
                                <span className="font-semibold">{isRtl ? "لماذا خطأ: " : "Why wrong: "}</span>
                                <span className="text-content">{wrongExpl}</span>
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
        <div className="flex justify-center pb-2">
          <button
            onClick={handleRetake}
            className="px-8 py-2.5 bg-interact text-inverse rounded hover:bg-interact-h font-semibold text-sm-type transition-colors"
          >
            {language === "ar" ? "بدء اختبار جديد" : "Start New Exam"}
          </button>
        </div>
      </div>
    </div>
  );
}
