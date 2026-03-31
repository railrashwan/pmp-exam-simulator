import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidExamSet } from "@/lib/exam-sets";

interface ParsedQuestion {
  examSet: string;
  globalBank: boolean;
  domain: string;
  questionTextEn: string;
  questionTextAr: string;
  optionAEn: string;
  optionAAr: string;
  optionBEn: string;
  optionBAr: string;
  optionCEn: string;
  optionCAr: string;
  optionDEn: string;
  optionDAr: string;
  correctAnswer: string;
  explanationEn: string;
  explanationAr: string;
  wrongExplanationEn: string | null;
  wrongExplanationAr: string | null;
}

function parseQuestions(markdown: string, examSet: string): ParsedQuestion[] {
  const blocks = markdown.split(/(?=^Q?\d+\s*$)/m).map((b) => b.trim()).filter(Boolean);
  const questions: ParsedQuestion[] = [];

  for (const block of blocks) {
    const lines = block.split("\n");
    const q: Record<string, string> = {};

    for (const line of lines) {
      const pick = (prefix: string) => {
        if (line.startsWith(prefix)) {
          q[prefix] = line.slice(prefix.length).trim();
          return true;
        }
        return false;
      };
      pick("Domain:") ||
        pick("Question EN:") ||
        pick("Question AR:") ||
        pick("A EN:") || pick("A AR:") ||
        pick("B EN:") || pick("B AR:") ||
        pick("C EN:") || pick("C AR:") ||
        pick("D EN:") || pick("D AR:") ||
        pick("Correct:") ||
        pick("Why Correct EN:") || pick("Why Correct AR:") ||
        pick("Why Wrong EN:") || pick("Why Wrong AR:");
    }

    if (!q["Domain:"] || !q["Question EN:"] || !q["Correct:"]) continue;

    questions.push({
      examSet,
      globalBank: false,
      domain: q["Domain:"],
      questionTextEn: q["Question EN:"],
      questionTextAr: q["Question AR:"] ?? "",
      optionAEn: q["A EN:"] ?? "",
      optionAAr: q["A AR:"] ?? "",
      optionBEn: q["B EN:"] ?? "",
      optionBAr: q["B AR:"] ?? "",
      optionCEn: q["C EN:"] ?? "",
      optionCAr: q["C AR:"] ?? "",
      optionDEn: q["D EN:"] ?? "",
      optionDAr: q["D AR:"] ?? "",
      correctAnswer: q["Correct:"],
      explanationEn: q["Why Correct EN:"] ?? "",
      explanationAr: q["Why Correct AR:"] ?? "",
      wrongExplanationEn: q["Why Wrong EN:"] ?? null,
      wrongExplanationAr: q["Why Wrong AR:"] ?? null,
    });
  }

  return questions;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { content: string; examSet: string; replace: boolean };
    const { content, examSet, replace } = body;

    if (!content || !examSet) {
      return NextResponse.json({ error: "Missing content or examSet" }, { status: 400 });
    }

    if (!isValidExamSet(examSet)) {
      return NextResponse.json({ error: `Unknown examSet "${examSet}"` }, { status: 400 });
    }

    const questions = parseQuestions(content, examSet);

    if (questions.length === 0) {
      return NextResponse.json({ error: "No questions parsed — check the file format" }, { status: 422 });
    }

    if (replace) {
      await prisma.question.deleteMany({ where: { examSet } });
    }

    for (const q of questions) {
      await prisma.question.create({ data: q });
    }

    const total = await prisma.question.count({ where: { examSet } });

    return NextResponse.json({
      inserted: questions.length,
      totalInDb: total,
      message: `${questions.length} questions inserted. Total for "${examSet}": ${total}.`,
    });
  } catch (e) {
    console.error("seed error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const examSet = searchParams.get("examSet") ?? "helena";
  const count = await prisma.question.count({ where: { examSet } });
  return NextResponse.json({ examSet, count });
}
