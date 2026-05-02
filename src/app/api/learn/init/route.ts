import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Get all question IDs that already have a card
    const existingCards = await prisma.spacedRepCard.findMany({
      select: { questionId: true },
    });
    const existingIds = new Set(existingCards.map((c) => c.questionId));

    // Get all questions
    const allQuestions = await prisma.question.findMany({
      select: { id: true },
    });

    // Find questions without cards
    const newCardIds = allQuestions
      .filter((q) => !existingIds.has(q.id))
      .map((q) => ({ questionId: q.id }));

    if (newCardIds.length === 0) {
      return NextResponse.json({ created: 0, message: "All questions already have cards" });
    }

    // Batch create
    const result = await prisma.spacedRepCard.createMany({
      data: newCardIds.map((c) => ({
        questionId: c.questionId,
        interval: 1,
        ease: 2.5,
        nextReview: new Date(),
      })),
    });

    return NextResponse.json({ created: result.count });
  } catch (e) {
    console.error("learn/init error:", e);
    return NextResponse.json({ error: "Failed to initialize cards" }, { status: 500 });
  }
}
