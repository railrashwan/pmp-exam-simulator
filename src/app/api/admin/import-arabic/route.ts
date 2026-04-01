import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ParsedEntry {
  id: number;
  explanationAr: string;
  wrongExplanationAr?: string;
}

function parseMarkdown(text: string): ParsedEntry[] {
  const entries: ParsedEntry[] = [];

  // Split on --- section separators
  const blocks = text.split(/\n---\n/);

  for (const block of blocks) {
    // Extract question ID from <!-- Q:123 -->
    const idMatch = block.match(/<!--\s*Q:(\d+)\s*-->/);
    if (!idMatch) continue;
    const id = parseInt(idMatch[1], 10);
    if (isNaN(id)) continue;

    // Extract **Explanation AR:** section — content until next ** heading or end
    const arMatch = block.match(
      /\*\*Explanation AR:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/
    );
    const explanationAr = arMatch ? arMatch[1].trim() : "";
    if (!explanationAr) continue; // skip if still empty

    // Extract **Wrong Explanations AR:** section (optional)
    const wrongArMatch = block.match(
      /\*\*Wrong Explanations AR:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/
    );
    const wrongExplanationAr = wrongArMatch ? wrongArMatch[1].trim() : undefined;

    entries.push({
      id,
      explanationAr,
      ...(wrongExplanationAr ? { wrongExplanationAr } : {}),
    });
  }

  return entries;
}

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    if (!text) {
      return NextResponse.json({ error: "Empty body" }, { status: 400 });
    }

    const entries = parseMarkdown(text);
    if (entries.length === 0) {
      return NextResponse.json(
        { error: "No filled-in Arabic explanations found in the file." },
        { status: 400 }
      );
    }

    let saved = 0;
    const errors: string[] = [];

    for (const entry of entries) {
      try {
        await prisma.question.update({
          where: { id: entry.id },
          data: {
            explanationAr: entry.explanationAr,
            ...(entry.wrongExplanationAr !== undefined
              ? { wrongExplanationAr: entry.wrongExplanationAr }
              : {}),
          },
        });
        saved++;
      } catch {
        errors.push(`Q${entry.id}: not found or update failed`);
      }
    }

    return NextResponse.json({ saved, total: entries.length, errors });
  } catch (e) {
    console.error("import-arabic error:", e);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
