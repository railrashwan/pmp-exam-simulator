import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

interface ParsedEntry {
  id: number;
  explanationAr: string;
  explanationAAr?: string;
  explanationBAr?: string;
  explanationCAr?: string;
  explanationDAr?: string;
}

function parseMarkdown(text: string): ParsedEntry[] {
  const entries: ParsedEntry[] = [];

  const blocks = text.split(/(?=<!-- id:\d+ -->)/);

  for (const block of blocks) {
    const idMatch = block.match(/<!-- id:(\d+) -->/);
    if (!idMatch) continue;
    const id = parseInt(idMatch[1], 10);
    if (isNaN(id)) continue;

    const lines = block.split("\n");
    let explanationAr = "";
    const optionAr: Partial<Record<string, string>> = {};

    for (const line of lines) {
      if (line.startsWith("Why Correct AR:")) {
        explanationAr = line.slice("Why Correct AR:".length).trim();
      } else {
        for (const key of OPTION_KEYS) {
          const prefix = `Option ${key} Explanation AR:`;
          if (line.startsWith(prefix)) {
            const val = line.slice(prefix.length).trim();
            if (val) optionAr[key] = val;
          }
        }
      }
    }

    if (!explanationAr) continue;

    entries.push({
      id,
      explanationAr,
      ...(optionAr.A ? { explanationAAr: optionAr.A } : {}),
      ...(optionAr.B ? { explanationBAr: optionAr.B } : {}),
      ...(optionAr.C ? { explanationCAr: optionAr.C } : {}),
      ...(optionAr.D ? { explanationDAr: optionAr.D } : {}),
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
            ...(entry.explanationAAr !== undefined ? { explanationAAr: entry.explanationAAr } : {}),
            ...(entry.explanationBAr !== undefined ? { explanationBAr: entry.explanationBAr } : {}),
            ...(entry.explanationCAr !== undefined ? { explanationCAr: entry.explanationCAr } : {}),
            ...(entry.explanationDAr !== undefined ? { explanationDAr: entry.explanationDAr } : {}),
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
