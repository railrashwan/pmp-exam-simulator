import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ExamQuestion } from "@/lib/types";

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SELECT_FIELDS = {
  id: true,
  examSet: true,
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
} as const;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const examSet = searchParams.get("examSet") ?? "pmp";

    if (examSet === "undraw") {
      const questions = await prisma.question.findMany({
        where: { examSet: "undraw" },
        select: SELECT_FIELDS,
        orderBy: { id: "asc" },
      });
      return NextResponse.json(questions as ExamQuestion[]);
    }

    if (examSet === "andrew-ultra") {
      const questions = await prisma.question.findMany({
        where: { examSet: "andrew-ultra" },
        select: SELECT_FIELDS,
        orderBy: { id: "asc" },
      });
      return NextResponse.json(questions as ExamQuestion[]);
    }

    if (examSet === "yassine") {
      const questions = await prisma.question.findMany({
        where: { examSet: "yassine" },
        select: SELECT_FIELDS,
        orderBy: { id: "asc" },
      });
      return NextResponse.json(questions as ExamQuestion[]);
    }

    if (examSet === "kill-mistakes") {
      const all = await prisma.attemptResult.findMany({
        select: { questionId: true, isCorrect: true },
        orderBy: { id: "asc" },
      });
      const latest = new Map<number, boolean>();
      for (const r of all) {
        latest.set(r.questionId, r.isCorrect);
      }
      const ids = [...latest.entries()]
        .filter(([, correct]) => !correct)
        .map(([id]) => id);
      if (ids.length === 0) return NextResponse.json([]);
      const questions = await prisma.question.findMany({
        where: { id: { in: ids } },
        select: SELECT_FIELDS,
      });
      return NextResponse.json(fisherYatesShuffle(questions) as ExamQuestion[]);
    }

    // Classic exam: domain-stratified selection from the three question banks
    // Distribution: 20% Business Environment, 40% People, 40% Process
    const rawCount = parseInt(searchParams.get("count") ?? "40", 10);
    const count = isNaN(rawCount) ? 40 : Math.min(Math.max(rawCount, 1), 180);

    const EXAM_SETS = ["andrew-ultra", "yassine", "undraw"];

    const businessCount = Math.round(count * 0.2);
    const peopleCount = Math.round(count * 0.4);
    const processCount = count - businessCount - peopleCount;

    const [businessQs, peopleQs, processQs] = await Promise.all([
      prisma.question.findMany({
        where: { examSet: { in: EXAM_SETS }, domain: "Business Environment" },
        select: SELECT_FIELDS,
      }),
      prisma.question.findMany({
        where: { examSet: { in: EXAM_SETS }, domain: "People" },
        select: SELECT_FIELDS,
      }),
      prisma.question.findMany({
        where: { examSet: { in: EXAM_SETS }, domain: "Process" },
        select: SELECT_FIELDS,
      }),
    ]);

    const selected = [
      ...fisherYatesShuffle(businessQs).slice(0, businessCount),
      ...fisherYatesShuffle(peopleQs).slice(0, peopleCount),
      ...fisherYatesShuffle(processQs).slice(0, processCount),
    ];

    return NextResponse.json(fisherYatesShuffle(selected) as ExamQuestion[]);
  } catch (e) {
    console.error("exam/start error:", e);
    return NextResponse.json({ error: "Failed to load questions" }, { status: 500 });
  }
}
