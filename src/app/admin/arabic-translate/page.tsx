"use client";

import { useState, useRef } from "react";

const EXAM_SETS = [
  { value: "andrew-ultra", label: "Andrew 200 (Ultra Hard)" },
  { value: "yassine",      label: "Yassine Exam Set" },
  { value: "helena",       label: "Helena Liu Exam Set" },
  { value: "eduhub",       label: "Eduhub Exam Set" },
  { value: "undraw",       label: "UNDRAW Exam Set" },
  { value: "pmp",          label: "PMP Classic Bank" },
];

interface ImportResult {
  saved: number;
  total: number;
  errors?: string[];
}

export default function ArabicTranslatePage() {
  const [examSet, setExamSet] = useState("andrew-ultra");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);
    setImportError("");

    try {
      const text = await file.text();
      const res = await fetch("/api/admin/import-arabic", {
        method: "POST",
        headers: { "Content-Type": "text/plain; charset=utf-8" },
        body: text,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setResult(data as ImportResult);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const selectedLabel = EXAM_SETS.find((s) => s.value === examSet)?.label ?? examSet;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-8">
      <div>
        <h1 className="text-lg font-bold text-content">Arabic Explanations — Export / Import</h1>
        <p className="text-xs-type text-muted mt-1">
          Download the questions file, fill in the Arabic explanations, then upload it back to save them into the database.
        </p>
      </div>

      {/* Exam set selector */}
      <div className="bg-canvas border border-edge rounded-lg overflow-hidden">
        <div className="bg-surface border-b border-edge px-5 py-3">
          <div className="text-sm-type font-bold text-content">Select Exam Set</div>
          <div className="text-xs-type text-muted mt-0.5">Choose which set to export or import.</div>
        </div>
        <div className="px-5 py-4 flex flex-wrap gap-2">
          {EXAM_SETS.map((s) => (
            <button
              key={s.value}
              onClick={() => setExamSet(s.value)}
              className={`px-4 py-1.5 rounded border text-xs-type font-semibold transition-colors ${
                examSet === s.value
                  ? "bg-primary text-white border-primary"
                  : "bg-surface border-edge text-content hover:border-edge-2"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step 1 — Export */}
      <div className="bg-canvas border border-edge rounded-lg overflow-hidden">
        <div className="bg-surface border-b border-edge px-5 py-3 flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
          <div>
            <div className="text-sm-type font-bold text-content">Download MD File — {selectedLabel}</div>
            <div className="text-xs-type text-muted">Contains every question missing an Arabic explanation.</div>
          </div>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs-type text-muted leading-relaxed">
            Each question block includes the English question, all 4 options, the correct answer, and the English explanation.
            The <code className="bg-surface px-1 rounded">Why Correct AR:</code> line is left blank — fill it in.
          </p>
          <a
            href={`/api/admin/export-arabic?examSet=${examSet}`}
            download
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-interact text-white text-xs-type font-semibold rounded-lg hover:bg-interact-h transition-colors"
          >
            ↓ Download {selectedLabel} MD File
          </a>
        </div>
      </div>

      {/* Step 2 — Fill in */}
      <div className="bg-canvas border border-edge rounded-lg overflow-hidden">
        <div className="bg-surface border-b border-edge px-5 py-3 flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
          <div>
            <div className="text-sm-type font-bold text-content">Fill in Arabic Explanations</div>
            <div className="text-xs-type text-muted">Open in any text editor and fill in the AR lines.</div>
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="rounded border border-edge bg-surface p-4 font-mono text-xs text-muted leading-relaxed whitespace-pre overflow-x-auto">
{`<!-- id:501 -->
Q1
Domain: People
Question EN: A project manager discovers that a team member...
Question AR: اكتشف مدير المشروع أن أحد أعضاء الفريق...
A EN: Have a private conversation with the team member
A AR: إجراء محادثة خاصة مع عضو الفريق
B EN: Escalate to management immediately
B AR: التصعيد الفوري إلى الإدارة
C EN: Update the risk register
C AR: تحديث سجل المخاطر
D EN: Ignore the issue
D AR: تجاهل المشكلة
Correct: A
Why Correct EN: The PM should address performance issues privately...
Why Correct AR: يجب على مدير المشروع معالجة مشكلات الأداء بشكل خاص...
Why Wrong EN: B: Escalation is premature. C: Not a risk item. D: Ignoring...
Why Wrong AR: ب: التصعيد مبكر. ج: ليس بنداً للمخاطر. د: التجاهل...`}
          </div>
          <p className="text-xs-type text-muted mt-3">
            Only fill in <strong>Why Correct AR:</strong> (and <strong>Why Wrong AR:</strong> if present). Do not change the <code className="bg-surface px-1 rounded">{"<!-- id:N -->"}</code> lines.
          </p>
        </div>
      </div>

      {/* Step 3 — Import */}
      <div className="bg-canvas border border-edge rounded-lg overflow-hidden">
        <div className="bg-surface border-b border-edge px-5 py-3 flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
          <div>
            <div className="text-sm-type font-bold text-content">Upload Filled MD File</div>
            <div className="text-xs-type text-muted">Only questions with a filled-in AR line will be saved. Others are skipped.</div>
          </div>
        </div>
        <div className="px-5 py-4 space-y-4">
          <label
            className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors ${
              importing ? "opacity-50 pointer-events-none" : "border-edge hover:border-interact hover:bg-surface"
            }`}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-xs-type text-muted font-medium">
              {importing ? "Importing…" : "Click to choose .md file"}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept=".md,.txt,text/markdown,text/plain"
              className="hidden"
              onChange={handleImport}
              disabled={importing}
            />
          </label>

          {importError && (
            <div className="px-4 py-3 bg-err-bg border border-err text-err rounded-lg text-xs-type">
              {importError}
            </div>
          )}

          {result && (
            <div className={`px-4 py-3 rounded-lg border text-xs-type ${
              result.errors && result.errors.length > 0
                ? "bg-surface border-edge text-content"
                : "bg-ok-bg border-ok text-ok"
            }`}>
              <div className="font-semibold">
                ✅ Saved {result.saved} of {result.total} Arabic explanations into the database.
              </div>
              {result.errors && result.errors.length > 0 && (
                <ul className="mt-2 space-y-0.5 list-disc list-inside text-muted">
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
