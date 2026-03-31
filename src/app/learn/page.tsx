"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

interface LearnStats {
  totalCards: number;
  dueToday: number;
  mastered: number;
  newCards: number;
}

export default function LearnPage() {
  const [stats, setStats] = useState<LearnStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [initLoading, setInitLoading] = useState(false);
  const [initMessage, setInitMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const res = await fetch("/api/learn/stats");
      const data = await res.json();
      setStats(data);
    } catch {
      setStats({ totalCards: 0, dueToday: 0, mastered: 0, newCards: 0 });
    } finally {
      setLoading(false);
    }
  }

  async function handleInit() {
    setInitLoading(true);
    setInitMessage("");
    try {
      const res = await fetch("/api/learn/init", { method: "POST" });
      const data = await res.json();
      setInitMessage(`Created ${data.created} cards`);
      await loadStats();
    } catch {
      setInitMessage("Failed to initialize");
    } finally {
      setInitLoading(false);
    }
  }

  const learning = stats
    ? stats.totalCards - stats.mastered - stats.newCards
    : 0;

  return (
    <div className="min-h-screen bg-canvas" dir="ltr">
      <header className="bg-primary border-b border-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide drop-shadow-sm">
              Learning Mode
            </h1>
            <p className="text-sm text-white/90 mt-0.5">
              Spaced repetition — learn by doing
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="text-xs-type text-white/90 hover:text-white transition-colors"
            >
              ← Back to Exams
            </a>
            <ThemeToggle className="border-white/20 text-white/70 hover:bg-white/10 hover:text-white ml-1" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {loading ? (
          <div className="text-center text-muted text-sm-type py-12">
            Loading...
          </div>
        ) : stats?.totalCards === 0 ? (
          /* Empty state — no cards yet */
          <div className="bg-canvas border border-edge rounded-lg p-8 text-center shadow-sm">
            <div className="text-4xl mb-4">📚</div>
            <h2 className="text-sm-type font-bold text-content mb-2">
              No Learning Cards Yet
            </h2>
            <p className="text-xs-type text-muted mb-6 max-w-md mx-auto">
              Initialize spaced repetition cards for all your questions. Each
              card will be scheduled for review based on how well you know it.
            </p>
            <button
              onClick={handleInit}
              disabled={initLoading}
              className="py-2.5 px-8 bg-interact text-white rounded-lg hover:bg-interact-h disabled:opacity-50 font-semibold text-xs-type transition-colors"
            >
              {initLoading ? "Initializing..." : "Initialize Cards"}
            </button>
            {initMessage && (
              <p className="mt-4 text-ok text-xs-type">{initMessage}</p>
            )}
          </div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-canvas border border-edge rounded-lg p-4 text-center shadow-sm">
                <div className="text-stat font-black text-content tabular-nums">
                  {stats?.dueToday ?? 0}
                </div>
                <div className="text-xs-type text-muted mt-1">Due Today</div>
              </div>
              <div className="bg-canvas border border-edge rounded-lg p-4 text-center shadow-sm">
                <div className="text-stat font-black text-interact tabular-nums">
                  {learning}
                </div>
                <div className="text-xs-type text-muted mt-1">Learning</div>
              </div>
              <div className="bg-canvas border border-edge rounded-lg p-4 text-center shadow-sm">
                <div className="text-stat font-black text-ok tabular-nums">
                  {stats?.mastered ?? 0}
                </div>
                <div className="text-xs-type text-muted mt-1">Mastered</div>
              </div>
              <div className="bg-canvas border border-edge rounded-lg p-4 text-center shadow-sm">
                <div className="text-stat font-black text-muted tabular-nums">
                  {stats?.newCards ?? 0}
                </div>
                <div className="text-xs-type text-muted mt-1">New</div>
              </div>
            </div>

            {/* Start session */}
            {stats && stats.dueToday > 0 ? (
              <div
                className="bg-canvas border border-edge rounded-lg overflow-hidden shadow-sm"
                style={{ borderLeftWidth: "4px", borderLeftColor: "var(--color-interact)" }}
              >
                <div className="px-5 py-4 border-b border-edge bg-surface">
                  <h2 className="text-sm-type font-bold text-content">
                    Ready for Review
                  </h2>
                  <p className="text-xs-type text-muted mt-0.5">
                    {stats.dueToday} card{stats.dueToday !== 1 ? "s" : ""} due
                    for review today
                  </p>
                </div>
                <div className="p-5">
                  <button
                    onClick={() => router.push("/learn/session")}
                    className="w-full py-3 bg-interact text-white rounded-lg hover:bg-interact-h font-semibold text-sm-type transition-colors"
                  >
                    Start Learning Session
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-canvas border border-edge rounded-lg p-6 text-center shadow-sm">
                <div className="text-3xl mb-3">✅</div>
                <h2 className="text-sm-type font-bold text-content mb-1">
                  All caught up!
                </h2>
                <p className="text-xs-type text-muted">
                  No cards due right now. Come back later for your next review.
                </p>
              </div>
            )}

            {/* Mastery progress bar */}
            {stats && stats.totalCards > 0 && (
              <div className="bg-canvas border border-edge rounded-lg p-5 shadow-sm">
                <div className="flex justify-between text-xs-type text-muted mb-2">
                  <span>Mastery Progress</span>
                  <span>
                    {Math.round((stats.mastered / stats.totalCards) * 100)}%
                  </span>
                </div>
                <div className="w-full h-3 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full bg-ok rounded-full transition-all duration-500"
                    style={{
                      width: `${(stats.mastered / stats.totalCards) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs-type text-muted mt-2">
                  {stats.mastered} of {stats.totalCards} cards mastered (5+
                  reviews, 21+ day interval)
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
