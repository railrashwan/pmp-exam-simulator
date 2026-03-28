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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Questions ({total})</h1>
        <Link
          href="/admin/questions/new"
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-2xl font-semibold shadow-md hover:shadow-lg transition-all"
        >
          + Add Question
        </Link>
      </div>

      {deleteError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-300 text-red-700 rounded-xl text-2xl">
          {deleteError}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3 flex-1">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search questions..."
            className="flex-1 border-2 border-gray-300 rounded-xl px-4 py-3 text-2xl focus:outline-none focus:border-blue-400"
          />
          <button type="submit" className="px-6 py-3 bg-gray-200 rounded-xl hover:bg-gray-300 text-2xl font-medium shadow-sm">
            Search
          </button>
        </form>
        <select
          value={domain}
          onChange={(e) => { setDomain(e.target.value); setPage(1); }}
          className="border-2 border-gray-300 rounded-xl px-4 py-3 text-2xl focus:outline-none focus:border-blue-400"
        >
          {DOMAINS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-gray-500 text-2xl p-8">Loading...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <table className="w-full text-2xl">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-5 py-4 text-left font-semibold text-gray-600 w-16">#</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600 w-52">Domain</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600">Question (EN)</th>
                <th className="px-5 py-4 text-center font-semibold text-gray-600 w-24">Ans</th>
                <th className="px-5 py-4 text-right font-semibold text-gray-600 w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {questions.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 text-gray-500">{q.id}</td>
                  <td className="px-5 py-4">
                    <span className={`px-3 py-1 rounded-full text-xl font-medium ${
                      q.domain === "People" ? "bg-blue-100 text-blue-700" :
                      q.domain === "Process" ? "bg-green-100 text-green-700" :
                      "bg-orange-100 text-orange-700"
                    }`}>
                      {q.domain}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-800 max-w-xs truncate">{q.questionTextEn}</td>
                  <td className="px-5 py-4 text-center font-bold text-blue-600">{q.correctAnswer}</td>
                  <td className="px-5 py-4 text-right space-x-3">
                    <Link href={`/admin/questions/${q.id}/edit`} className="text-blue-600 hover:text-blue-800 font-semibold">Edit</Link>
                    <button onClick={() => handleDelete(q.id)} className="text-red-600 hover:text-red-800 font-semibold">Delete</button>
                  </td>
                </tr>
              ))}
              {questions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-500 text-2xl">No questions found.</td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="px-5 py-4 border-t flex items-center gap-3 text-2xl">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-5 py-2 border-2 rounded-lg disabled:opacity-40 font-medium shadow-sm hover:shadow-md">‹ Prev</button>
              <span className="text-gray-600">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-5 py-2 border-2 rounded-lg disabled:opacity-40 font-medium shadow-sm hover:shadow-md">Next ›</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
