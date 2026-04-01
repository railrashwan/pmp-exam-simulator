import "dotenv/config";
import path from "node:path";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";
import questions from "./data/questions.json";

const url = process.env.DATABASE_URL ?? `file:${path.resolve(process.cwd(), "dev.db")}`;
const authToken = process.env.DATABASE_AUTH_TOKEN;
const adapter = new PrismaLibSql({ url, authToken });
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  console.log("Seeding database with PMP questions...");

  await prisma.question.deleteMany();

  for (const q of questions) {
    await prisma.question.create({ data: q });
  }

  console.log(`✅ Seeded ${questions.length} questions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
