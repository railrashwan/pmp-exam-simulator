import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_DOMAINS = new Set(["People", "Process", "Business Environment"]);
const VALID_ANSWERS = new Set(["A", "B", "C", "D"]);

function parseId(id: string): number | null {
  const n = parseInt(id, 10);
  return isNaN(n) || n <= 0 ? null : n;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(question);
  } catch (e) {
    console.error("GET /api/questions/[id] error:", e);
    return NextResponse.json({ error: "Failed to fetch question" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const body = await req.json();
    const {
      domain, questionTextEn, questionTextAr,
      optionAEn, optionAAr, optionBEn, optionBAr,
      optionCEn, optionCAr, optionDEn, optionDAr,
      correctAnswer, explanationEn, explanationAr,
    } = body;

    if (domain && !VALID_DOMAINS.has(domain)) {
      return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
    }
    if (correctAnswer && !VALID_ANSWERS.has(correctAnswer)) {
      return NextResponse.json({ error: "correctAnswer must be A, B, C, or D" }, { status: 400 });
    }

    const question = await prisma.question.update({
      where: { id },
      data: {
        domain, questionTextEn, questionTextAr,
        optionAEn, optionAAr, optionBEn, optionBAr,
        optionCEn, optionCAr, optionDEn, optionDAr,
        correctAnswer, explanationEn, explanationAr,
      },
    });

    return NextResponse.json(question);
  } catch (e) {
    console.error("PUT /api/questions/[id] error:", e);
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    await prisma.question.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/questions/[id] error:", e);
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
