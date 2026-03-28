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
  "andrew-ultra": "Andrew 200 Ultra Hard",
  "yassine": "Yassine Exam Set",
  "kill-mistakes": "Kill Mistakes Exam",
};

function examName(set: string) {
  return EXAM_NAMES[set] ?? set;
}

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
    if (!confirm("Reset all exam history and Kill Mistakes data? This cannot be undone.")) return;
    setResetting(true);
    try {
      await fetch("/api/profile/reset", { method: "DELETE" });
      setHistory([]);
      setMistakeCount(0);
    } finally {
      setResetting(false);
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
      const durationSec = questions.length * 77;
      startExam(questions, durationSec, "kill-mistakes");
      router.push("/exam");
    } catch (e) {
      setKillError(e instanceof Error ? e.message : "Error");
      setStartingKill(false);
    }
  }

  // Stats
  const totalExams = history.length;
  const avgScore = totalExams > 0
    ? Math.round(history.reduce((s, a) => s + a.score, 0) / totalExams)
    : 0;
  const bestScore = totalExams > 0
    ? Math.max(...history.map((a) => a.score))
    : 0;
  const totalAnswered = history.reduce((s, a) => s + a.totalQuestions, 0);
  const passCount = history.filter((a) => a.passed).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            disabled={resetting}
            className="px-5 py-2.5 text-xl font-medium bg-white text-red-600 border-2 border-red-300 rounded-xl hover:bg-red-50 disabled:opacity-50 transition-all"
          >
            {resetting ? "Resetting..." : "Reset History"}
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2.5 text-xl font-medium bg-white text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
          >
            ← Home
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Exams", value: totalExams },
            { label: "Avg Score", value: `${avgScore}%` },
            { label: "Best Score", value: `${bestScore}%` },
            { label: "Questions Answered", value: totalAnswered.toLocaleString() },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-2xl shadow-md p-5 text-center">
              <div className="text-3xl font-bold text-gray-800">{value}</div>
              <div className="text-xl text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Kill Mistakes */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="bg-red-700 text-white px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Kill Mistakes Exam</h2>
              <p className="text-red-200 text-xl mt-0.5">Practice every question you got wrong</p>
            </div>
            <div className="text-5xl font-black text-white/90">{mistakeCount}</div>
          </div>
          <div className="px-6 py-5 flex items-center justify-between gap-4">
            <p className="text-xl text-gray-600">
              {mistakeCount === 0
                ? "No wrong answers recorded yet. Complete an exam to start tracking."
                : `${mistakeCount} unique question${mistakeCount !== 1 ? "s" : ""} you have answered incorrectly across all exams.`}
            </p>
            <button
              onClick={handleStartKillMistakes}
              disabled={mistakeCount === 0 || startingKill}
              className="shrink-0 px-8 py-3 bg-red-600 text-white text-xl font-bold rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
            >
              {startingKill ? "Loading..." : "Start →"}
            </button>
          </div>
          {killError && <p className="px-6 pb-4 text-red-600 text-xl">{killError}</p>}
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Exam History</h2>
            {totalExams > 0 && (
              <span className="text-xl text-gray-500">{passCount}/{totalExams} passed</span>
            )}
          </div>

          {loadingHistory ? (
            <div className="p-8 text-center text-gray-500 text-xl">Loading...</div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xl">
              No exams taken yet. Go take one!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {["Date", "Exam Set", "Score", "Result", "Correct"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xl font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-xl text-gray-600 whitespace-nowrap">{formatDate(a.takenAt)}</td>
                      <td className="px-5 py-4 text-xl font-medium text-gray-800">{examName(a.examSet)}</td>
                      <td className="px-5 py-4">
                        <span className={`text-2xl font-bold ${a.score >= 65 ? "text-green-600" : "text-red-500"}`}>
                          {a.score}%
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xl font-semibold ${
                          a.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {a.passed ? "✓ Pass" : "✗ Fail"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xl text-gray-600">
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
    </div>
  );
}
