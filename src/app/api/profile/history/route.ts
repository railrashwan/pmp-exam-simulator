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
      },
    });

    return NextResponse.json(attempts);
  } catch (e) {
    console.error("history error:", e);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
