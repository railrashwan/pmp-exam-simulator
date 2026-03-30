"use client";

import { useState, useEffect } from "react";

interface Stats {
  total: number;
  missing: number;
  done: number;
}

interface BatchResult {
  translated: number;
  remaining: number;
  errors?: string[];
  message?: string;
}

export default function TranslatePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [batchSize, setBatchSize] = useState(10);
  const [autoRun, setAutoRun] = useState(false);

  async function fetchStats() {
    const res = await fetch("/api/admin/translate-explanations");
    const data: Stats = await res.json();
    setStats(data);
    return data;
  }

  useEffect(() => { fetchStats(); }, []);

  function addLog(msg: string) {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  }

  async function runBatch(): Promise<number> {
    const res = await fetch("/api/admin/translate-explanations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchSize }),
    });
    const data: BatchResult = await res.json();
    if (!res.ok) throw new Error((data as { error?: string }).error ?? "Request failed");

    if (data.message) {
      addLog(data.message);
    } else {
      addLog(`✓ Translated ${data.translated} questions. Remaining: ${data.remaining}`);
      if (data.errors?.length) {
        data.errors.forEach((e) => addLog(`  ⚠ ${e}`));
      }
    }
    await fetchStats();
    return data.remaining;
  }

  async function handleRunBatch() {
    setRunning(true);
    try {
      await runBatch();
    } catch (e) {
      addLog(`✗ Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setRunning(false);
    }
  }

  async function handleRunAll() {
    setRunning(true);
    setAutoRun(true);
    addLog(`Starting full translation run (batch size: ${batchSize})…`);
    try {
      let remaining = Infinity;
      while (remaining > 0) {
        remaining = await runBatch();
        if (remaining > 0) {
          // Small delay between batches to avoid rate limits
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
      addLog("✅ All translations complete!");
    } catch (e) {
      addLog(`✗ Stopped: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setRunning(false);
      setAutoRun(false);
    }
  }

  const pct = stats ? Math.round((stats.done / Math.max(stats.total, 1)) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-content mb-1">Translate Wrong-Answer Explanations</h1>
      <p className="text-sm text-muted mb-6">
        Translates <code>wrongExplanationEn</code> → <code>wrongExplanationAr</code> using Claude.
        Requires <code>ANTHROPIC_API_KEY</code> in Vercel environment variables.
      </p>

      {/* Progress */}
      {stats && (
        <div className="mb-6 p-4 bg-surface border border-edge rounded-lg">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted">Progress</span>
            <span className="font-semibold text-content">{stats.done} / {stats.total} ({pct}%)</span>
          </div>
          <div className="w-full bg-edge rounded-full h-2.5">
            <div
              className="bg-interact h-2.5 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted mt-2">
            <span>{stats.missing} remaining</span>
            <span>{stats.done} translated</span>
          </div>
        </div>
      )}

      {/* Batch size */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
          Batch size (questions per API call)
        </label>
        <div className="flex gap-2">
          {[5, 10, 20, 50].map((n) => (
            <button
              key={n}
              onClick={() => setBatchSize(n)}
              className={`px-4 py-1.5 rounded border text-sm font-medium transition-colors ${
                batchSize === n
                  ? "bg-primary text-white border-primary"
                  : "bg-surface border-edge text-content hover:border-edge-2"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleRunBatch}
          disabled={running || stats?.missing === 0}
          className="px-5 py-2.5 bg-surface border border-edge text-content text-sm font-semibold rounded-lg hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {running && !autoRun ? "Running…" : `Translate next ${batchSize}`}
        </button>
        <button
          onClick={handleRunAll}
          disabled={running || stats?.missing === 0}
          className="flex-1 py-2.5 bg-interact text-white text-sm font-bold rounded-lg hover:bg-interact-h disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {running && autoRun ? `Translating… (${stats?.missing ?? "?"} remaining)` : "Translate All →"}
        </button>
        <button
          onClick={fetchStats}
          disabled={running}
          className="px-4 py-2.5 bg-surface border border-edge text-content text-sm rounded-lg hover:bg-surface-2 transition-colors"
        >
          ↻
        </button>
      </div>

      {stats?.missing === 0 && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-ok/10 border border-ok/30 text-sm text-ok font-semibold">
          ✅ All wrong-answer explanations have been translated into Arabic.
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Log</p>
          <div className="bg-surface border border-edge rounded-lg p-3 max-h-64 overflow-y-auto font-mono text-xs text-muted space-y-1">
            {log.map((entry, i) => (
              <div key={i} className={entry.includes("✗") ? "text-wrong" : entry.includes("⚠") ? "text-caution" : ""}>
                {entry}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-8 text-xs text-muted">
        Note: The API skips questions that already have an Arabic wrong-answer explanation.
        To re-translate, clear <code>wrongExplanationAr</code> in the admin question editor first.
      </p>
    </div>
  );
}
