"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useExamStore } from "@/store/examStore";
import type { ExamQuestion } from "@/lib/types";

interface AttemptSummary {
  id: number;
  examSet: string;
  takenAt: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  passed: boolean;
}

const EXAM_NAMES: Record<string, string> = {
  "pmp": "PMP Exam",
  "undraw": "UNDRAW Exam",
  "andrew-ultra": "Andrew 200",
  "yassine": "Yassine Exam",
  "kill-mistakes": "Kill Mistakes",
};

function examName(set: string) { return EXAM_NAMES[set] ?? set; }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const startExam = useExamStore((s) => s.startExam);

  const [history, setHistory] = useState<AttemptSummary[]>([]);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [startingKill, setStartingKill] = useState(false);
  const [killError, setKillError] = useState("");
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/profile/history").then((r) => r.json()),
      fetch("/api/profile/mistakes").then((r) => r.json()),
    ]).then(([h, m]) => {
      setHistory(Array.isArray(h) ? h : []);
      setMistakeCount(typeof m?.count === "number" ? m.count : 0);
      setLoadingHistory(false);
    }).catch(() => setLoadingHistory(false));
  }, []);

  async function handleReset() {
    setResetting(true);
    try {
      await fetch("/api/profile/reset", { method: "DELETE" });
      setHistory([]);
      setMistakeCount(0);
    } finally {
      setResetting(false);
      setShowResetConfirm(false);
    }
  }

  async function handleStartKillMistakes() {
    setStartingKill(true);
    setKillError("");
    try {
      const res = await fetch("/api/exam/start?examSet=kill-mistakes");
      if (!res.ok) throw new Error("Failed to load questions");
      const questions: ExamQuestion[] = await res.json();
      if (questions.length === 0) throw new Error("No wrong questions found");
      startExam(questions, questions.length * 77, "kill-mistakes");
      router.push("/exam");
    } catch (e) {
      setKillError(e instanceof Error ? e.message : "Error");
      setStartingKill(false);
    }
  }

  const totalExams = history.length;
  const avgScore = totalExams > 0 ? Math.round(history.reduce((s, a) => s + a.score, 0) / totalExams) : 0;
  const bestScore = totalExams > 0 ? Math.max(...history.map((a) => a.score)) : 0;
  const totalAnswered = history.reduce((s, a) => s + a.totalQuestions, 0);
  const passCount = history.filter((a) => a.passed).length;

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-primary border-b border-primary px-4 sm:px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-md-type font-bold text-inverse">My Profile</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={resetting || totalExams === 0}
            className="px-4 py-1.5 text-xs-type font-medium text-inverse/70 border border-white/20 rounded hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Reset History
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-1.5 text-xs-type font-medium text-inverse border border-white/30 rounded hover:bg-white/10 transition-colors"
          >
            ← Home
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Exams",        value: String(totalExams) },
            { label: "Average Score",      value: `${avgScore}%` },
            { label: "Best Score",         value: `${bestScore}%` },
            { label: "Questions Answered", value: totalAnswered.toLocaleString() },
          ].map(({ label, value }) => (
            <div key={label} className="bg-canvas border border-edge rounded-lg p-4">
              <div className="text-stat font-bold text-content tabular-nums">{value}</div>
              <div className="text-xs-type text-muted mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Kill Mistakes */}
        <div className="bg-canvas border border-edge rounded-lg overflow-hidden">
          <div className="border-b border-edge px-5 py-3 flex items-center justify-between bg-surface">
            <div>
              <h2 className="text-sm-type font-bold text-content">Kill Mistakes Exam</h2>
              <p className="text-xs-type text-muted mt-0.5">Practice every question you got wrong</p>
            </div>
            <div className="text-stat font-black text-content/70 tabular-nums">{mistakeCount}</div>
          </div>
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <p className="text-xs-type text-muted">
              {mistakeCount === 0
                ? "No wrong answers recorded yet. Complete an exam to start tracking."
                : `${mistakeCount} unique question${mistakeCount !== 1 ? "s" : ""} answered incorrectly across all exams.`}
            </p>
            <button
              onClick={handleStartKillMistakes}
              disabled={mistakeCount === 0 || startingKill}
              className="shrink-0 px-5 py-2 bg-err text-inverse text-xs-type font-semibold rounded hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {startingKill ? "Loading..." : "Start"}
            </button>
          </div>
          {killError && <p className="px-5 pb-4 text-wrong text-xs-type">{killError}</p>}
        </div>

        {/* History table */}
        <div className="bg-canvas border border-edge rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-edge flex items-center justify-between">
            <h2 className="text-sm-type font-bold text-content">Exam History</h2>
            {totalExams > 0 && (
              <span className="text-xs-type text-muted tabular-nums">{passCount}/{totalExams} passed</span>
            )}
          </div>

          {loadingHistory ? (
            <div className="p-8 text-center text-muted text-xs-type">Loading...</div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-muted text-xs-type">
              No exams taken yet. Go take one!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface border-b border-edge">
                  <tr>
                    {["Date", "Exam", "Score", "Result", "Correct"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-label-caps text-muted">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge">
                  {history.map((a) => (
                    <tr key={a.id} className="hover:bg-surface transition-colors">
                      <td className="px-4 py-3 text-xs-type text-muted whitespace-nowrap tabular-nums">{formatDate(a.takenAt)}</td>
                      <td className="px-4 py-3 text-xs-type font-medium text-content">{examName(a.examSet)}</td>
                      <td className="px-4 py-3">
                        <span
                          className="text-sm-type font-bold tabular-nums"
                          style={{ color: a.score >= 65 ? "var(--color-ok)" : "var(--color-err)" }}
                        >
                          {a.score}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs-type font-semibold"
                          style={
                            a.passed
                              ? { backgroundColor: "var(--color-ok-bg)", color: "var(--color-ok)" }
                              : { backgroundColor: "var(--color-err-bg)", color: "var(--color-err)" }
                          }
                        >
                          {a.passed ? "Pass" : "Fail"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs-type text-muted tabular-nums">
                        {a.correctAnswers}/{a.totalQuestions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Reset confirmation dialog — replaces window.confirm() */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="reset-title">
          <div className="bg-canvas border border-edge rounded-lg shadow-xl w-[400px] overflow-hidden">
            <div className="bg-surface border-b border-edge px-5 py-4">
              <h2 id="reset-title" className="font-semibold text-content text-sm-type">Reset History?</h2>
            </div>
            <div className="p-5">
              <p className="text-xs-type text-content leading-relaxed">
                This will permanently delete all exam history and Kill Mistakes data. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 px-5 pb-5 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-5 py-2 text-xs-type border border-edge rounded text-content hover:bg-surface font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="px-5 py-2 text-xs-type bg-err text-inverse rounded hover:opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {resetting ? "Resetting..." : "Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
