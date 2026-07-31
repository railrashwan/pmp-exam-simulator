# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run lint         # Run ESLint
npm test             # Run all tests once (vitest run)
npm run test:watch   # Run tests in watch mode
```

Single test file: `npx vitest run src/__tests__/timer.test.ts`
Single test by name: `npx vitest run -t "test name"`

Tests live in `src/**/__tests__/**/*.test.ts` (see `vitest.config.ts`); the `@` alias resolves to `src/`.

### Database

```bash
npx prisma generate           # Regenerate the Prisma client after editing schema.prisma (also runs on `npm install` via postinstall)
npx prisma migrate dev        # Create/apply a migration after schema changes
npx tsx prisma/seed.ts        # Seed the primary "pmp" question bank
```

Additional exam-set-specific seed scripts exist as both npm scripts and raw files — run whichever matches the bank you're touching:

```bash
npm run db:seed-undraw
npm run db:seed-andrew-ultra
npm run db:seed-yassine
npx tsx prisma/seed-eduhub.ts   # no npm script registered
npx tsx prisma/seed-helena.ts   # no npm script registered
```

The Prisma client is generated to `src/generated/prisma` (gitignored) and imported from `@/generated/prisma/client` — never from `@prisma/client` directly.

**Watch for this DB-path inconsistency:** the app runtime (`src/lib/prisma.ts`) falls back to `<project-root>/dev.db` when `DATABASE_URL` is unset, while the Prisma CLI (`prisma.config.ts`) falls back to `prisma/dev.db`. Set `DATABASE_URL` explicitly (or export it for seed/migrate commands) to avoid the app and CLI silently pointing at two different SQLite files.

## Architecture

**PMP Exam Simulator** — a full-stack Next.js (App Router) app with SQLite via Prisma (LibSQL adapter, Turso in production) and Zustand for exam/preferences state. Bilingual (English/Arabic) throughout.

### Question banks ("exam sets")

Questions are grouped into named banks via the `Question.examSet` column. `src/lib/exam-sets.ts` is the single source of truth for known slugs (`undraw`, `andrew-ultra`, `yassine`, `helena`, `eduhub`, `kill-mistakes`) and is consumed by API routes, seed scripts, and the UI — add a new bank there first, then seed it.

- Sets with `inClassicExam: true` feed the **classic exam**: `GET /api/exam/start` stratifies a random sample across all of them by PMP ECO domain weighting (8% Business Environment / 42% People / 50% Process), shuffled independently per domain then combined.
- Any set can also be browsed/practiced in full via `?examSet=<slug>` (`FULL_BROWSE_SET_SLUGS`).
- `kill-mistakes` is synthetic: it queries `AttemptResult` for the most recent answer per question across all past attempts and returns only ones most recently gotten wrong — it isn't a seeded bank.
- `?mode=practice` on `/api/exam/start` includes `correctAnswer` and all explanation fields in the response so the UI can show feedback immediately after each selection; normal mode strips them (answers are validated server-side only, in `/api/exam/results`).

### Data flow (classic timed exam)

1. Home page (`/`) lets users choose question count (10/20/40) and exam set.
2. `GET /api/exam/start?count=N&examSet=slug` returns randomized questions (answers stripped in normal mode).
3. Exam state lives in Zustand (`src/store/examStore.ts`), persisted to localStorage under key `pmp-exam-state` — includes answers, marked-for-review, per-question strikethroughs/comments/highlights (Pearson VUE-style annotation tools), and a wall-clock-based timer (recomputed from `startTime` on each tick and on rehydrate, so it stays correct through `setInterval` throttling or a backgrounded tab).
4. On finish, `POST /api/exam/results` re-validates answers against the DB and returns per-domain scoring.
5. Results page reads the response and displays domain-wise breakdown (passing: 65%). `POST /api/profile/save-attempt` persists the run as an `ExamAttempt` with related `AttemptResult`/`DomainResult` rows for history.

### Spaced repetition ("Learn" mode)

A separate SM-2-based review system, distinct from the timed exam:

- `src/lib/spaced-rep.ts` implements the algorithm (`processReview`, ratings `easy` | `hard` | `forgot`) and mastery-level bucketing (`new`/`learning`/`reviewing`/`mastered`).
- `SpacedRepCard` (one per question, created via `/api/learn/init`) tracks `interval`, `ease`, and `nextReview`; each rating writes a `ReviewLog`.
- `GET /api/learn/queue` returns due cards (`nextReview <= now`); `POST /api/learn/review` applies a rating and reschedules; `/api/learn/stats` summarizes progress. UI lives at `/learn` and `/learn/session`.

### Admin & AI translation

- `src/app/admin/` is question CRUD (list/search/filter, new, edit) plus bulk tooling: Arabic export/import (`/api/admin/export-arabic`, `/api/admin/import-arabic`) and AI-assisted EN→AR translation of explanations (`/api/admin/translate-explanations`) using `@anthropic-ai/sdk` (`claude-haiku-4-5-20251001`) — requires `ANTHROPIC_API_KEY` (not listed in `.env.example`, must be set separately).
- `src/middleware.ts` gates `/admin/:path*` behind a single shared-password cookie (`ADMIN_PASSWORD` env var). If unset, admin is open — this is dev-mode-only behavior, not a real auth system.

### Key directories

- `src/app/api/` — REST endpoints: `exam/start`, `exam/results`, `questions`, `questions/[id]`, `learn/*` (init, queue, review, stats), `profile/*` (history, mistakes, reset, save-attempt), `admin/*` (login, seed, export-arabic, import-arabic, translate-explanations)
- `src/app/exam/` — exam-taking UI and results page
- `src/app/learn/` — spaced-repetition review UI
- `src/app/profile/` — attempt history and mistake review
- `src/app/admin/` — question CRUD and translation tooling UI
- `src/components/exam/` — stateless exam UI: header/timer, navigation, question grid/display, calculator, translation window, strikethrough/comment/highlight tooling — all modeled on the real Pearson VUE interface
- `src/lib/` — Prisma client singleton (`prisma.ts`), shared types (`types.ts`), exam-set registry (`exam-sets.ts`), spaced-rep algorithm (`spaced-rep.ts`), bilingual labels (`labels.ts`)
- `src/store/` — `examStore.ts` (exam session, persisted under `pmp-exam-state`) and `preferencesStore.ts` (question font, theme, high-contrast color scheme, persisted separately under `pmp-preferences`)
- `prisma/` — schema (`Question`, `ExamAttempt`/`AttemptResult`/`DomainResult`, `SpacedRepCard`/`ReviewLog`), migrations, per-exam-set seed scripts

### Database

SQLite via Prisma with the LibSQL adapter (a local file in dev, Turso in production via `DATABASE_URL`/`DATABASE_AUTH_TOKEN`).

`Question` is bilingual (`*En`/`*Ar` suffixes) for question text, four options, and both a combined explanation and four *per-option* explanations (`explanationAEn`...`explanationDAr`, nullable — older seeded questions may not have them). `domain` is one of `"People"`, `"Process"`, `"Business Environment"`. `examSet` + `globalBank` classify which bank a question belongs to.

### Bilingual support

Language state (`"en"` | `"ar"`) lives in `examStore`, toggled independently of the OS/browser locale. UI labels are in `src/lib/labels.ts`. All question content is stored in both languages in the DB; RTL layout correctness for Arabic is a first-class requirement (see Design Context below).

## Design Context

Full details in `.impeccable.md`. Summary for all UI work:

### Users
Arabic-speaking PMP candidates. Primary language is Arabic; English is secondary. RTL layout must be pixel-perfect. The app must feel like the real Pearson VUE exam environment to build exam-day confidence.

### Brand Personality
**Professional. Clear. Motivating.** Never playful, gamified, or visually noisy. Model: Pearson VUE exam interface.

### Design Principles
1. **Simulate Pearson VUE** — question layout, timer, navigation, results should all feel like the real exam.
2. **One primary color, used with discipline** — no per-feature accent colors. Chambray blue (`#364395`) for structure, teal (`#047b9c`) for interactive elements only.
3. **Typography serves the reader** — Open Sans (English) + Noto Sans Arabic. Question text 17px, options 15px, labels 13px. Never use oversized text (current 24px baseline must be refactored).
4. **Distraction-free during exam** — zero decorative elements on the exam screen. White space = focus.
5. **Motivating without cheerful** — affirming results language, clean pass/fail indicators, no confetti or gamification.

### Color Tokens (light / dark)
```
Primary (structure):    #364395  /  #5b6fcc
Interactive (clickable):#047b9c  /  #22a8c8
Background:             #ffffff  /  #0f1117
Surface (cards/panels): #f5f7fa  /  #1a1f2e
Border:                 #d0d5dd  /  #2d3748
Text primary:           #1c1c1e  /  #e2e8f0
Text secondary:         #6b7280  /  #94a3b8
Selected answer bg:     #ebf0fb  /  #1e2a4a
Selected answer border: #364395  /  #5b6fcc
Correct:                #166534 on #f0fdf4  /  #4ade80 on #052e16
Incorrect:              #991b1b on #fff1f2  /  #f87171 on #2d0a0a
Timer warning:          #b45309 on #fffbeb  /  #fbbf24 on #1c1200
```
