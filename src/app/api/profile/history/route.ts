import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const attempts = await prisma.examAttempt.findMany({
      orderBy: { takenAt: "desc" },
      select: {
        id: true,
        examSet: true,
        takenAt: true,
        totalQuestions: true,
        correctAnswers: true,
        score: true,
        passed: true,
        domainBreakdown: true,
        domainResults: {
          select: { domain: true, correct: true, total: true },
        },
      },
    });

    // Normalize: prefer structured domainResults, fall back to JSON string
    const normalized = attempts.map((a) => {
      let breakdown: Record<string, { correct: number; total: number }>;

      if (a.domainResults.length > 0) {
        breakdown = Object.fromEntries(
          a.domainResults.map((d) => [d.domain, { correct: d.correct, total: d.total }])
        );
      } else {
        try {
          breakdown = JSON.parse(a.domainBreakdown);
        } catch {
          breakdown = {};
        }
      }

      return { ...a, domainBreakdown: breakdown };
    });

    return NextResponse.json(normalized);
  } catch (e) {
    console.error("history error:", e);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
