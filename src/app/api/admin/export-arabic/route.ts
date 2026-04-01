import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const examSet = searchParams.get("examSet");

    if (!examSet) {
      return NextResponse.json({ error: "Missing examSet param" }, { status: 400 });
    }

    const questions = await prisma.question.findMany({
      where: { examSet },
      orderBy: { id: "asc" },
      select: {
        id: true,
        domain: true,
        questionTextEn: true,
        questionTextAr: true,
        optionAEn: true, optionAAr: true,
        optionBEn: true, optionBAr: true,
        optionCEn: true, optionCAr: true,
        optionDEn: true, optionDAr: true,
        correctAnswer: true,
        explanationEn: true,
        explanationAr: true,
        wrongExplanationEn: true,
        wrongExplanationAr: true,
      },
    });

    // Only include questions missing Arabic explanation
    const missing = questions.filter(
      (q) => !q.explanationAr || q.explanationAr.trim() === ""
    );

    if (missing.length === 0) {
      return NextResponse.json(
        { error: `All ${questions.length} questions in "${examSet}" already have Arabic explanations.` },
        { status: 404 }
      );
    }

    const date = new Date().toISOString().slice(0, 10);
    const lines: string[] = [
      `# Arabic Translation — ${examSet}`,
      `# Generated: ${date}`,
      `# Total needing translation: ${missing.length} of ${questions.length}`,
      `#`,
      `# Instructions:`,
      `# 1. Fill in "Why Correct AR:" for each question.`,
      `# 2. Optionally fill in "Why Wrong AR:" if the EN version exists.`,
      `# 3. Do NOT change the <!-- id:N --> lines — they identify each question.`,
      `# 4. Upload this file on Admin → Arabic Export page when done.`,
      ``,
    ];

    let seq = 1;
    for (const q of missing) {
      lines.push(`<!-- id:${q.id} -->`);
      lines.push(`Q${seq}`);
      lines.push(`Domain: ${q.domain}`);
      lines.push(`Question EN: ${q.questionTextEn}`);
      lines.push(`Question AR: ${q.questionTextAr ?? ""}`);
      lines.push(`A EN: ${q.optionAEn}`);
      lines.push(`A AR: ${q.optionAAr ?? ""}`);
      lines.push(`B EN: ${q.optionBEn}`);
      lines.push(`B AR: ${q.optionBAr ?? ""}`);
      lines.push(`C EN: ${q.optionCEn}`);
      lines.push(`C AR: ${q.optionCAr ?? ""}`);
      lines.push(`D EN: ${q.optionDEn}`);
      lines.push(`D AR: ${q.optionDAr ?? ""}`);
      lines.push(`Correct: ${q.correctAnswer}`);
      lines.push(`Why Correct EN: ${q.explanationEn ?? ""}`);
      lines.push(`Why Correct AR: `);
      if (q.wrongExplanationEn) {
        lines.push(`Why Wrong EN: ${q.wrongExplanationEn}`);
        lines.push(`Why Wrong AR: `);
      }
      lines.push(``);
      seq++;
    }

    const markdown = lines.join("\n");
    const filename = `arabic-${examSet}-${date}.md`;

    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error("export-arabic error:", e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
