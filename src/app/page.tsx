"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useExamStore } from "@/store/examStore";
import type { ExamQuestion } from "@/lib/types";

const PMP_COUNTS = [10, 20, 40, 60, 100, 120, 150, 180];
const UNDRAW_COUNT = 49;
const ANDREW_COUNT = 200;
const YASSINE_COUNT = 180;

export default function HomePage() {
  const [pmpCount, setPmpCount] = useState(40);
  const [loading, setLoading] = useState<"pmp" | "undraw" | "andrew-ultra" | "yassine" | "kill-mistakes" | null>(null);
  const [error, setError] = useState("");
  const [mistakeCount, setMistakeCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/profile/mistakes")
      .then((r) => r.json())
      .then((d) => setMistakeCount(d.count ?? 0))
      .catch(() => setMistakeCount(0));
  }, []);
  const startExam = useExamStore((s) => s.startExam);
  const router = useRouter();

  async function handleStart(examSet: "pmp" | "undraw" | "andrew-ultra" | "yassine" | "kill-mistakes") {
    setLoading(examSet);
    setError("");
    try {
      let count: number;
      let url: string;
      if (examSet === "undraw") {
        count = UNDRAW_COUNT;
        url = `/api/exam/start?examSet=undraw`;
      } else if (examSet === "andrew-ultra") {
        count = ANDREW_COUNT;
        url = `/api/exam/start?examSet=andrew-ultra`;
      } else if (examSet === "yassine") {
        count = YASSINE_COUNT;
        url = `/api/exam/start?examSet=yassine`;
      } else if (examSet === "kill-mistakes") {
        count = mistakeCount ?? 0;
        url = `/api/exam/start?examSet=kill-mistakes`;
      } else {
        count = pmpCount;
        url = `/api/exam/start?count=${pmpCount}&examSet=pmp`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load questions");
      const questions: ExamQuestion[] = await res.json();
      if (questions.length === 0) throw new Error("No questions available");

      const durationSec = count * 77;
      startExam(questions, durationSec, examSet);
      router.push("/exam");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error starting exam");
    } finally {
      setLoading(null);
    }
  }

  const pmpDurationMin = Math.round((pmpCount * 77) / 60);
  const undrawDurationMin = Math.round((UNDRAW_COUNT * 77) / 60);
  const andrewDurationMin = Math.round((ANDREW_COUNT * 77) / 60);
  const yassineDurationMin = Math.round((YASSINE_COUNT * 77) / 60);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-6">

        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 tracking-wide">PMP Exam Simulator</h1>
          <p className="text-gray-500 text-2xl mt-2">Project Management Professional</p>
        </div>

        {/* Exam cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* PMP Exam Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gray-800 text-white p-6 text-center">
              <h2 className="text-3xl font-bold">PMP Exam</h2>
              <p className="text-gray-300 text-xl mt-1">Classic Question Bank</p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-2xl font-semibold text-gray-700 mb-3">
                  Number of Questions
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PMP_COUNTS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setPmpCount(n)}
                      className={`py-3 rounded-xl border-2 text-xl font-semibold transition-all shadow-sm hover:shadow-md ${
                        pmpCount === n
                          ? "bg-blue-600 text-white border-blue-600 shadow-md"
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-xl text-gray-600 space-y-2 border border-gray-200">
                <div className="flex justify-between">
                  <span>Questions:</span>
                  <span className="font-semibold text-gray-800">{pmpCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-semibold text-gray-800">{pmpDurationMin} min</span>
                </div>
                <div className="flex justify-between">
                  <span>Passing Score:</span>
                  <span className="font-semibold text-gray-800">65%</span>
                </div>
              </div>
              <button
                onClick={() => handleStart("pmp")}
                disabled={loading !== null}
                className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-bold text-2xl transition-all shadow-md hover:shadow-lg"
              >
                {loading === "pmp" ? "Loading..." : "Start PMP Exam"}
              </button>
            </div>
          </div>

          {/* UNDRAW Exam Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-indigo-700 text-white p-6 text-center">
              <h2 className="text-3xl font-bold">UNDRAW Exam</h2>
              <p className="text-indigo-200 text-xl mt-1">PMP Mindset Practice</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-indigo-50 rounded-xl p-4 text-xl text-gray-600 space-y-2 border border-indigo-200">
                <div className="flex justify-between">
                  <span>Questions:</span>
                  <span className="font-semibold text-gray-800">{UNDRAW_COUNT} (fixed set)</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-semibold text-gray-800">{undrawDurationMin} min</span>
                </div>
                <div className="flex justify-between">
                  <span>Passing Score:</span>
                  <span className="font-semibold text-gray-800">65%</span>
                </div>
                <div className="flex justify-between">
                  <span>Answer Explanations:</span>
                  <span className="font-semibold text-indigo-700">Per option ✓</span>
                </div>
              </div>
              <p className="text-gray-500 text-xl">
                A fixed set of 49 scenario-based questions with detailed explanations for every answer choice.
              </p>
              <button
                onClick={() => handleStart("undraw")}
                disabled={loading !== null}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-bold text-2xl transition-all shadow-md hover:shadow-lg"
              >
                {loading === "undraw" ? "Loading..." : "Start UNDRAW Exam"}
              </button>
            </div>
          </div>

          {/* Andrew 200 Ultra Hard Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-rose-800 text-white p-6 text-center">
              <h2 className="text-2xl font-bold leading-tight">Andrew 200</h2>
              <p className="text-rose-200 text-xl mt-1">Ultra Hard Questions</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-rose-50 rounded-xl p-4 text-xl text-gray-600 space-y-2 border border-rose-200">
                <div className="flex justify-between">
                  <span>Questions:</span>
                  <span className="font-semibold text-gray-800">{ANDREW_COUNT} (fixed set)</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-semibold text-gray-800">{andrewDurationMin} min</span>
                </div>
                <div className="flex justify-between">
                  <span>Passing Score:</span>
                  <span className="font-semibold text-gray-800">65%</span>
                </div>
                <div className="flex justify-between">
                  <span>Answer Explanations:</span>
                  <span className="font-semibold text-rose-700">Per option ✓</span>
                </div>
              </div>
              <p className="text-gray-500 text-xl">
                200 ultra-hard scenario questions in fixed order. Pause and resume anytime.
              </p>
              <button
                onClick={() => handleStart("andrew-ultra")}
                disabled={loading !== null}
                className="w-full py-4 bg-rose-700 text-white rounded-xl hover:bg-rose-800 disabled:opacity-50 font-bold text-2xl transition-all shadow-md hover:shadow-lg"
              >
                {loading === "andrew-ultra" ? "Loading..." : "Start Andrew 200"}
              </button>
            </div>
          </div>
          {/* Yassine Exam Set Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-emerald-700 text-white p-6 text-center">
              <h2 className="text-3xl font-bold">Yassine Exam Set</h2>
              <p className="text-emerald-200 text-xl mt-1">Full Real Exam Simulation</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-emerald-50 rounded-xl p-4 text-xl text-gray-600 space-y-2 border border-emerald-200">
                <div className="flex justify-between">
                  <span>Questions:</span>
                  <span className="font-semibold text-gray-800">{YASSINE_COUNT} (fixed set)</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-semibold text-gray-800">{yassineDurationMin} min</span>
                </div>
                <div className="flex justify-between">
                  <span>Passing Score:</span>
                  <span className="font-semibold text-gray-800">65%</span>
                </div>
                <div className="flex justify-between">
                  <span>Format:</span>
                  <span className="font-semibold text-emerald-700">Real exam replica ✓</span>
                </div>
              </div>
              <p className="text-gray-500 text-xl">
                180 questions in fixed order, mirroring the real PMP exam. Pause and resume anytime.
              </p>
              <button
                onClick={() => handleStart("yassine")}
                disabled={loading !== null}
                className="w-full py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 font-bold text-2xl transition-all shadow-md hover:shadow-lg"
              >
                {loading === "yassine" ? "Loading..." : "Start Yassine Exam"}
              </button>
            </div>
          </div>
        </div>

        {/* Kill Mistakes */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-red-700 text-white px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Kill Mistakes Exam</h2>
              <p className="text-red-200 text-xl mt-0.5">Practice every question you got wrong</p>
            </div>
            <div className="text-5xl font-black text-white/90">
              {mistakeCount === null ? "…" : mistakeCount}
            </div>
          </div>
          <div className="px-6 py-5 flex items-center justify-between gap-4">
            <p className="text-xl text-gray-600">
              {mistakeCount === null
                ? "Loading..."
                : mistakeCount === 0
                ? "No wrong answers yet. Complete an exam to start tracking your mistakes."
                : `${mistakeCount} unique question${mistakeCount !== 1 ? "s" : ""} answered incorrectly — time to fix them.`}
            </p>
            <button
              onClick={() => handleStart("kill-mistakes")}
              disabled={!mistakeCount || loading !== null}
              className="shrink-0 px-8 py-3 bg-red-600 text-white text-xl font-bold rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
            >
              {loading === "kill-mistakes" ? "Loading..." : "Start →"}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-600 text-2xl text-center">{error}</p>
        )}

        <div className="flex justify-center gap-8">
          <a href="/profile" className="text-xl text-blue-500 hover:text-blue-700 font-semibold underline">
            My Profile & History
          </a>
          <a href="/admin" className="text-xl text-gray-400 hover:text-gray-600 underline">
            Admin Panel
          </a>
        </div>
      </div>
    </div>
  );
}
