import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ParsedEntry {
  id: number;
  explanationAr: string;
  wrongExplanationAr?: string;
}

function parseMarkdown(text: string): ParsedEntry[] {
  const entries: ParsedEntry[] = [];

  // Split on blank lines between blocks (each block starts with <!-- id:N -->)
  // We split on the id marker to get clean blocks
  const blocks = text.split(/(?=<!-- id:\d+ -->)/);

  for (const block of blocks) {
    const idMatch = block.match(/<!-- id:(\d+) -->/);
    if (!idMatch) continue;
    const id = parseInt(idMatch[1], 10);
    if (isNaN(id)) continue;

    const lines = block.split("\n");
    let explanationAr = "";
    let wrongExplanationAr: string | undefined;

    for (const line of lines) {
      if (line.startsWith("Why Correct AR:")) {
        explanationAr = line.slice("Why Correct AR:".length).trim();
      } else if (line.startsWith("Why Wrong AR:")) {
        wrongExplanationAr = line.slice("Why Wrong AR:".length).trim();
      }
    }

    if (!explanationAr) continue; // skip if still empty

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
        { error: "No filled-in Arabic explanations found. Make sure you filled in 'Why Correct AR:' lines." },
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
        errors.push(`Q id=${entry.id}: not found or update failed`);
      }
    }

    return NextResponse.json({ saved, total: entries.length, errors });
  } catch (e) {
    console.error("import-arabic error:", e);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
