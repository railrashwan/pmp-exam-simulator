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
