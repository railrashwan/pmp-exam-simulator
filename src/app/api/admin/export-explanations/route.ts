import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const examSet = req.nextUrl.searchParams.get("examSet");
  if (!examSet) {
    return NextResponse.json({ error: "examSet param required" }, { status: 400 });
  }

  const questions = await prisma.question.findMany({
    where: { examSet },
    select: {
      id: true,
      questionTextEn: true,
      correctAnswer: true,
      wrongExplanationEn: true,
      wrongExplanationAr: true,
    },
    orderBy: { id: "asc" },
  });

  if (questions.length === 0) {
    return NextResponse.json({ error: `No questions found for examSet: ${examSet}` }, { status: 404 });
  }

  // Build markdown
  const lines: string[] = [
    `# Wrong Answer Explanations — ${examSet}`,
    ``,
    `**Instructions:** Fill in the \`wrongExplanationAr\` column for each question. Keep the same format as \`wrongExplanationEn\`: \`A: reason. B: reason. C: reason. D: reason.\` (skip the correct answer letter or write N/A for it).`,
    ``,
    `---`,
    ``,
  ];

  for (const q of questions) {
    lines.push(`## Q${q.id}`);
    lines.push(`**Question:** ${q.questionTextEn}`);
    lines.push(`**Correct Answer:** ${q.correctAnswer}`);
    lines.push(``);
    lines.push(`**wrongExplanationEn:**`);
    lines.push(`\`\`\``);
    lines.push(q.wrongExplanationEn ?? "(empty)");
    lines.push(`\`\`\``);
    lines.push(``);
    lines.push(`**wrongExplanationAr:** _(fill this in)_`);
    lines.push(`\`\`\``);
    lines.push(q.wrongExplanationAr ?? "");
    lines.push(`\`\`\``);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  }

  const markdown = lines.join("\n");

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="wrong-explanations-${examSet}.md"`,
    },
  });
}
