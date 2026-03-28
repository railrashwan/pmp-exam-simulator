# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run lint         # Run ESLint
npm run db:seed      # Seed the database with PMP exam questions
```

There is no test runner configured.

To run the database seed: `npx tsx prisma/seed.ts`

## Architecture

**PMP Exam Simulator** — a full-stack Next.js app with App Router, SQLite via Prisma, and Zustand for exam state.

### Data flow

1. Home page (`/`) lets users choose question count (10/20/40)
2. `GET /api/exam/start?count=N` fetches randomized questions (answers stripped)
3. Exam state lives in Zustand (`src/store/examStore.ts`), persisted to localStorage under key `pmp-exam-state`
4. On finish, `POST /api/exam/results` validates answers against the DB and returns scores
5. Results page reads response and displays domain-wise breakdown (passing: 65%)

### Key directories

- `src/app/api/` — REST endpoints: `/exam/start`, `/exam/results`, `/questions`, `/questions/[id]`
- `src/app/exam/` — exam-taking UI and results page
- `src/app/admin/` — question CRUD (list, new, edit)
- `src/components/exam/` — stateless exam UI components (timer, question grid, calculator, etc.)
- `src/lib/` — Prisma client singleton (`db.ts`), shared types (`types.ts`), bilingual labels (`labels.ts`)
- `src/store/examStore.ts` — Zustand store: answers, timer, marked-for-review, language toggle
- `prisma/` — schema (single `Question` model), migrations, seed script with 100+ bilingual questions

### Database

SQLite via Prisma with LibSQL adapter. Default file: `dev.db` in project root. Override with `DATABASE_URL` env var.

The `Question` model has bilingual fields (`*En` / `*Ar`) for question text, four options, explanation, and a `domain` field (`"People"`, `"Process"`, `"Business Environment"`).

### Bilingual support

Language state (`"en"` | `"ar"`) is stored in the Zustand store. UI labels are in `src/lib/labels.ts`. All question content is stored in both languages in the DB.
