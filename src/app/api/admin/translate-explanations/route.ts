import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert Arabic translator specializing in project management (PMP) content.
Your task is to translate English explanations for wrong exam answers into natural, fluent Arabic.

Rules:
- Convey the MEANING faithfully — do NOT translate word-for-word
- Use clear, professional Arabic suitable for PMP exam study material
- Preserve the format: if input is "A: reason. B: reason." output "أ: السبب. ب: السبب."
- Use Arabic letter labels: A→أ, B→ب, C→ج, D→د
- Keep PMP terminology consistent (e.g. project charter = ميثاق المشروع, stakeholder = أصحاب المصلحة, etc.)
- Output ONLY the translated text, nothing else`;

async function translateToArabic(text: string): Promise<string> {
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: text }],
  });
  const block = msg.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");
  return block.text.trim();
}

// GET — return stats
export async function GET() {
  const total = await prisma.question.count({
    where: { wrongExplanationEn: { not: null } },
  });
  const missing = await prisma.question.count({
    where: {
      wrongExplanationEn: { not: null },
      OR: [
        { wrongExplanationAr: null },
        { wrongExplanationAr: "" },
      ],
    },
  });
  return NextResponse.json({ total, missing, done: total - missing });
}

// POST — translate a batch
export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set in environment variables." },
      { status: 500 }
    );
  }

  const { batchSize = 10 } = await req.json().catch(() => ({})) as { batchSize?: number };

  // Fetch questions with English wrong explanations but missing Arabic translation
  const questions = await prisma.question.findMany({
    where: {
      wrongExplanationEn: { not: null },
      OR: [
        { wrongExplanationAr: null },
        { wrongExplanationAr: "" },
      ],
    },
    select: { id: true, wrongExplanationEn: true },
    take: batchSize,
  });

  if (questions.length === 0) {
    return NextResponse.json({ translated: 0, remaining: 0, message: "All done — no more questions to translate." });
  }

  let translated = 0;
  const errors: string[] = [];

  for (const q of questions) {
    if (!q.wrongExplanationEn) continue;
    try {
      const arabicText = await translateToArabic(q.wrongExplanationEn);
      await prisma.question.update({
        where: { id: q.id },
        data: { wrongExplanationAr: arabicText },
      });
      translated++;
    } catch (e) {
      errors.push(`Q${q.id}: ${String(e).slice(0, 100)}`);
    }
  }

  const remaining = await prisma.question.count({
    where: {
      wrongExplanationEn: { not: null },
      OR: [
        { wrongExplanationAr: null },
        { wrongExplanationAr: "" },
      ],
    },
  });

  return NextResponse.json({ translated, remaining, errors });
}
