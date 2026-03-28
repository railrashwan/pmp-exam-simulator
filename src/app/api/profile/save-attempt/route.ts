import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface QuestionResult {
  questionId: number;
  selectedAnswer: string | null;
  isCorrect: boolean;
}

interface SaveAttemptBody {
  examSet: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  passed: boolean;
  domainBreakdown: Record<string, { correct: number; total: number }>;
  results: QuestionResult[];
}

export async function POST(req: NextRequest) {
  try {
    const body: SaveAttemptBody = await req.json();
    const { examSet, totalQuestions, correctAnswers, score, passed, domainBreakdown, results } = body;

    const attempt = await prisma.examAttempt.create({
      data: {
        examSet,
        totalQuestions,
        correctAnswers,
        score,
        passed,
        domainBreakdown: JSON.stringify(domainBreakdown),
        results: {
          create: results
            .filter((r) => r.selectedAnswer != null && r.selectedAnswer !== "")
            .map((r) => ({
              questionId: r.questionId,
              selectedAnswer: r.selectedAnswer,
              isCorrect: r.isCorrect,
            })),
        },
      },
    });

    return NextResponse.json({ attemptId: attempt.id });
  } catch (e) {
    console.error("save-attempt error:", e);
    return NextResponse.json({ error: "Failed to save attempt" }, { status: 500 });
  }
}
