import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ExamResultsResponse } from "@/lib/types";

const VALID_ANSWERS = new Set(["A", "B", "C", "D"]);
const ALL_DOMAINS = ["People", "Process", "Business Environment"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawAnswers: unknown = body.answers;
    const rawAllIds: unknown = body.allQuestionIds;

    if (typeof rawAnswers !== "object" || rawAnswers === null || Array.isArray(rawAnswers)) {
      return NextResponse.json({ error: "Invalid answers format" }, { status: 400 });
    }

    // Sanitize answers: only numeric IDs with valid A-D values
    const answers: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawAnswers as Record<string, unknown>)) {
      const id = parseInt(k, 10);
      if (!isNaN(id) && id > 0 && typeof v === "string" && VALID_ANSWERS.has(v)) {
        answers[String(id)] = v;
      }
    }

    // All exam question IDs (answered + unanswered) for correct totals
    const allIds: number[] = Array.isArray(rawAllIds)
      ? (rawAllIds as unknown[])
          .map((x) => parseInt(String(x), 10))
          .filter((n) => !isNaN(n) && n > 0)
      : Object.keys(answers).map((id) => parseInt(id, 10));

    if (allIds.length === 0) {
      const domainBreakdown = Object.fromEntries(
        ALL_DOMAINS.map((d) => [d, { correct: 0, total: 0 }])
      );
      const response: ExamResultsResponse = {
        totalQuestions: 0,
        correctAnswers: 0,
        score: 0,
        passed: false,
        domainBreakdown,
        results: [],
      };
      return NextResponse.json(response);
    }

    // Fetch ALL questions in the exam (not just answered ones)
    const questions = await prisma.question.findMany({
      where: { id: { in: allIds } },
    });

    // Initialize all 3 domains so they always appear
    const domainBreakdown: Record<string, { correct: number; total: number }> = Object.fromEntries(
      ALL_DOMAINS.map((d) => [d, { correct: 0, total: 0 }])
    );

    let correct = 0;

    const results = questions.map((q) => {
      const selected = answers[String(q.id)] ?? null;
      const isCorrect = selected === q.correctAnswer;
      if (isCorrect) correct++;

      const domain = q.domain in domainBreakdown ? q.domain : "Process";
      domainBreakdown[domain].total++;
      if (isCorrect) domainBreakdown[domain].correct++;

      return {
        questionId: q.id,
        questionTextEn: q.questionTextEn,
        questionTextAr: q.questionTextAr,
        selectedAnswer: selected,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanationEn: q.explanationEn,
        explanationAr: q.explanationAr,
        wrongExplanationEn: q.wrongExplanationEn ?? null,
        wrongExplanationAr: q.wrongExplanationAr ?? null,
        optionAEn: q.optionAEn,
        optionAAr: q.optionAAr,
        optionBEn: q.optionBEn,
        optionBAr: q.optionBAr,
        optionCEn: q.optionCEn,
        optionCAr: q.optionCAr,
        optionDEn: q.optionDEn,
        optionDAr: q.optionDAr,
        domain: q.domain,
      };
    });

    // Score is based on ALL questions, not just answered ones
    const total = allIds.length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;

    const response: ExamResultsResponse = {
      totalQuestions: total,
      correctAnswers: correct,
      score,
      passed: score >= 65,
      domainBreakdown,
      results,
    };

    return NextResponse.json(response);
  } catch (e) {
    console.error("exam/results error:", e);
    return NextResponse.json({ error: "Failed to calculate results" }, { status: 500 });
  }
}
