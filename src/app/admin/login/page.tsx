"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/admin/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push(searchParams.get("from") || "/admin");
    } else {
      setError("Invalid password");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-edge rounded-xl p-8 w-full max-w-sm shadow-lg">
      <h1 className="text-xl font-bold text-content mb-1">Admin Login</h1>
      <p className="text-muted text-sm mb-6">Enter the admin password to continue.</p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full px-3 py-2 rounded-lg bg-canvas border border-edge text-content text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        autoFocus
      />
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <button
        type="submit"
        className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
      >
        Sign In
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-canvas" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
