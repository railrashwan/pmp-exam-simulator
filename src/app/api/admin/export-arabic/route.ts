import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        examSet: true,
        domain: true,
        questionTextEn: true,
        explanationEn: true,
        explanationAr: true,
        wrongExplanationEn: true,
        wrongExplanationAr: true,
      },
    });

    // Only export questions that are missing Arabic explanation
    const missing = questions.filter(
      (q) => !q.explanationAr || q.explanationAr.trim() === ""
    );

    const lines: string[] = [
      "# Arabic Explanation Export",
      `Generated: ${new Date().toISOString().slice(0, 10)}`,
      `Missing: ${missing.length} of ${questions.length} questions`,
      "",
      "Instructions:",
      "- Fill in the **Explanation AR:** section for each question.",
      "- Optionally fill in **Wrong Explanations AR:** (same format as EN).",
      "- Do NOT change the `<!-- Q:ID -->` comment lines.",
      "- Save the file and upload it back on the same page.",
      "",
      "---",
      "",
    ];

    for (const q of missing) {
      lines.push(`<!-- Q:${q.id} -->`);
      lines.push(`## Q${q.id} | ${q.domain}${q.examSet ? ` | ${q.examSet}` : ""}`);
      lines.push("");
      lines.push("**Question EN:**");
      lines.push(q.questionTextEn ?? "");
      lines.push("");
      lines.push("**Explanation EN:**");
      lines.push(q.explanationEn ?? "");
      lines.push("");
      lines.push("**Explanation AR:**");
      lines.push("");
      lines.push("");
      if (q.wrongExplanationEn) {
        lines.push("**Wrong Explanations EN:**");
        lines.push(q.wrongExplanationEn);
        lines.push("");
        lines.push("**Wrong Explanations AR:**");
        lines.push("");
        lines.push("");
      }
      lines.push("---");
      lines.push("");
    }

    const markdown = lines.join("\n");
    const filename = `arabic-export-${new Date().toISOString().slice(0, 10)}.md`;

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
