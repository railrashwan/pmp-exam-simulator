import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processReview } from "@/lib/spaced-rep";
import type { Rating } from "@/lib/spaced-rep";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cardId, rating } = body as { cardId: number; rating: Rating };

    if (!cardId || !["easy", "hard", "forgot"].includes(rating)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const card = await prisma.spacedRepCard.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const updated = processReview(
      { interval: card.interval, ease: card.ease },
      rating
    );

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + updated.interval);

    const [updatedCard] = await prisma.$transaction([
      prisma.spacedRepCard.update({
        where: { id: cardId },
        data: {
          interval: updated.interval,
          ease: updated.ease,
          nextReview,
          reviewCount: { increment: 1 },
          lastRating: rating,
        },
      }),
      prisma.reviewLog.create({
        data: {
          cardId,
          rating,
          intervalAfter: updated.interval,
        },
      }),
    ]);

    return NextResponse.json(updatedCard);
  } catch (e) {
    console.error("learn/review error:", e);
    return NextResponse.json({ error: "Failed to process review" }, { status: 500 });
  }
}
