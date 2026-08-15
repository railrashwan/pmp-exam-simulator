# Question bank export — runbook

The bulk of the question bank has never been in version control. The committed
files (`prisma/data/questions.json`, `prisma/data/undraw-questions.json`) hold 89
questions; the Andrew Ultra, Yassine, Helena and EduHub sets were loaded by seed
scripts from `.md` files that are not in the repo, so they exist only inside a
local `dev.db` (and possibly in the Turso database, if one was ever provisioned).

`prisma/export-bank.ts` exports every table to JSON, reports content health, and
verifies the export round-trips.

## Before you run anything

**Do not commit exported questions to a public repository.** `railrashwan/pmp-exam-simulator`
is public today. The banks are derived from third-party commercial prep material
(Andrew Ramdayal, EduHub, and others); publishing them is redistribution of
someone else's paid content. Make the repository private — or push the export to
a separate private repository — before committing any question data.

The export directory is git-ignored for exactly this reason. Remove the entry in
`.gitignore` once the destination repository is private.

## 1. Take a cold copy of the database first

Never run tooling against the only copy. With the dev server stopped:

```bash
cp prisma/dev.db ~/pmp-bank-backup-$(date +%Y%m%d).db
# if -wal / -shm files exist, copy them too, or checkpoint first:
sqlite3 prisma/dev.db "PRAGMA wal_checkpoint(TRUNCATE);"
```

Keep that copy somewhere that is not the project directory.

## 2. Export and verify

```bash
npm run db:export -- --verify
```

To export a database that lives elsewhere (an older project folder, a backup):

```bash
npx tsx prisma/export-bank.ts "/path/to/other/dev.db" --out prisma/data/export-old --verify
```

The script:

- reads SQLite directly, read-only — it does not need Prisma, `DATABASE_URL`, or a
  current schema, and cannot modify the source;
- writes one JSON file per table plus `manifest.json` (row counts, column lists,
  per-table SHA-256 of the contents);
- prints question counts by exam set and by domain;
- flags content problems: missing Arabic text or explanations, duplicate English
  stems, `correctAnswer` outside A–D, U+FFFD replacement characters, and `*Ar`
  fields containing no Arabic script (the signature of mojibake);
- with `--verify`, reloads the JSON into a throwaway SQLite database, re-reads it,
  and compares row counts and hashes against the source. Non-zero exit on mismatch.

## 3. Check the numbers against expectations

The home page advertises Andrew Ultra 200, Yassine 180, Helena 180, EduHub 180.
Compare those to the `by exam set` breakdown. A shortfall means part of a bank was
never seeded, and the `.md` source files still matter.

Spot-check Arabic rendering by eye — open `prisma/data/export/Question.json` and read
a few `questionTextAr` values. Hash equality proves faithful copying, not that the
text in the database was ever correct.

## 4. Also export the Turso database, if one exists

If `DATABASE_URL` was ever pointed at Turso, that database is a second copy and may
be ahead of or behind the local file:

```bash
turso db shell <database-name> .dump > turso-dump.sql
sqlite3 /tmp/turso.db < turso-dump.sql
npx tsx prisma/export-bank.ts /tmp/turso.db --out prisma/data/export-turso --verify
```

Compare the two manifests before deciding which copy is authoritative.

## 5. Recover the seed source files

`prisma/seed-*.ts` parse `.md` files passed on the command line. Those files are the
pre-database form of the content and are worth archiving alongside the export.
`prisma/migrate-from-old-db.ts` also points at an older database:

```
/Users/rashwan/Downloads/untitled folder/PMP Exam Simulator/dev.db
```

If that path still exists, export it too — it may contain rows that never made the
migration.
