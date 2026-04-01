import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const EXPLANATION_PROMPT = `You are an expert Arabic translator specializing in project management (PMP) content.
Translate the following English PMP exam explanation into natural, fluent Arabic.

Rules:
- Convey the MEANING faithfully — do NOT translate word-for-word
- Use clear, professional Arabic suitable for PMP exam study material
- Keep PMP terminology consistent (e.g. project charter = ميثاق المشروع, stakeholder = أصحاب المصلحة, risk register = سجل المخاطر, etc.)
- Output ONLY the translated text, nothing else`;

const WRONG_EXPLANATION_PROMPT = `You are an expert Arabic translator specializing in project management (PMP) content.
Translate the following English per-option wrong-answer explanations into Arabic.

Rules:
- Convey the MEANING faithfully — do NOT translate word-for-word
- Use clear, professional Arabic suitable for PMP exam study material
- Preserve the format exactly: if input is "A: reason. B: reason." output "أ: السبب. ب: السبب."
- Use Arabic letter labels: A→أ, B→ب, C→ج, D→د
- Keep PMP terminology consistent
- Output ONLY the translated text, nothing else`;

async function translate(text: string, prompt: string): Promise<string> {
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: prompt,
    messages: [{ role: "user", content: text }],
  });
  const block = msg.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");
  return block.text.trim();
}

// GET — return stats for both fields
export async function GET() {
  const [
    explanationTotal,
    explanationMissing,
    wrongTotal,
    wrongMissing,
  ] = await Promise.all([
    prisma.question.count({ where: { explanationEn: { not: "" } } }),
    prisma.question.count({
      where: {
        explanationEn: { not: "" },
        explanationAr: "",
      },
    }),
    prisma.question.count({ where: { wrongExplanationEn: { not: null } } }),
    prisma.question.count({
      where: {
        wrongExplanationEn: { not: null },
        OR: [{ wrongExplanationAr: null }, { wrongExplanationAr: "" }],
      },
    }),
  ]);

  return NextResponse.json({
    explanation: {
      total: explanationTotal,
      missing: explanationMissing,
      done: explanationTotal - explanationMissing,
    },
    wrongExplanation: {
      total: wrongTotal,
      missing: wrongMissing,
      done: wrongTotal - wrongMissing,
    },
    totalMissing: explanationMissing + wrongMissing,
  });
}

// POST — translate a batch (explanationAr first, then wrongExplanationAr)
export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set in environment variables." },
      { status: 500 }
    );
  }

  const { batchSize = 10 } = await req.json().catch(() => ({})) as { batchSize?: number };

  let translated = 0;
  const errors: string[] = [];
  let remaining = batchSize;

  // 1. Fill batch with missing explanationAr first
  if (remaining > 0) {
    const questions = await prisma.question.findMany({
      where: {
        explanationEn: { not: "" },
        explanationAr: "",
      },
      select: { id: true, explanationEn: true },
      take: remaining,
    });

    for (const q of questions) {
      if (!q.explanationEn) continue;
      try {
        const ar = await translate(q.explanationEn, EXPLANATION_PROMPT);
        await prisma.question.update({
          where: { id: q.id },
          data: { explanationAr: ar },
        });
        translated++;
      } catch (e) {
        errors.push(`Q${q.id} (explanation): ${String(e).slice(0, 100)}`);
      }
    }
    remaining -= questions.length;
  }

  // 2. Fill remainder of batch with missing wrongExplanationAr
  if (remaining > 0) {
    const questions = await prisma.question.findMany({
      where: {
        wrongExplanationEn: { not: null },
        OR: [{ wrongExplanationAr: null }, { wrongExplanationAr: "" }],
      },
      select: { id: true, wrongExplanationEn: true },
      take: remaining,
    });

    for (const q of questions) {
      if (!q.wrongExplanationEn) continue;
      try {
        const ar = await translate(q.wrongExplanationEn, WRONG_EXPLANATION_PROMPT);
        await prisma.question.update({
          where: { id: q.id },
          data: { wrongExplanationAr: ar },
        });
        translated++;
      } catch (e) {
        errors.push(`Q${q.id} (wrong): ${String(e).slice(0, 100)}`);
      }
    }
  }

  // Recalculate total remaining
  const [explMissing, wrongMissing] = await Promise.all([
    prisma.question.count({
      where: {
        explanationEn: { not: "" },
        explanationAr: "",
      },
    }),
    prisma.question.count({
      where: {
        wrongExplanationEn: { not: null },
        OR: [{ wrongExplanationAr: null }, { wrongExplanationAr: "" }],
      },
    }),
  ]);

  const totalRemaining = explMissing + wrongMissing;

  if (translated === 0 && totalRemaining === 0) {
    return NextResponse.json({
      translated: 0,
      remaining: 0,
      message: "All done — every question has Arabic explanations.",
    });
  }

  return NextResponse.json({ translated, remaining: totalRemaining, errors });
}
