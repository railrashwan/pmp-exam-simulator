import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch all results oldest-first so each questionId's final map entry = most recent answer
    const all = await prisma.attemptResult.findMany({
      select: { questionId: true, isCorrect: true },
      orderBy: { id: "asc" },
    });

    const latest = new Map<number, boolean>();
    for (const r of all) {
      latest.set(r.questionId, r.isCorrect);
    }

    // Only questions where the most recent answer was wrong
    const questionIds = [...latest.entries()]
      .filter(([, correct]) => !correct)
      .map(([id]) => id);

    return NextResponse.json({ count: questionIds.length, questionIds });
  } catch (e) {
    console.error("mistakes error:", e);
    return NextResponse.json({ error: "Failed to fetch mistakes" }, { status: 500 });
  }
}
