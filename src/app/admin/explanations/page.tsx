"use client";

import { useState } from "react";

const EXAM_SETS = ["pmp", "undraw", "andrew-ultra", "yassine"];

export default function ExplanationsPage() {
  const [examSet, setExamSet] = useState("undraw");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setResult(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/import-explanations", { method: "POST", body: form });
    const json = await res.json();
    if (res.ok) {
      setResult(`✓ Updated ${json.updated} questions.`);
    } else {
      setResult(`✗ Error: ${json.error}`);
    }
    setImporting(false);
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Wrong-Answer Explanations</h1>

      {/* Export */}
      <div className="border rounded-lg p-5 space-y-3">
        <h2 className="font-semibold text-gray-800">1. Download English explanations</h2>
        <p className="text-sm text-gray-600">
          Downloads a Markdown file with all <code>wrongExplanationEn</code> values for an exam set.
          Translate the Arabic fields and upload below.
        </p>
        <div className="flex gap-3 items-center">
          <select
            value={examSet}
            onChange={(e) => setExamSet(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm"
          >
            {EXAM_SETS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <a
            href={`/api/admin/export-explanations?examSet=${examSet}`}
            download
            className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
          >
            Download .md
          </a>
        </div>
      </div>

      {/* Import */}
      <div className="border rounded-lg p-5 space-y-3">
        <h2 className="font-semibold text-gray-800">2. Upload translated file</h2>
        <p className="text-sm text-gray-600">
          Upload the same Markdown file after filling in the <code>wrongExplanationAr</code> sections.
          Only questions with a non-empty Arabic section will be updated.
        </p>
        <input
          type="file"
          accept=".md,text/markdown,text/plain"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <div>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="px-4 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {importing ? "Importing…" : "Import Arabic Explanations"}
          </button>
        </div>
        {result && (
          <p className={`text-sm font-medium ${result.startsWith("✓") ? "text-green-700" : "text-red-700"}`}>
            {result}
          </p>
        )}
      </div>
    </div>
  );
}
