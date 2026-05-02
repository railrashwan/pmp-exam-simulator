import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    const [totalCards, dueToday, mastered, newCards] = await Promise.all([
      prisma.spacedRepCard.count(),
      prisma.spacedRepCard.count({
        where: { nextReview: { lte: now } },
      }),
      prisma.spacedRepCard.count({
        where: { reviewCount: { gte: 5 }, interval: { gte: 21 } },
      }),
      prisma.spacedRepCard.count({
        where: { reviewCount: 0 },
      }),
    ]);

    return NextResponse.json({
      totalCards,
      dueToday,
      mastered,
      newCards,
    });
  } catch (e) {
    console.error("learn/stats error:", e);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
