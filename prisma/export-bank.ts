/**
 * Export the entire local question bank + study history to versioned JSON.
 *
 * This is a data-rescue tool: the bulk of the question bank exists only in an
 * untracked local `dev.db`. It reads SQLite directly (read-only) so it does not
 * depend on Prisma client generation, environment variables, or the schema
 * being current.
 *
 *   npx tsx prisma/export-bank.ts [path/to/dev.db] [--out <dir>] [--verify]
 *
 * Defaults: source `prisma/dev.db` (then `./dev.db`), output `prisma/data/export`.
 *
 * `--verify` round-trips the export: it loads the emitted JSON into a fresh
 * throwaway SQLite database, re-reads it, and compares row counts and content
 * hashes against the source. Exits non-zero on any mismatch.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";

/** Tables exported, in dependency order (parents before children). */
const TABLES = [
  "Question",
  "ExamAttempt",
  "AttemptResult",
  "DomainResult",
  "SpacedRepCard",
  "ReviewLog",
] as const;

type TableName = (typeof TABLES)[number];
type Row = Record<string, unknown>;

interface TableManifest {
  rows: number;
  columns: string[];
  sha256: string;
}

interface Manifest {
  exportedAt: string;
  source: string;
  tables: Record<string, TableManifest>;
  questionStats: QuestionStats;
}

interface QuestionStats {
  total: number;
  byExamSet: Record<string, number>;
  byDomain: Record<string, number>;
  missingArabicText: number;
  missingArabicExplanation: number;
  missingEnglishExplanation: number;
  withPerOptionExplanations: number;
  replacementChars: number;
  nonArabicArabicFields: number;
  duplicateStems: number;
  invalidCorrectAnswer: number;
}

const ARABIC = /[\u0600-\u06FF]/;

function parseArgs(argv: string[]) {
  const positional: string[] = [];
  let out = path.join("prisma", "data", "export");
  let verify = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--verify") verify = true;
    else if (arg === "--out") out = argv[++i] ?? out;
    else if (arg.startsWith("--out=")) out = arg.slice("--out=".length);
    else positional.push(arg);
  }

  return { source: positional[0], out, verify };
}

function resolveSource(explicit: string | undefined): string {
  const candidates = explicit
    ? [explicit]
    : [path.join("prisma", "dev.db"), "dev.db"];

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (fs.existsSync(resolved)) return resolved;
  }

  throw new Error(
    `No SQLite database found. Looked at: ${candidates.join(", ")}\n` +
      `Pass the path explicitly: npx tsx prisma/export-bank.ts /path/to/dev.db`
  );
}

function listTables(db: Database.Database): Set<string> {
  const rows = db
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`)
    .all() as { name: string }[];
  return new Set(rows.map((r) => r.name));
}

/**
 * Stable hash of a table's contents: key order is normalised so the hash
 * depends on data only, not on column ordering or JSON formatting.
 */
function hashRows(rows: Row[]): string {
  const hash = crypto.createHash("sha256");
  for (const row of rows) {
    const keys = Object.keys(row).sort();
    hash.update(keys.map((k) => `${k}=${String(row[k])}`).join("\u0001"));
    hash.update("\u0002");
  }
  return hash.digest("hex");
}

function readTable(db: Database.Database, table: TableName): Row[] {
  return db.prepare(`SELECT * FROM "${table}" ORDER BY id ASC`).all() as Row[];
}

function countBy(rows: Row[], column: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const key = String(row[column] ?? "(null)");
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts).sort((a, b) => b[1] - a[1])
  );
}

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || String(value).trim() === "";
}

const ARABIC_FIELDS = [
  "questionTextAr",
  "optionAAr",
  "optionBAr",
  "optionCAr",
  "optionDAr",
  "explanationAr",
] as const;

const PER_OPTION_FIELDS = [
  "explanationAEn",
  "explanationBEn",
  "explanationCEn",
  "explanationDEn",
] as const;

function analyseQuestions(rows: Row[]): QuestionStats {
  const stems = new Map<string, number>();
  let replacementChars = 0;
  let nonArabicArabicFields = 0;
  let missingArabicText = 0;
  let missingArabicExplanation = 0;
  let missingEnglishExplanation = 0;
  let withPerOptionExplanations = 0;
  let invalidCorrectAnswer = 0;

  for (const row of rows) {
    for (const value of Object.values(row)) {
      if (typeof value === "string" && value.includes("\uFFFD")) replacementChars++;
    }

    for (const field of ARABIC_FIELDS) {
      const value = row[field];
      if (!isBlank(value) && !ARABIC.test(String(value))) nonArabicArabicFields++;
    }

    if (isBlank(row.questionTextAr)) missingArabicText++;
    if (isBlank(row.explanationAr)) missingArabicExplanation++;
    if (isBlank(row.explanationEn)) missingEnglishExplanation++;
    if (PER_OPTION_FIELDS.some((f) => !isBlank(row[f]))) withPerOptionExplanations++;

    if (!["A", "B", "C", "D"].includes(String(row.correctAnswer ?? "").trim().toUpperCase())) {
      invalidCorrectAnswer++;
    }

    const stem = String(row.questionTextEn ?? "").trim().toLowerCase();
    if (stem) stems.set(stem, (stems.get(stem) ?? 0) + 1);
  }

  const duplicateStems = [...stems.values()].filter((n) => n > 1).length;

  return {
    total: rows.length,
    byExamSet: countBy(rows, "examSet"),
    byDomain: countBy(rows, "domain"),
    missingArabicText,
    missingArabicExplanation,
    missingEnglishExplanation,
    withPerOptionExplanations,
    replacementChars,
    nonArabicArabicFields,
    duplicateStems,
    invalidCorrectAnswer,
  };
}

function exportTables(dbPath: string, outDir: string): Manifest {
  const db = new Database(dbPath, { readonly: true });
  try {
    const present = listTables(db);
    fs.mkdirSync(outDir, { recursive: true });

    const tables: Record<string, TableManifest> = {};
    let questionStats: QuestionStats | undefined;

    for (const table of TABLES) {
      if (!present.has(table)) {
        console.warn(`  ! table ${table} not present in source — skipped`);
        continue;
      }

      const rows = readTable(db, table);
      const file = path.join(outDir, `${table}.json`);
      fs.writeFileSync(file, JSON.stringify(rows, null, 2) + "\n", "utf8");

      tables[table] = {
        rows: rows.length,
        columns: rows.length > 0 ? Object.keys(rows[0]).sort() : [],
        sha256: hashRows(rows),
      };

      if (table === "Question") questionStats = analyseQuestions(rows);
      console.log(`  ${table.padEnd(14)} ${String(rows.length).padStart(6)} rows → ${file}`);
    }

    const manifest: Manifest = {
      exportedAt: new Date().toISOString(),
      source: path.basename(dbPath),
      tables,
      questionStats: questionStats ?? analyseQuestions([]),
    };

    fs.writeFileSync(
      path.join(outDir, "manifest.json"),
      JSON.stringify(manifest, null, 2) + "\n",
      "utf8"
    );

    return manifest;
  } finally {
    db.close();
  }
}

/**
 * Rebuild a throwaway SQLite database from the exported JSON and re-hash it.
 * Proves the JSON is a faithful, reloadable copy of the source.
 */
function verifyRoundTrip(outDir: string, manifest: Manifest): boolean {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bank-verify-"));
  const tmpDb = path.join(tmpDir, "roundtrip.db");
  const db = new Database(tmpDb);
  let ok = true;

  try {
    for (const [table, expected] of Object.entries(manifest.tables)) {
      const rows = JSON.parse(
        fs.readFileSync(path.join(outDir, `${table}.json`), "utf8")
      ) as Row[];

      if (rows.length === 0) {
        if (expected.rows !== 0) {
          console.error(`  ✗ ${table}: expected ${expected.rows} rows, JSON has 0`);
          ok = false;
        }
        continue;
      }

      const columns = Object.keys(rows[0]);
      const quoted = columns.map((c) => `"${c}"`).join(", ");
      db.exec(`CREATE TABLE "${table}" (${quoted})`);

      const insert = db.prepare(
        `INSERT INTO "${table}" (${quoted}) VALUES (${columns.map(() => "?").join(", ")})`
      );
      const insertAll = db.transaction((batch: Row[]) => {
        for (const row of batch) {
          insert.run(columns.map((c) => (row[c] === undefined ? null : (row[c] as never))));
        }
      });
      insertAll(rows);

      const reread = db.prepare(`SELECT * FROM "${table}" ORDER BY id ASC`).all() as Row[];
      const actualHash = hashRows(reread);

      if (reread.length !== expected.rows) {
        console.error(`  ✗ ${table}: ${expected.rows} rows in, ${reread.length} rows out`);
        ok = false;
      } else if (actualHash !== expected.sha256) {
        console.error(`  ✗ ${table}: content hash mismatch after round-trip`);
        ok = false;
      } else {
        console.log(`  ✓ ${table.padEnd(14)} ${reread.length} rows, hash matches`);
      }
    }
  } finally {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  return ok;
}

function reportQuestionStats(stats: QuestionStats): void {
  console.log(`\nQuestion bank — ${stats.total} questions`);
  console.log("  by exam set:");
  for (const [set, n] of Object.entries(stats.byExamSet)) {
    console.log(`    ${set.padEnd(16)} ${n}`);
  }
  console.log("  by domain:");
  for (const [domain, n] of Object.entries(stats.byDomain)) {
    console.log(`    ${domain.padEnd(22)} ${n}`);
  }

  console.log("\nContent health:");
  console.log(`  missing Arabic question text     ${stats.missingArabicText}`);
  console.log(`  missing Arabic explanation       ${stats.missingArabicExplanation}`);
  console.log(`  missing English explanation      ${stats.missingEnglishExplanation}`);
  console.log(`  have per-option explanations     ${stats.withPerOptionExplanations}`);
  console.log(`  duplicate English stems          ${stats.duplicateStems}`);
  console.log(`  correctAnswer not in A–D         ${stats.invalidCorrectAnswer}`);
  console.log(`  U+FFFD replacement characters    ${stats.replacementChars}`);
  console.log(`  *Ar fields with no Arabic script ${stats.nonArabicArabicFields}`);

  if (stats.replacementChars > 0 || stats.nonArabicArabicFields > 0) {
    console.warn(
      "\n  ! Possible encoding damage in Arabic content — inspect before trusting this export."
    );
  }
}

function main(): void {
  const { source, out, verify } = parseArgs(process.argv.slice(2));
  const dbPath = resolveSource(source);
  const outDir = path.resolve(out);

  console.log(`Exporting ${dbPath}\n`);
  const manifest = exportTables(dbPath, outDir);
  reportQuestionStats(manifest.questionStats);

  if (verify) {
    console.log("\nVerifying round-trip:");
    if (!verifyRoundTrip(outDir, manifest)) {
      console.error("\nRound-trip verification FAILED — do not trust this export.");
      process.exit(1);
    }
    console.log("\nRound-trip verified.");
  } else {
    console.log("\nRe-run with --verify to confirm the export round-trips.");
  }
}

main();
