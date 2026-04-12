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

const OPTION_EXPLANATION_PROMPT = `You are an expert Arabic translator specializing in project management (PMP) content.
Translate the following English PMP exam per-option explanation into natural, fluent Arabic.

Rules:
- Convey the MEANING faithfully — do NOT translate word-for-word
- Use clear, professional Arabic suitable for PMP exam study material
- Keep PMP terminology consistent (e.g. project charter = ميثاق المشروع, stakeholder = أصحاب المصلحة, etc.)
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

const OPTION_KEYS = ["A", "B", "C", "D"] as const;
type OptionKey = (typeof OPTION_KEYS)[number];

function optionEnField(key: OptionKey) { return `explanation${key}En` as const; }
function optionArField(key: OptionKey) { return `explanation${key}Ar` as const; }

// GET — return stats for explanation and per-option explanation fields
export async function GET() {
  const [explanationTotal, explanationMissing, optionTotal, optionMissing] = await Promise.all([
    prisma.question.count({ where: { explanationEn: { not: "" } } }),
    prisma.question.count({ where: { explanationEn: { not: "" }, explanationAr: "" } }),
    prisma.question.count({
      where: {
        OR: OPTION_KEYS.map((k) => ({ [optionEnField(k)]: { not: null } })),
      },
    }),
    prisma.question.count({
      where: {
        OR: OPTION_KEYS.map((k) => ({
          AND: [
            { [optionEnField(k)]: { not: null } },
            { OR: [{ [optionArField(k)]: null }, { [optionArField(k)]: "" }] },
          ],
        })),
      },
    }),
  ]);

  return NextResponse.json({
    explanation: {
      total: explanationTotal,
      missing: explanationMissing,
      done: explanationTotal - explanationMissing,
    },
    optionExplanation: {
      total: optionTotal,
      missing: optionMissing,
      done: optionTotal - optionMissing,
    },
    totalMissing: explanationMissing + optionMissing,
  });
}

// POST — translate a batch (explanationAr first, then per-option explanation AR fields)
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
      where: { explanationEn: { not: "" }, explanationAr: "" },
      select: { id: true, explanationEn: true },
      take: remaining,
    });

    for (const q of questions) {
      if (!q.explanationEn) continue;
      try {
        const ar = await translate(q.explanationEn, EXPLANATION_PROMPT);
        await prisma.question.update({ where: { id: q.id }, data: { explanationAr: ar } });
        translated++;
      } catch (e) {
        errors.push(`Q${q.id} (explanation): ${String(e).slice(0, 100)}`);
      }
    }
    remaining -= questions.length;
  }

  // 2. Fill remainder with questions that have any missing per-option AR explanation
  if (remaining > 0) {
    const selectFields = Object.fromEntries(
      OPTION_KEYS.flatMap((k) => [[optionEnField(k), true], [optionArField(k), true]])
    );
    const questions = await prisma.question.findMany({
      where: {
        OR: OPTION_KEYS.map((k) => ({
          AND: [
            { [optionEnField(k)]: { not: null } },
            { OR: [{ [optionArField(k)]: null }, { [optionArField(k)]: "" }] },
          ],
        })),
      },
      select: { id: true, ...selectFields },
      take: remaining,
    });

    for (const q of questions) {
      for (const key of OPTION_KEYS) {
        const enVal = (q as Record<string, unknown>)[optionEnField(key)] as string | null;
        const arVal = (q as Record<string, unknown>)[optionArField(key)] as string | null;
        if (!enVal || arVal) continue;
        try {
          const ar = await translate(enVal, OPTION_EXPLANATION_PROMPT);
          await prisma.question.update({
            where: { id: q.id },
            data: { [optionArField(key)]: ar },
          });
          translated++;
        } catch (e) {
          errors.push(`Q${q.id} (option ${key}): ${String(e).slice(0, 100)}`);
        }
      }
    }
  }

  // Recalculate total remaining
  const [explMissing, optMissing] = await Promise.all([
    prisma.question.count({ where: { explanationEn: { not: "" }, explanationAr: "" } }),
    prisma.question.count({
      where: {
        OR: OPTION_KEYS.map((k) => ({
          AND: [
            { [optionEnField(k)]: { not: null } },
            { OR: [{ [optionArField(k)]: null }, { [optionArField(k)]: "" }] },
          ],
        })),
      },
    }),
  ]);

  const totalRemaining = explMissing + optMissing;

  if (translated === 0 && totalRemaining === 0) {
    return NextResponse.json({
      translated: 0,
      remaining: 0,
      message: "All done — every question has Arabic explanations.",
    });
  }

  return NextResponse.json({ translated, remaining: totalRemaining, errors });
}
