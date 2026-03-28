import "dotenv/config";
import path from "node:path";
import Database from "better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";

const OLD_DB = path.resolve(
  "/Users/rashwan/Downloads/untitled folder/PMP Exam Simulator/dev.db"
);
const EXAM_SETS = process.argv.slice(2);

if (EXAM_SETS.length === 0) {
  console.error("Usage: npx tsx prisma/migrate-from-old-db.ts <examSet1> [examSet2] ...");
  process.exit(1);
}

const url = process.env.DATABASE_URL ?? `file:${path.resolve(process.cwd(), "dev.db")}`;
const authToken = process.env.DATABASE_AUTH_TOKEN;
const adapter = new PrismaLibSql({ url, authToken });
const prisma = new PrismaClient({ adapter } as never);

const oldDb = new Database(OLD_DB, { readonly: true });

async function main() {
  for (const examSet of EXAM_SETS) {
    const rows = oldDb
      .prepare(`SELECT * FROM Question WHERE examSet = ?`)
      .all(examSet) as Record<string, unknown>[];

    if (rows.length === 0) {
      console.warn(`No questions found for examSet: ${examSet}`);
      continue;
    }

    console.log(`Migrating ${rows.length} questions for examSet: ${examSet}...`);

    for (const row of rows) {
      await prisma.question.create({
        data: {
          domain: row.domain as string,
          questionTextEn: row.questionTextEn as string,
          questionTextAr: row.questionTextAr as string,
          optionAEn: row.optionAEn as string,
          optionAAr: row.optionAAr as string,
          optionBEn: row.optionBEn as string,
          optionBAr: row.optionBAr as string,
          optionCEn: row.optionCEn as string,
          optionCAr: row.optionCAr as string,
          optionDEn: row.optionDEn as string,
          optionDAr: row.optionDAr as string,
          correctAnswer: row.correctAnswer as string,
          explanationEn: row.explanationEn as string,
          explanationAr: row.explanationAr as string,
          examSet: row.examSet as string,
          globalBank: Boolean(row.globalBank),
          wrongExplanationEn: (row.wrongExplanationEn as string) ?? null,
          wrongExplanationAr: (row.wrongExplanationAr as string) ?? null,
        },
      });
    }

    console.log(`✅ Done. ${rows.length} questions added for examSet: ${examSet}`);
  }
}

main()
  .then(() => { oldDb.close(); return prisma.$disconnect(); })
  .catch((e) => { console.error(e); oldDb.close(); prisma.$disconnect(); process.exit(1); });
