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
    <div className="min-h-screen bg-canvas">

      {/* Page header */}
      <header className="bg-primary border-b border-primary">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-inverse tracking-wide">PMP Exam Simulator</h1>
            <p className="text-[13px] text-inverse/70 mt-0.5">Project Management Professional</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/profile" className="text-[13px] text-inverse/80 hover:text-inverse transition-colors">
              My Profile
            </a>
            <span className="text-inverse/30">|</span>
            <a href="/admin" className="text-[13px] text-inverse/50 hover:text-inverse/80 transition-colors">
              Admin
            </a>
            <ThemeToggle className="border-white/20 text-white/70 hover:bg-white/10 hover:text-white ml-1" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Exam cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* PMP Classic */}
          <div className="bg-canvas border border-edge rounded-lg overflow-hidden shadow-sm">
            <div className="bg-primary px-5 py-4">
              <h2 className="text-[17px] font-bold text-inverse">PMP Exam</h2>
              <p className="text-[13px] text-inverse/70 mt-0.5">Classic Question Bank</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-muted uppercase tracking-wide mb-2">
                  Number of Questions
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {PMP_COUNTS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setPmpCount(n)}
                      className={`py-2 rounded border text-[14px] font-semibold transition-colors ${
                        pmpCount === n
                          ? "bg-primary text-inverse border-primary"
                          : "bg-canvas text-content border-edge hover:border-edge-2"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-surface rounded-md p-3 text-[13px] text-content space-y-1.5 border border-edge">
                <div className="flex justify-between">
                  <span className="text-muted">Questions</span>
                  <span className="font-semibold">{pmpCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Duration</span>
                  <span className="font-semibold">{pmpDurationMin} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Passing Score</span>
                  <span className="font-semibold">65%</span>
                </div>
              </div>
              <button
                onClick={() => handleStart("pmp")}
                disabled={loading !== null}
                className="w-full py-2.5 bg-interact text-inverse rounded hover:bg-interact-h disabled:opacity-50 font-semibold text-[15px] transition-colors"
              >
                {loading === "pmp" ? "Loading..." : "Start Exam"}
              </button>
            </div>
          </div>

          {/* UNDRAW */}
          <div className="bg-canvas border border-edge rounded-lg overflow-hidden shadow-sm">
            <div className="bg-primary px-5 py-4">
              <h2 className="text-[17px] font-bold text-inverse">UNDRAW Exam</h2>
              <p className="text-[13px] text-inverse/70 mt-0.5">PMP Mindset Practice</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-surface rounded-md p-3 text-[13px] text-content space-y-1.5 border border-edge">
                <div className="flex justify-between">
                  <span className="text-muted">Questions</span>
                  <span className="font-semibold">{UNDRAW_COUNT} (fixed set)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Duration</span>
                  <span className="font-semibold">{undrawDurationMin} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Passing Score</span>
                  <span className="font-semibold">65%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Explanations</span>
                  <span className="font-semibold text-correct">Per option</span>
                </div>
              </div>
              <p className="text-[13px] text-muted leading-relaxed">
                49 scenario-based questions with detailed explanations for every answer choice.
              </p>
              <button
                onClick={() => handleStart("undraw")}
                disabled={loading !== null}
                className="w-full py-2.5 bg-interact text-inverse rounded hover:bg-interact-h disabled:opacity-50 font-semibold text-[15px] transition-colors"
              >
                {loading === "undraw" ? "Loading..." : "Start Exam"}
              </button>
            </div>
          </div>

          {/* Andrew 200 */}
          <div className="bg-canvas border border-edge rounded-lg overflow-hidden shadow-sm">
            <div className="bg-primary px-5 py-4">
              <h2 className="text-[17px] font-bold text-inverse">Andrew 200</h2>
              <p className="text-[13px] text-inverse/70 mt-0.5">Ultra Hard Questions</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-surface rounded-md p-3 text-[13px] text-content space-y-1.5 border border-edge">
                <div className="flex justify-between">
                  <span className="text-muted">Questions</span>
                  <span className="font-semibold">{ANDREW_COUNT} (fixed set)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Duration</span>
                  <span className="font-semibold">{andrewDurationMin} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Passing Score</span>
                  <span className="font-semibold">65%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Explanations</span>
                  <span className="font-semibold text-correct">Per option</span>
                </div>
              </div>
              <p className="text-[13px] text-muted leading-relaxed">
                200 ultra-hard scenario questions in fixed order. Pause and resume anytime.
              </p>
              <button
                onClick={() => handleStart("andrew-ultra")}
                disabled={loading !== null}
                className="w-full py-2.5 bg-interact text-inverse rounded hover:bg-interact-h disabled:opacity-50 font-semibold text-[15px] transition-colors"
              >
                {loading === "andrew-ultra" ? "Loading..." : "Start Exam"}
              </button>
            </div>
          </div>

          {/* Yassine */}
          <div className="bg-canvas border border-edge rounded-lg overflow-hidden shadow-sm">
            <div className="bg-primary px-5 py-4">
              <h2 className="text-[17px] font-bold text-inverse">Yassine Exam Set</h2>
              <p className="text-[13px] text-inverse/70 mt-0.5">Full Real Exam Simulation</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-surface rounded-md p-3 text-[13px] text-content space-y-1.5 border border-edge">
                <div className="flex justify-between">
                  <span className="text-muted">Questions</span>
                  <span className="font-semibold">{YASSINE_COUNT} (fixed set)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Duration</span>
                  <span className="font-semibold">{yassineDurationMin} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Passing Score</span>
                  <span className="font-semibold">65%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Format</span>
                  <span className="font-semibold text-correct">Real exam replica</span>
                </div>
              </div>
              <p className="text-[13px] text-muted leading-relaxed">
                180 questions in fixed order, mirroring the real PMP exam. Pause and resume anytime.
              </p>
              <button
                onClick={() => handleStart("yassine")}
                disabled={loading !== null}
                className="w-full py-2.5 bg-interact text-inverse rounded hover:bg-interact-h disabled:opacity-50 font-semibold text-[15px] transition-colors"
              >
                {loading === "yassine" ? "Loading..." : "Start Exam"}
              </button>
            </div>
          </div>
        </div>

        {/* Kill Mistakes */}
        <div className="bg-canvas border border-edge rounded-lg overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-edge flex items-center justify-between bg-surface">
            <div>
              <h2 className="text-[15px] font-bold text-content">Kill Mistakes Exam</h2>
              <p className="text-[13px] text-muted mt-0.5">Practice every question you answered incorrectly</p>
            </div>
            <div className="text-3xl font-black text-content/80">
              {mistakeCount === null ? "—" : mistakeCount}
            </div>
          </div>
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <p className="text-[14px] text-muted">
              {mistakeCount === null
                ? "Loading..."
                : mistakeCount === 0
                ? "No wrong answers yet. Complete an exam to start tracking your mistakes."
                : `${mistakeCount} unique question${mistakeCount !== 1 ? "s" : ""} answered incorrectly — time to fix them.`}
            </p>
            <button
              onClick={() => handleStart("kill-mistakes")}
              disabled={!mistakeCount || loading !== null}
              className="shrink-0 px-6 py-2.5 bg-err text-inverse text-[14px] font-semibold rounded hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {loading === "kill-mistakes" ? "Loading..." : "Start"}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-wrong text-[14px] text-center">{error}</p>
        )}

      </main>
    </div>
  );
}
