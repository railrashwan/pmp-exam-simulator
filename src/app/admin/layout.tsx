import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-48 bg-gray-800 text-white flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-gray-700">
          <div className="font-bold text-sm">PMP Admin</div>
          <div className="text-gray-400 text-xs">Question Manager</div>
        </div>
        <nav className="flex-1 p-2">
          <Link
            href="/admin/questions"
            className="block px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
          >
            📋 Questions
          </Link>
          <Link
            href="/admin/questions/new"
            className="block px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
          >
            ➕ Add Question
          </Link>
        </nav>
        <div className="p-3 border-t border-gray-700">
          <Link
            href="/"
            className="block text-xs text-gray-400 hover:text-white"
          >
            ← Back to Exam
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 bg-gray-50 overflow-auto">{children}</main>
    </div>
  );
}
