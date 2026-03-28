"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Question } from "@/lib/types";

const DOMAINS = ["People", "Process", "Business Environment"];
const OPTION_KEYS = ["A", "B", "C", "D"] as const;

interface Props {
  initial?: Partial<Question>;
  questionId?: number;
}

type FormData = {
  domain: string;
  questionTextEn: string; questionTextAr: string;
  optionAEn: string; optionAAr: string;
  optionBEn: string; optionBAr: string;
  optionCEn: string; optionCAr: string;
  optionDEn: string; optionDAr: string;
  correctAnswer: string;
  explanationEn: string; explanationAr: string;
};

const emptyForm: FormData = {
  domain: "Process",
  questionTextEn: "", questionTextAr: "",
  optionAEn: "", optionAAr: "",
  optionBEn: "", optionBAr: "",
  optionCEn: "", optionCAr: "",
  optionDEn: "", optionDAr: "",
  correctAnswer: "A",
  explanationEn: "", explanationAr: "",
};

const inputCls = "w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-2xl focus:outline-none focus:border-blue-400";
const labelCls = "block text-2xl font-semibold text-gray-700 mb-2";

export function QuestionForm({ initial, questionId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({ ...emptyForm, ...(initial as FormData) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = questionId ? `/api/questions/${questionId}` : "/api/questions";
      const method = questionId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "An error occurred");
        return;
      }
      router.push("/admin/questions");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-8 max-w-6xl">
      {error && (
        <div className="bg-red-50 border-2 border-red-300 text-red-700 rounded-xl p-4 text-2xl">
          {error}
        </div>
      )}

      {/* Domain + Correct Answer */}
      <div className="flex gap-6">
        <div className="flex-1">
          <label className={labelCls}>Domain</label>
          <select value={form.domain} onChange={(e) => set("domain", e.target.value)} className={inputCls} required>
            {DOMAINS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="w-52">
          <label className={labelCls}>Correct Answer</label>
          <select value={form.correctAnswer} onChange={(e) => set("correctAnswer", e.target.value)} className={`${inputCls} font-bold`} required>
            {OPTION_KEYS.map((k) => <option key={k}>{k}</option>)}
          </select>
        </div>
      </div>

      {/* Question Text */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className={labelCls}>Question (English)</label>
          <textarea value={form.questionTextEn} onChange={(e) => set("questionTextEn", e.target.value)} rows={4} required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Question (Arabic)</label>
          <textarea value={form.questionTextAr} onChange={(e) => set("questionTextAr", e.target.value)} rows={4} dir="rtl" required className={`${inputCls} text-right`} />
        </div>
      </div>

      {/* Options */}
      <div>
        <h3 className={labelCls}>Options</h3>
        <div className="space-y-3">
          {OPTION_KEYS.map((key) => {
            const enKey = `option${key}En` as keyof FormData;
            const arKey = `option${key}Ar` as keyof FormData;
            return (
              <div key={key} className="grid grid-cols-2 gap-6">
                <div className="flex gap-3 items-center">
                  <span className="font-bold text-gray-600 text-2xl w-8 shrink-0">{key}.</span>
                  <input value={form[enKey]} onChange={(e) => set(enKey, e.target.value)} placeholder={`Option ${key} (English)`} required className={inputCls} />
                </div>
                <div className="flex gap-3 items-center">
                  <input value={form[arKey]} onChange={(e) => set(arKey, e.target.value)} placeholder={`Option ${key} (Arabic)`} dir="rtl" required className={`${inputCls} text-right`} />
                  <span className="font-bold text-gray-600 text-2xl w-8 text-right shrink-0">.{key}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Explanation */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className={labelCls}>Explanation (English)</label>
          <textarea value={form.explanationEn} onChange={(e) => set("explanationEn", e.target.value)} rows={3} required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Explanation (Arabic)</label>
          <textarea value={form.explanationAr} onChange={(e) => set("explanationAr", e.target.value)} rows={3} dir="rtl" required className={`${inputCls} text-right`} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold text-2xl shadow-md hover:shadow-lg transition-all"
        >
          {saving ? "Saving..." : questionId ? "Update Question" : "Create Question"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/questions")}
          className="px-8 py-4 border-2 border-gray-300 rounded-xl hover:bg-gray-50 text-2xl font-medium shadow-sm hover:shadow-md transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
