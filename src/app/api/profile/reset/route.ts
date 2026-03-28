import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    await prisma.attemptResult.deleteMany();
    await prisma.examAttempt.deleteMany();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("reset error:", e);
    return NextResponse.json({ error: "Failed to reset history" }, { status: 500 });
  }
}
