"use client";

import { useState, useRef } from "react";

const EXAM_SETS = ["helena", "eduhub", "yassine", "undraw", "andrew-ultra", "pmp"];

interface SeedResult {
  inserted: number;
  totalInDb: number;
  message: string;
}

interface DbCount {
  examSet: string;
  count: number;
}

export default function SeedPage() {
  const [examSet, setExamSet] = useState("helena");
  const [replace, setReplace] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [results, setResults] = useState<SeedResult[]>([]);
  const [error, setError] = useState("");
  const [dbCount, setDbCount] = useState<DbCount | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function checkCount() {
    const res = await fetch(`/api/admin/seed?examSet=${examSet}`);
    const data = await res.json();
    setDbCount(data);
  }

  async function handleSeed() {
    if (files.length === 0) { setError("Please select at least one file."); return; }
    setStatus("loading");
    setError("");
    setResults([]);

    const allResults: SeedResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const content = await file.text();

      // Only replace on the first file; append the rest
      const shouldReplace = replace && i === 0;

      const res = await fetch("/api/admin/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, examSet, replace: shouldReplace }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(`File "${file.name}": ${data.error}`);
        setStatus("error");
        return;
      }

      allResults.push({ ...data, message: `"${file.name}": ${data.message}` });
    }

    setResults(allResults);
    setStatus("done");
    checkCount();
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-content mb-1">Seed Exam Questions</h1>
      <p className="text-sm text-muted mb-8">
        Upload one or more <code>.txt</code> files to seed questions into the database.
        The parser expects the standard format used by the AI Studio export scripts.
      </p>

      {/* Exam set selector */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Exam Set</label>
        <div className="flex flex-wrap gap-2">
          {EXAM_SETS.map((s) => (
            <button
              key={s}
              onClick={() => setExamSet(s)}
              className={`px-4 py-1.5 rounded border text-sm font-medium transition-colors ${
                examSet === s
                  ? "bg-primary text-white border-primary"
                  : "bg-surface border-edge text-content hover:border-edge-2"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Check current count */}
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={checkCount}
          className="px-4 py-1.5 text-sm rounded border border-edge bg-surface text-content hover:bg-surface-2 transition-colors"
        >
          Check current count
        </button>
        {dbCount && (
          <span className="text-sm text-content">
            <span className="font-semibold">{dbCount.examSet}</span>: {dbCount.count} questions in DB
          </span>
        )}
      </div>

      {/* File picker */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Files</label>
        <input
          ref={fileRef}
          type="file"
          accept=".txt"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="block w-full text-sm text-content file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-h cursor-pointer"
        />
        {files.length > 0 && (
          <ul className="mt-2 space-y-1">
            {files.map((f) => (
              <li key={f.name} className="text-xs text-muted">📄 {f.name} ({(f.size / 1024).toFixed(1)} KB)</li>
            ))}
          </ul>
        )}
      </div>

      {/* Replace toggle */}
      <div
        className={`mb-6 flex items-center justify-between px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
          replace ? "border-warn bg-warn/5" : "border-edge bg-surface"
        }`}
        onClick={() => setReplace((v) => !v)}
      >
        <div>
          <p className="text-sm font-semibold text-content">
            {replace ? "⚠ Replace existing questions" : "Append to existing questions"}
          </p>
          <p className="text-xs text-muted mt-0.5">
            {replace
              ? `All current "${examSet}" questions will be deleted before inserting.`
              : `New questions will be added without removing existing ones.`}
          </p>
        </div>
        <div className={`shrink-0 w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${replace ? "bg-warn" : "bg-edge"}`}>
          <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${replace ? "translate-x-5" : "translate-x-0"}`} />
        </div>
      </div>

      {/* Seed button */}
      <button
        onClick={handleSeed}
        disabled={status === "loading" || files.length === 0}
        className="w-full py-3 bg-interact text-white font-bold rounded-lg hover:bg-interact-h disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
      >
        {status === "loading" ? "Seeding…" : `Seed ${files.length} file${files.length !== 1 ? "s" : ""} → ${examSet}`}
      </button>

      {/* Results */}
      {status === "done" && results.length > 0 && (
        <div className="mt-6 space-y-2">
          {results.map((r, i) => (
            <div key={i} className="px-4 py-3 rounded-lg bg-ok/10 border border-ok/30 text-sm text-ok">
              ✓ {r.message}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-4 px-4 py-3 rounded-lg bg-err/10 border border-err/30 text-sm text-wrong">
          ✗ {error}
        </div>
      )}

      {/* Format reminder */}
      <details className="mt-8 text-xs text-muted">
        <summary className="cursor-pointer font-semibold hover:text-content transition-colors">Expected file format</summary>
        <pre className="mt-3 p-4 bg-surface rounded-lg overflow-x-auto leading-relaxed text-xs">{`Q1
Domain: People
Question EN: What should the PM do first?
Question AR: ماذا يجب على مدير المشروع أن يفعل أولاً؟
A EN: Hold a team meeting
A AR: عقد اجتماع للفريق
B EN: Escalate the issue
B AR: تصعيد المشكلة
C EN: Update the risk register
C AR: تحديث سجل المخاطر
D EN: Consult the sponsor
D AR: استشارة الراعي
Correct: A
Why Correct EN: The PM should first...
Why Correct AR: يجب على مدير المشروع...
Why Wrong EN: B: reason. C: reason. D: reason.
Why Wrong AR: ب: السبب. ج: السبب. د: السبب.

Q2
...`}</pre>
      </details>
    </div>
  );
}
