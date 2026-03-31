"use client";

import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-48 bg-surface border-r border-edge flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-edge">
          <div className="font-bold text-sm text-content leading-tight">PMP Admin</div>
          <div className="text-muted text-xs-type mt-0.5">Question Manager</div>
        </div>
        <nav className="flex-1 p-2">
          <Link
            href="/admin/questions"
            className="block px-3 py-2 rounded-lg text-sm text-content hover:bg-surface-2 transition-colors"
          >
            📋 Questions
          </Link>
          <Link
            href="/admin/questions/new"
            className="block px-3 py-2 rounded-lg text-sm text-content hover:bg-surface-2 transition-colors"
          >
            ➕ Add Question
          </Link>
        </nav>
        <div className="p-3 border-t border-edge space-y-1">
          <Link
            href="/"
            className="block text-xs-type text-muted hover:text-content transition-colors"
          >
            ← Back to Exam
          </Link>
          <button
            onClick={async () => {
              document.cookie = "admin_auth=; path=/; max-age=0";
              window.location.href = "/admin/login";
            }}
            className="block text-xs-type text-red-400 hover:text-red-300 transition-colors"
          >
            ↩ Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 bg-canvas overflow-auto">{children}</main>
    </div>
  );
}
