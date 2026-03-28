"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useExamStore } from "@/store/examStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { ExamQuestion } from "@/lib/types";

const PMP_COUNTS = [10, 20, 40, 60, 100, 120, 150, 180];
const UNDRAW_COUNT = 49;
const ANDREW_COUNT = 200;
const YASSINE_COUNT = 180;
const HELENA_COUNT = 177;

export default function HomePage() {
  const [pmpCount, setPmpCount] = useState(40);
  const [loading, setLoading] = useState<"pmp" | "undraw" | "andrew-ultra" | "yassine" | "kill-mistakes" | "helena" | null>(null);
  const [error, setError] = useState<{ set: string; msg: string } | null>(null);
  const [mistakeCount, setMistakeCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/profile/mistakes")
      .then((r) => r.json())
      .then((d) => setMistakeCount(d.count ?? 0))
      .catch(() => setMistakeCount(0));
  }, []);

  const startExam = useExamStore((s) => s.startExam);
  const router = useRouter();

  async function handleStart(examSet: "pmp" | "undraw" | "andrew-ultra" | "yassine" | "kill-mistakes" | "helena") {
    setLoading(examSet);
    setError(null);
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
      } else if (examSet === "helena") {
        count = HELENA_COUNT;
        url = `/api/exam/start?examSet=helena`;
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
      setError({ set: examSet, msg: e instanceof Error ? e.message : "Error starting exam" });
    } finally {
      setLoading(null);
    }
  }

  const pmpDurationMin = Math.round((pmpCount * 77) / 60);
  const undrawDurationMin = Math.round((UNDRAW_COUNT * 77) / 60);
  const andrewDurationMin = Math.round((ANDREW_COUNT * 77) / 60);
  const yassineDurationMin = Math.round((YASSINE_COUNT * 77) / 60);
  const helenaDurationMin = Math.round((HELENA_COUNT * 77) / 60);

  return (
    <div className="min-h-screen bg-canvas" dir="ltr">

      {/* Page header */}
      <header className="bg-primary border-b border-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide drop-shadow-sm">PMP Exam Simulator</h1>
            <p className="text-sm text-white/90 mt-0.5">Project Management Professional</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/profile" className="text-xs-type text-white/90 hover:text-white transition-colors">
              My Profile
            </a>
            <span className="text-white/40">|</span>
            <a href="/admin" className="text-xs-type text-white/70 hover:text-white transition-colors">
              Admin
            </a>
            <ThemeToggle className="border-white/20 text-white/70 hover:bg-white/10 hover:text-white ml-1" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── PRIMARY: PMP Classic ─────────────────────────────────────── */}
        <div className="bg-canvas border border-edge rounded-lg overflow-hidden shadow-sm flex flex-col" style={{ borderLeftWidth: "4px", borderLeftColor: "var(--color-interact)" }}>
          <div className="px-4 py-4 border-b border-edge bg-surface">
            <h2 className="text-sm-type font-bold text-content">PMP Exam</h2>
            <p className="text-xs-type text-muted mt-0.5">
              The core question bank. Choose your question count, set your session length, and practice at your own pace.
            </p>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <label className="block text-label-caps text-muted mb-1">Number of Questions</label>
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex flex-wrap gap-2 flex-grow">
                {PMP_COUNTS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPmpCount(n)}
                    className={`px-4 py-1.5 rounded-md border text-xs-type font-semibold transition-colors ${
                      pmpCount === n
                        ? "bg-primary text-white border-primary"
                        : "bg-surface text-content border-edge hover:border-edge-2"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="w-full sm:w-44 shrink-0">
                <button
                  onClick={() => handleStart("pmp")}
                  disabled={loading !== null}
                  className="w-full py-2.5 bg-interact text-white rounded-lg hover:bg-interact-h disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs-type transition-colors"
                >
                  {loading === "pmp" ? "Loading..." : "Start Exam"}
                </button>
                {error?.set === "pmp" && (
                  <p className="mt-2 text-wrong text-xs-type text-center">{error.msg}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── SECONDARY: Specialty exam sets ──────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* UNDRAW */}
          <div className="bg-canvas border border-edge rounded-lg overflow-hidden shadow-sm flex flex-col" style={{ borderLeftWidth: "4px", borderLeftColor: "var(--color-interact)" }}>
            <div className="px-4 py-4 border-b border-edge bg-surface">
              <h2 className="text-sm-type font-bold text-content">UNDRAW Exam</h2>
              <p className="text-xs-type text-muted mt-0.5">PMP Mindset Practice</p>
            </div>
            <div className="p-4 space-y-3 flex flex-col grow">
              <div className="space-y-1.5 text-xs-type border border-edge rounded-md p-3 bg-surface">
                <div className="flex justify-between">
                  <span className="text-muted">Questions</span>
                  <span className="font-semibold">{UNDRAW_COUNT} (fixed)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Duration</span>
                  <span className="font-semibold tabular-nums">{undrawDurationMin} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Explanations</span>
                  <span className="font-semibold text-interact">Per option</span>
                </div>
              </div>
              <p className="text-xs-type text-muted leading-relaxed">
                49 scenario-based questions with detailed explanations for every answer choice.
              </p>
              <button
                onClick={() => handleStart("undraw")}
                disabled={loading !== null}
                className="w-full mt-auto py-2.5 bg-interact text-white rounded-lg hover:bg-interact-h disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs-type transition-colors"
              >
                {loading === "undraw" ? "Loading..." : "Start Exam"}
              </button>
              {error?.set === "undraw" && (
                <p className="text-wrong text-xs-type">{error.msg}</p>
              )}
            </div>
          </div>

          {/* Andrew 200 */}
          <div className="bg-canvas border border-edge rounded-lg overflow-hidden shadow-sm flex flex-col" style={{ borderLeftWidth: "4px", borderLeftColor: "var(--color-interact)" }}>
            <div className="px-4 py-4 border-b border-edge bg-surface">
              <h2 className="text-sm-type font-bold text-content">Andrew 200</h2>
              <p className="text-xs-type text-muted mt-0.5">Ultra Hard Questions</p>
            </div>
            <div className="p-4 space-y-3 flex flex-col grow">
              <div className="space-y-1.5 text-xs-type border border-edge rounded-md p-3 bg-surface">
                <div className="flex justify-between">
                  <span className="text-muted">Questions</span>
                  <span className="font-semibold">{ANDREW_COUNT} (fixed)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Duration</span>
                  <span className="font-semibold tabular-nums">{andrewDurationMin} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Explanations</span>
                  <span className="font-semibold text-interact">Per option</span>
                </div>
              </div>
              <p className="text-xs-type text-muted leading-relaxed">
                200 ultra-hard scenario questions in fixed order. Pause and resume anytime.
              </p>
              <button
                onClick={() => handleStart("andrew-ultra")}
                disabled={loading !== null}
                className="w-full mt-auto py-2.5 bg-interact text-white rounded-lg hover:bg-interact-h disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs-type transition-colors"
              >
                {loading === "andrew-ultra" ? "Loading..." : "Start Exam"}
              </button>
              {error?.set === "andrew-ultra" && (
                <p className="text-wrong text-xs-type">{error.msg}</p>
              )}
            </div>
          </div>

          {/* Yassine */}
          <div className="bg-canvas border border-edge rounded-lg overflow-hidden shadow-sm flex flex-col" style={{ borderLeftWidth: "4px", borderLeftColor: "var(--color-interact)" }}>
            <div className="px-4 py-4 border-b border-edge bg-surface">
              <h2 className="text-sm-type font-bold text-content">Yassine Exam Set</h2>
              <p className="text-xs-type text-muted mt-0.5">Full Real Exam Simulation</p>
            </div>
            <div className="p-4 space-y-3 flex flex-col grow">
              <div className="space-y-1.5 text-xs-type border border-edge rounded-md p-3 bg-surface">
                <div className="flex justify-between">
                  <span className="text-muted">Questions</span>
                  <span className="font-semibold">{YASSINE_COUNT} (fixed)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Duration</span>
                  <span className="font-semibold tabular-nums">{yassineDurationMin} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Format</span>
                  <span className="font-semibold text-interact">Real exam replica</span>
                </div>
              </div>
              <p className="text-xs-type text-muted leading-relaxed">
                180 questions in fixed order, mirroring the real PMP exam. Pause and resume anytime.
              </p>
              <button
                onClick={() => handleStart("yassine")}
                disabled={loading !== null}
                className="w-full mt-auto py-2.5 bg-interact text-white rounded-lg hover:bg-interact-h disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs-type transition-colors"
              >
                {loading === "yassine" ? "Loading..." : "Start Exam"}
              </button>
              {error?.set === "yassine" && (
                <p className="text-wrong text-xs-type">{error.msg}</p>
              )}
            </div>
          </div>

          {/* Helena Liu */}
          <div className="bg-canvas border border-edge rounded-lg overflow-hidden shadow-sm flex flex-col" style={{ borderLeftWidth: "4px", borderLeftColor: "var(--color-interact)" }}>
            <div className="px-4 py-4 border-b border-edge bg-surface">
              <h2 className="text-sm-type font-bold text-content">Helena Liu Exam Set</h2>
              <p className="text-xs-type text-muted mt-0.5">Community Practice Set</p>
            </div>
            <div className="p-4 space-y-3 flex flex-col grow">
              <div className="space-y-1.5 text-xs-type border border-edge rounded-md p-3 bg-surface">
                <div className="flex justify-between">
                  <span className="text-muted">Questions</span>
                  <span className="font-semibold">{HELENA_COUNT} (fixed)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Duration</span>
                  <span className="font-semibold tabular-nums">{helenaDurationMin} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Format</span>
                  <span className="font-semibold text-interact">Full simulation</span>
                </div>
              </div>
              <p className="text-xs-type text-muted leading-relaxed">
                177 scenario questions targeting process and people domains to refine your PMP readiness.
              </p>
              <button
                onClick={() => handleStart("helena")}
                disabled={loading !== null}
                className="w-full mt-auto py-2.5 bg-interact text-white rounded-lg hover:bg-interact-h disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs-type transition-colors"
              >
                {loading === "helena" ? "Loading..." : "Start Exam"}
              </button>
              {error?.set === "helena" && (
                <p className="text-wrong text-xs-type">{error.msg}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Kill Mistakes ──────────────────────────────────────────── */}
        <div className="bg-canvas border border-edge rounded-lg overflow-hidden shadow-sm flex flex-col" style={{ borderLeftWidth: "4px", borderLeftColor: "var(--color-err)" }}>
          <div className="px-5 py-4 border-b border-edge flex items-center justify-between bg-surface">
            <div>
              <h2 className="text-sm-type font-bold text-content">Kill Mistakes Exam</h2>
              <p className="text-xs-type text-muted mt-0.5">Practice every question you answered incorrectly</p>
            </div>
            <div className="text-stat font-black text-content/80 tabular-nums">
              {mistakeCount === null ? "—" : mistakeCount}
            </div>
          </div>
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <p className="text-xs-type text-muted">
              {mistakeCount === null
                ? "Loading..."
                : mistakeCount === 0
                ? "No wrong answers yet. Complete an exam to start tracking your mistakes."
                : `${mistakeCount} unique question${mistakeCount !== 1 ? "s" : ""} answered incorrectly — time to fix them.`}
            </p>
            <div className="w-full sm:w-44 shrink-0">
              <button
                onClick={() => handleStart("kill-mistakes")}
                disabled={!mistakeCount || loading !== null}
                className="w-full py-2.5 bg-err text-white text-xs-type font-semibold rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {loading === "kill-mistakes" ? "Loading..." : "Start Exam"}
              </button>
              {error?.set === "kill-mistakes" && (
                <p className="mt-2 text-wrong text-xs-type text-center">{error.msg}</p>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-xs-type text-muted pb-2">
          All exams require 65% to pass.
        </p>

      </main>
    </div>
  );
}
