import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    const cards = await prisma.spacedRepCard.findMany({
      where: {
        nextReview: { lte: now },
      },
      include: {
        question: {
          select: {
            id: true,
            domain: true,
            questionTextEn: true,
            questionTextAr: true,
            optionAEn: true,
            optionAAr: true,
            optionBEn: true,
            optionBAr: true,
            optionCEn: true,
            optionCAr: true,
            optionDEn: true,
            optionDAr: true,
            correctAnswer: true,
            explanationEn: true,
            explanationAr: true,
            wrongExplanationEn: true,
            wrongExplanationAr: true,
          },
        },
      },
      orderBy: { nextReview: "asc" },
      take: 20,
    });

    return NextResponse.json(cards);
  } catch (e) {
    console.error("learn/queue error:", e);
    return NextResponse.json({ error: "Failed to load queue" }, { status: 500 });
  }
}
