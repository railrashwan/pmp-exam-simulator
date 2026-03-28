"use client";

import { useEffect, useCallback, useState } from "react";
import Link from "next/link";
import type { Question } from "@/lib/types";

const DOMAINS = ["All", "People", "Process", "Business Environment"];

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [domain, setDomain] = useState("All");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteError, setDeleteError] = useState("");

  const fetchQuestions = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page), limit: "20",
      ...(committedSearch ? { search: committedSearch } : {}),
      ...(domain !== "All" ? { domain } : {}),
    });
    fetch(`/api/questions?${params}`)
      .then((r) => r.json())
      .then((data) => { setQuestions(data.questions ?? []); setTotal(data.total ?? 0); setLoading(false); })
      .catch(() => setLoading(false));
  }, [page, domain, committedSearch]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault(); setPage(1); setCommittedSearch(searchInput);
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this question?")) return;
    setDeleteError("");
    const res = await fetch(`/api/questions/${id}`, { method: "DELETE" });
    if (res.ok) fetchQuestions();
    else setDeleteError("Failed to delete question. Please try again.");
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between bg-surface border border-edge px-4 py-4 rounded-lg shadow-sm">
        <div>
          <h1 className="text-sm-type font-bold text-content">Questions Bank</h1>
          <p className="text-xs-type text-muted mt-0.5">Manage all {total} exam questions</p>
        </div>
        <Link
          href="/admin/questions/new"
          className="px-4 py-2 bg-interact text-white rounded-lg hover:bg-interact-h text-xs-type font-semibold shadow-sm transition-colors"
        >
          + Add Question
        </Link>
      </div>

      {deleteError && (
        <div className="px-4 py-3 bg-err-bg border border-err text-err rounded-lg text-sm">
          {deleteError}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search questions..."
            className="flex-1 border border-edge bg-canvas text-content rounded-lg px-3 py-2 text-xs-type focus:outline-none focus:border-interact shadow-sm"
          />
          <button type="submit" className="px-4 py-2 bg-surface border border-edge text-content rounded-lg hover:bg-surface-2 text-xs-type font-semibold shadow-sm transition-colors">
            Search
          </button>
        </form>
        <select
          value={domain}
          onChange={(e) => { setDomain(e.target.value); setPage(1); }}
          className="border border-edge bg-canvas text-content rounded-lg px-3 py-2 text-xs-type focus:outline-none focus:border-interact shadow-sm shrink-0"
        >
          {DOMAINS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-muted text-sm p-8 text-center bg-canvas border border-edge rounded-lg">Loading...</div>
      ) : (
        <div className="bg-canvas border border-edge rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface border-b border-edge text-xs-type text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-semibold w-16">#</th>
                  <th className="px-4 py-3 font-semibold w-48">Domain</th>
                  <th className="px-4 py-3 font-semibold min-w-[200px]">Question (EN)</th>
                  <th className="px-4 py-3 font-semibold text-center w-20">Ans</th>
                  <th className="px-4 py-3 font-semibold text-right w-32">Actions</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-edge">
              {questions.map((q) => (
                <tr key={q.id} className="hover:bg-surface transition-colors">
                  <td className="px-4 py-3 text-muted">{q.id}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                      q.domain === "People" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800" :
                      q.domain === "Process" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800" :
                      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800"
                    }`}>
                      {q.domain}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-content max-w-[200px] sm:max-w-xs truncate">{q.questionTextEn}</td>
                  <td className="px-4 py-3 text-center font-bold text-interact">{q.correctAnswer}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <Link href={`/admin/questions/${q.id}/edit`} className="text-interact hover:text-interact-h font-semibold transition-colors">Edit</Link>
                    <button onClick={() => handleDelete(q.id)} className="text-err hover:text-red-700 font-semibold transition-colors">Delete</button>
                  </td>
                </tr>
              ))}
              {questions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted text-sm">No questions found.</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-edge bg-surface flex items-center justify-center sm:justify-between gap-3 text-sm">
              <span className="text-muted hidden sm:inline">Page <span className="font-medium text-content">{page}</span> of <span className="font-medium text-content">{totalPages}</span></span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-1.5 bg-canvas border border-edge rounded-md disabled:opacity-40 font-semibold shadow-sm hover:bg-surface-2 transition-colors">‹ Prev</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-4 py-1.5 bg-canvas border border-edge rounded-md disabled:opacity-40 font-semibold shadow-sm hover:bg-surface-2 transition-colors">Next ›</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
