import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";

const url = process.env.DATABASE_URL ?? `file:${path.resolve(process.cwd(), "dev.db")}`;
const authToken = process.env.DATABASE_AUTH_TOKEN;
const adapter = new PrismaLibSql({ url, authToken });
const prisma = new PrismaClient({ adapter } as never);

interface ParsedQuestion {
  examSet: string;
  globalBank: boolean;
  domain: string;
  questionTextEn: string;
  questionTextAr: string;
  optionAEn: string;
  optionAAr: string;
  optionBEn: string;
  optionBAr: string;
  optionCEn: string;
  optionCAr: string;
  optionDEn: string;
  optionDAr: string;
  correctAnswer: string;
  explanationEn: string;
  explanationAr: string;
  wrongExplanationEn: string | null;
  wrongExplanationAr: string | null;
}

function parseQuestions(markdown: string): ParsedQuestion[] {
  // Try to split by Q<number> or just <number> on its own line
  const blocks = markdown.split(/(?=^Q?\d+\s*$)/m).map((b) => b.trim()).filter(Boolean);
  const questions: ParsedQuestion[] = [];

  for (const block of blocks) {
    const lines = block.split("\n");
    const q: Record<string, string> = {};

    for (const line of lines) {
      const pick = (prefix: string) => {
        if (line.startsWith(prefix)) {
          q[prefix] = line.slice(prefix.length).trim();
          return true;
        }
        return false;
      };
      
      pick("Domain:") ||
        pick("Question EN:") ||
        pick("Question AR:") ||
        pick("A EN:") ||
        pick("A AR:") ||
        pick("B EN:") ||
        pick("B AR:") ||
        pick("C EN:") ||
        pick("C AR:") ||
        pick("D EN:") ||
        pick("D AR:") ||
        pick("Correct:") ||
        pick("Why Correct EN:") ||
        pick("Why Correct AR:") ||
        pick("Why Wrong EN:") ||
        pick("Why Wrong AR:");
    }

    if (!q["Domain:"] || !q["Question EN:"] || !q["Correct:"]) continue;

    questions.push({
      examSet: "eduhub",
      globalBank: false,
      domain: q["Domain:"],
      questionTextEn: q["Question EN:"],
      questionTextAr: q["Question AR:"] ?? "",
      optionAEn: q["A EN:"] ?? "",
      optionAAr: q["A AR:"] ?? "",
      optionBEn: q["B EN:"] ?? "",
      optionBAr: q["B AR:"] ?? "",
      optionCEn: q["C EN:"] ?? "",
      optionCAr: q["C AR:"] ?? "",
      optionDEn: q["D EN:"] ?? "",
      optionDAr: q["D AR:"] ?? "",
      correctAnswer: q["Correct:"],
      explanationEn: q["Why Correct EN:"] ?? "",
      explanationAr: q["Why Correct AR:"] ?? "",
      wrongExplanationEn: q["Why Wrong EN:"] ?? null,
      wrongExplanationAr: q["Why Wrong AR:"] ?? null,
    });
  }

  return questions;
}

async function main() {
  const files = process.argv.slice(2);

  if (files.length === 0) {
    console.error("Usage: npx tsx prisma/seed-eduhub.ts <file1.txt> [file2.txt]");
    process.exit(1);
  }

  // First, clear any existing eduhub records
  await prisma.question.deleteMany({
    where: { examSet: "eduhub" },
  });
  console.log("Cleared existing Eduhub questions.");

  const seenQuestions = new Set<string>();
  let totalAdded = 0;

  for (const file of files) {
    const filePath = path.resolve(file);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const questions = parseQuestions(content);

    if (questions.length === 0) {
      console.warn(`No questions parsed from ${file} — check the file format.`);
      continue;
    }

    let fileAdded = 0;
    for (const q of questions) {
      if (!seenQuestions.has(q.questionTextEn)) {
        await prisma.question.create({ data: q });
        seenQuestions.add(q.questionTextEn);
        fileAdded++;
        totalAdded++;
      }
    }
    console.log(`Seeding ${fileAdded} unique questions from ${path.basename(file)}...`);
  }
  
  console.log(`Done. ${totalAdded} unique questions added across all files.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
