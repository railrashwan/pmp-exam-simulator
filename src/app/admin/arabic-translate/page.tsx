"use client";

import { useState, useRef } from "react";

interface ImportResult {
  saved: number;
  total: number;
  errors?: string[];
}

export default function ArabicTranslatePage() {
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

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-8">
      <div>
        <h1 className="text-lg font-bold text-content">Arabic Explanations — Export / Import</h1>
        <p className="text-xs-type text-muted mt-1">
          Download the Markdown file, fill in Arabic explanations, then upload it back to save them.
        </p>
      </div>

      {/* Step 1 — Export */}
      <div className="bg-canvas border border-edge rounded-lg overflow-hidden">
        <div className="bg-surface border-b border-edge px-5 py-3 flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
          <div>
            <div className="text-sm-type font-bold text-content">Download MD File</div>
            <div className="text-xs-type text-muted">Contains all questions missing Arabic explanations.</div>
          </div>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs-type text-muted leading-relaxed">
            The file has one section per question with:
          </p>
          <ul className="text-xs-type text-muted space-y-1 list-disc list-inside">
            <li>The English question text (for reference)</li>
            <li>The English explanation (to translate)</li>
            <li>An empty <strong>Explanation AR:</strong> line — fill this in</li>
            <li>Optional: empty <strong>Wrong Explanations AR:</strong> line</li>
          </ul>
          <a
            href="/api/admin/export-arabic"
            download
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-interact text-white text-xs-type font-semibold rounded-lg hover:bg-interact-h transition-colors"
          >
            ↓ Download MD File
          </a>
        </div>
      </div>

      {/* Step 2 — Fill in */}
      <div className="bg-canvas border border-edge rounded-lg overflow-hidden">
        <div className="bg-surface border-b border-edge px-5 py-3 flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
          <div>
            <div className="text-sm-type font-bold text-content">Fill in Arabic Explanations</div>
            <div className="text-xs-type text-muted">Open the file in any text editor and fill in the AR sections.</div>
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="rounded border border-edge bg-surface p-4 font-mono text-xs text-muted leading-relaxed whitespace-pre">
{`<!-- Q:42 -->
## Q42 | People | pmp

**Explanation EN:**
The PM should communicate with stakeholders...

**Explanation AR:**
يجب على مدير المشروع التواصل مع أصحاب المصلحة...

---`}
          </div>
          <p className="text-xs-type text-muted mt-3">
            Fill in text after <strong>**Explanation AR:**</strong> for each question. Leave blank to skip that question.
          </p>
        </div>
      </div>

      {/* Step 3 — Import */}
      <div className="bg-canvas border border-edge rounded-lg overflow-hidden">
        <div className="bg-surface border-b border-edge px-5 py-3 flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
          <div>
            <div className="text-sm-type font-bold text-content">Upload Filled MD File</div>
            <div className="text-xs-type text-muted">Only questions with content in the AR section will be saved.</div>
          </div>
        </div>
        <div className="px-5 py-4 space-y-4">
          <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors ${importing ? "opacity-50 pointer-events-none" : "border-edge hover:border-interact hover:bg-surface"}`}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-xs-type text-muted font-medium">
              {importing ? "Importing…" : "Click to choose .md file"}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept=".md,text/markdown,text/plain"
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
            <div className={`px-4 py-3 rounded-lg border text-xs-type ${result.errors && result.errors.length > 0 ? "bg-caution-bg border-caution text-caution" : "bg-ok-bg border-ok text-ok"}`}>
              <div className="font-semibold">
                {result.saved === result.total
                  ? `✅ Saved ${result.saved} Arabic explanations.`
                  : `✅ Saved ${result.saved} of ${result.total} entries.`}
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
