import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_DOMAINS = new Set(["People", "Process", "Business Environment"]);
const VALID_ANSWERS = new Set(["A", "B", "C", "D"]);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const domain = searchParams.get("domain") ?? "";
    const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
    const rawLimit = parseInt(searchParams.get("limit") ?? "20", 10);
    const page = isNaN(rawPage) ? 1 : Math.max(1, rawPage);
    const limit = isNaN(rawLimit) ? 20 : Math.min(Math.max(rawLimit, 1), 100);

    const where: Record<string, unknown> = {};
    if (domain && VALID_DOMAINS.has(domain)) where.domain = domain;
    if (search) {
      where.OR = [
        { questionTextEn: { contains: search } },
        { questionTextAr: { contains: search } },
      ];
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.question.count({ where }),
    ]);

    return NextResponse.json({ questions, total, page, limit });
  } catch (e) {
    console.error("GET /api/questions error:", e);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      domain, questionTextEn, questionTextAr,
      optionAEn, optionAAr, optionBEn, optionBAr,
      optionCEn, optionCAr, optionDEn, optionDAr,
      correctAnswer, explanationEn, explanationAr,
    } = body;

    if (!domain || !questionTextEn || !questionTextAr || !correctAnswer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!VALID_DOMAINS.has(domain)) {
      return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
    }
    if (!VALID_ANSWERS.has(correctAnswer)) {
      return NextResponse.json({ error: "correctAnswer must be A, B, C, or D" }, { status: 400 });
    }

    const question = await prisma.question.create({
      data: {
        domain, questionTextEn, questionTextAr,
        optionAEn, optionAAr, optionBEn, optionBAr,
        optionCEn, optionCAr, optionDEn, optionDAr,
        correctAnswer, explanationEn, explanationAr,
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (e) {
    console.error("POST /api/questions error:", e);
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
  }
}
