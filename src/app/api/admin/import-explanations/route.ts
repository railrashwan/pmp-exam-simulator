import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Parses the markdown file produced by export-explanations
// Extracts: Q<id> sections → wrongExplanationAr content
function parseMarkdown(text: string): Record<number, string> {
  const result: Record<number, string> = {};

  // Split into question blocks by "## Q<id>"
  const blocks = text.split(/^## Q(\d+)/m);
  // blocks: ["preamble", "id1", "content1", "id2", "content2", ...]
  for (let i = 1; i < blocks.length; i += 2) {
    const id = parseInt(blocks[i], 10);
    const content = blocks[i + 1] ?? "";

    // Extract wrongExplanationAr code block (the second ``` block)
    const codeBlocks = [...content.matchAll(/```\n([\s\S]*?)```/g)];
    if (codeBlocks.length >= 2) {
      const ar = codeBlocks[1][1].trim();
      if (ar) result[id] = ar;
    }
  }

  return result;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "file field required" }, { status: 400 });
  }

  const text = await file.text();
  const updates = parseMarkdown(text);
  const ids = Object.keys(updates).map(Number);

  if (ids.length === 0) {
    return NextResponse.json({ error: "No wrongExplanationAr entries found in file" }, { status: 400 });
  }

  let updated = 0;
  for (const id of ids) {
    await prisma.question.update({
      where: { id },
      data: { wrongExplanationAr: updates[id] },
    });
    updated++;
  }

  return NextResponse.json({ updated, total: ids.length });
}
