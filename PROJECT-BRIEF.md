# Project Brief — Unified Certification Exam Platform

**Audience:** the coding agent taking over this project.
**Status:** pre-spec. Discovery is complete; three decisions are still open (see §8).
**Author:** prior agent, after a full read of both source codebases.

---

## 1. What is being built

The owner is studying for two professional certifications and has built a separate
web app for each:

| Repo | Cert | URL |
|---|---|---|
| `railrashwan/pmp-exam-simulator` | PMP (Project Management Professional) | https://github.com/railrashwan/pmp-exam-simulator |
| `railrashwan/fe-exam-simulator` | FE (NCEES Fundamentals of Engineering) | https://github.com/railrashwan/fe-exam-simulator |

The goal is **one product** replacing both, that runs on **Android, iOS, and the web**.

The decision — reached after reviewing both codebases — is to **build greenfield and
harvest from the two existing apps**, rather than merge them. The reasoning is in §5.
This is not a rewrite for its own sake; the mobile requirement independently invalidates
the UI layer of one app and the data layer of the other.

**The owner's working method, which you are expected to follow:**

1. Grilling (adversarial questioning to surface hidden requirements)
2. Writing specs
3. Writing tickets
4. Implementing
5. Reviewing

Discovery and the first round of grilling are done — this document is that output.
**Do not skip to implementation.** Close §8, then write the spec.

---

## 2. ⚠️ Read this before touching anything

**The most valuable asset in this project is not in version control.**

Verified facts:

- No `.db` file is tracked in either repo (`git ls-files | grep '\.db$'` → empty).
- The only question data committed to `pmp-exam-simulator` is:
  - `prisma/data/questions.json` — **40 questions**
  - `prisma/data/undraw-questions.json` — **49 questions**
- But the app's home page configures four much larger banks: Andrew Ultra (200),
  Yassine (180), Helena (180), EduHub (180) — roughly **740 additional questions**.
- Those banks are loaded by seed scripts that read a **path passed on the command line**:

  ```
  Usage: npx tsx prisma/seed-andrew-ultra.ts <file1.md> [file2.md] ...
  Example: npx tsx prisma/seed-andrew-ultra.ts ~/Downloads/pmp_questions_q1_q50.md
  ```

  Those `.md` / `.txt` source files are **not in the repo**.

So the only durable copies of the bulk of the question bank are the owner's local
`dev.db` and loose files in their Downloads folder. This content represents hundreds of
hours of curation and Arabic translation. **The code is cheap to rebuild. This is not.**

**Ticket #1, before any architecture work:** export every row from the owner's local
`dev.db` to versioned JSON and commit it. Confirm the export round-trips (count rows in,
count rows out, spot-check Arabic text for encoding damage) before anything else begins.
Do not delete or reinitialize the old project directory until this is verified.

---

## 3. Source app inventory

### 3.1 PMP simulator — `railrashwan/pmp-exam-simulator`

**Stack:** Next.js (App Router) · Prisma + SQLite via LibSQL adapter · Zustand · Tailwind · Vitest

**Key finding — it is already a client + REST app.** Only 4 server components exist in
the entire app, all under `/admin`. Every exam-taking screen is `"use client"` and talks
to REST endpoints. It also has **96 responsive breakpoints** — it is genuinely
mobile-responsive today. Despite the "server framework" label, this is the more
portable of the two apps.

**Data model** (`prisma/schema.prisma`):

- `Question` — flat table, ~28 columns. Bilingual `*En`/`*Ar` pairs for question text,
  four options (A–D), overall explanation, and optional **per-option** explanations.
  Also `domain`, `examSet`, `globalBank`.
- `ExamAttempt` → `AttemptResult`, `DomainResult` — persisted attempt history
- `SpacedRepCard` → `ReviewLog` — SM-2 spaced repetition

**Domains:** `People`, `Process`, `Business Environment`

**Exam sets** (`src/lib/exam-sets.ts`): `undraw`, `andrew-ultra`, `yassine`, `helena`,
`eduhub`, `kill-mistakes` (mistake-replay set, excluded from the mixed exam), plus a
default `pmp` set.

**Exam rules:** question counts 10/20/40/60/100/120/150/180. Timing scales from the real
exam ratio — 180 questions = 230 minutes. Passing threshold 65%. Optional *practice mode*
returns answers and explanations inline for immediate feedback.

**API surface:** `/api/exam/start`, `/api/exam/results`, `/api/questions[/:id]`,
`/api/profile/{history,save-attempt,mistakes,reset}`, `/api/learn/{init,queue,review,stats}`,
`/api/admin/{seed,translate-explanations,import-arabic,export-arabic}`

**Notable features:** full Arabic/RTL support, dark mode, admin CRUD, AI-assisted Arabic
translation, in-exam calculator, font-size panel, question navigator, mark-for-review,
per-domain score breakdown, "Kill Your Mistakes" replay mode.

**Weaknesses:** rigid 4-option-only question model; content pipeline is five hand-written
seed scripts; single-user (no `User` model, admin is a password gate).

### 3.2 FE simulator — `railrashwan/fe-exam-simulator`

**Stack:** Vite 8 · React 19 · TypeScript 5.9 · Tailwind 4 · Zustand 5 · react-pdf/pdfjs ·
@dnd-kit · xlsx · math.js · KaTeX

**No backend. No database. No auth.** Everything is client-side.

**Key finding — it does not persist anything.** `src/utils/safeStorage.ts` is an
in-memory `Map` with a comment saying users can modify it. Refresh the page mid-exam and
the session is gone. This is a defect, not a design choice.

**Key finding — it is desktop-only.** The entire app contains **4 responsive
breakpoints**. `ReferencePaneLeft` is hardcoded `w-[210px]`. The core UX is a split
screen (reference handbook left, question right) that has no meaning on a phone.

**Question model** (`src/types.ts`) — far richer than PMP's, and polymorphic:

- 5 types: `mc`, `multiple-correct`, `point-click`, `drag-drop`, `fill-blank`
- HTML stems, optional figure images, `hotspots`, `dragItems`/`dropZones`,
  `blankSpec` (decimals + units), numeric `tolerance`, `referenceHandbookPages`
- `correctAnswer: any` — it is genuinely a union type: string, `string[]`,
  `{x,y}`, `Record<string, string[]>`, or a numeric string

**Exam flow** — a 9-phase state machine faithfully replicating NCEES:
`splash → nda → tutorial → section1 → section1-review → break → section2 →
section2-review → survey → results`, plus `question-manager`, `answer-review`,
`pdf-extractor`, `topic-select`, `practice`.

**Taxonomy:** 14 FE Civil topics, each with a min/max question count defining the real
exam blueprint (`FE_CIVIL_TOPICS` in `src/types.ts`). This is researched domain data.

**Content status:** `src/data/questions-civil.json` holds **13 questions** — 12 multiple
choice, 1 multiple-correct; 11 of them Ethics, 2 Statics. **The FE app is effectively a
shell with no content.**

**Standout assets:** TI-30XS calculator emulator · FE Reference Handbook PDF viewer
(7.3 MB bundled PDF) · **AI-powered PDF→question-bank extractor** supporting Gemini,
OpenAI, Groq, and any OpenAI-compatible endpoint, with vision support
(`src/lib/extraction-pipeline.ts`, `src/lib/providers/*`, `src/lib/pdf-processor.ts`).
See `ExamExtractor-PRD.md` and `ExamExtractor-Integration-Spec.md` in that repo.

---

## 4. The asymmetry that defines the project

Each app has exactly what the other lacks:

| | PMP | FE |
|---|---|---|
| Content | ~830 curated bilingual questions | 13 questions |
| Content pipeline | 5 hand-written seed scripts | **AI PDF extractor** |
| Persistence | Full DB, attempts, spaced repetition | **None — in-memory only** |
| Question types | 4-option MC only | **5 rich types** |
| Exam ceremony | Single timed block | **Full 9-phase NCEES flow** |
| Mobile readiness | 96 breakpoints, responsive | 4 breakpoints, desktop-only |
| Languages | Arabic + English, RTL | English only |

**The single highest-value outcome of this project** is pointing FE's AI extractor at
PMP's content problem — it makes those five seed scripts obsolete and solves FE's empty
bank at the same time.

---

## 5. Why greenfield, not merge

Because mobile already forced it:

- FE's UI cannot survive a phone under any porting strategy — 4 breakpoints, hardcoded
  pane widths, and a split-screen premise that requires a wide display.
- PMP's data layer (Prisma + server SQLite) cannot run on-device.

The parts a "merge" would have preserved were going to be rewritten regardless. Greenfield
just names that honestly.

**What must be carried over, by category:**

**Migrate as data — never rebuild:**
- The full question bank exported from `dev.db` (see §2)
- `FE_CIVIL_TOPICS` blueprint (14 topics with min/max distributions) — research, not code
- Design tokens from `CLAUDE.md` and `.impeccable.md` (reproduced in §7)

**Port the logic, rewrite the shell:**
- `src/lib/extraction-pipeline.ts` + `src/lib/providers/*` — hard-won prompt engineering
- `src/lib/spaced-rep.ts` — SM-2; small, correct, and tested
- `src/components/calculator/TI30XS.tsx` — fiddly emulator logic
- `src/utils/scoring.ts` + PMP's per-domain breakdown scoring

**Keep as specification only — rewrite the code:**
- FE's 9-phase NCEES state machine (the flow is the value; the implementation is desktop-bound)
- The 5 question-type renderers (all need rebuilding for touch)

**Leave behind:**
- `safeStorage` (in-memory; loses the exam on refresh)
- The five hand-written seed scripts (superseded by the extractor)
- PMP's 28-column flat bilingual `Question` table

---

## 6. Unresolved design collisions

These are real, and the spec must take a position on each.

**6.1 The question model — the central decision.**
PMP is a rigid 4-option bilingual table. FE needs a discriminated union with figures,
hotspots, drop zones, and numeric tolerance. Candidate approaches: a base table plus a
typed JSON payload; separate tables per cert; one wide superset table with ~20 nullable
columns; or full polymorphic normalization. **The deciding question is whether
cross-certification queries are actually required** (e.g. "everything I got wrong this
week across both exams"). If the shared surface is really just chrome — nav, theme,
timer, calculator — two schemas are more honest than one.

**6.2 Taxonomy.** PMP has 3 flat domains. FE has 14 topics *with min/max blueprint ranges
that drive exam generation*. A shared abstraction needs to express both — probably a
`Blueprint` concept with weighted topic ranges, where PMP's is a degenerate case.

**6.3 Bilingual scope.** PMP doubles every text field for Arabic/RTL. FE is English-only,
and the real NCEES exam is administered in English — translating stems may train the wrong
reflex. Note that Arabic RTL combined with KaTeX math and figure-based questions is
genuinely difficult. A likely resolution: Arabic UI and Arabic *explanations*, English
stems for FE.

**6.4 Exam flow.** Do not build one configurable engine for both. PMP is a single timed
block; FE is a 9-phase machine with a mandatory break and an exit survey. A config object
flexible enough for both is usually worse than two engines sharing components.

**6.5 Multi-user.** Neither app has a `User` model. Retrofitting one touches every query.
Even if v1 is single-user, the schema should carry a nullable `userId` from day one.

---

## 7. Design system (carry forward — this thinking is already done)

**Users:** Arabic-speaking professionals. Arabic is primary, English secondary. RTL must
be pixel-perfect.

**Personality:** Professional. Clear. Motivating. Reference is the **Pearson VUE exam
interface** — replicate the feel, not the brand. Explicit anti-references: Duolingo-style
gamification, colorful dashboards, emojis, gradients, per-feature accent colors.

**Principles:**
1. Simulate the real exam, not a study app — builds exam-day muscle memory
2. One primary color used with discipline — no per-feature accents
3. Typography serves the reader — 17px question, 15px options, 13px labels.
   Open Sans (English, matching Pearson) + Noto Sans Arabic
4. Calm and distraction-free during the exam — zero decoration on the exam screen
5. Motivating without cheerful — clean pass/fail, no confetti or trophies

**Tokens (light / dark):**

```
Primary (structure):     #364395  /  #5b6fcc
Interactive (clickable): #047b9c  /  #22a8c8
Background:              #ffffff  /  #0f1117
Surface:                 #f5f7fa  /  #1a1f2e
Border:                  #d0d5dd  /  #2d3748
Text primary:            #1c1c1e  /  #e2e8f0
Text secondary:          #6b7280  /  #94a3b8
Selected answer bg:      #ebf0fb  /  #1e2a4a
Selected answer border:  #364395  /  #5b6fcc
Correct:                 #166534 on #f0fdf4  /  #4ade80 on #052e16
Incorrect:               #991b1b on #fff1f2  /  #f87171 on #2d0a0a
Timer warning:           #b45309 on #fffbeb  /  #fbbf24 on #1c1200
```

Full detail in `.impeccable.md` and `CLAUDE.md` in the PMP repo.

---

## 8. 🔴 OPEN DECISIONS — resolve these with the owner before writing the spec

The owner has not yet answered these. **They were asked and deliberately left open.** Do
not assume answers; each one changes the architecture, and a spec written without them
will be invalidated.

**D1 — App Store presence, or just on the owner's own phone?**
Two very different projects. Store distribution means a $99/yr Apple Developer account,
review cycles, a privacy policy, and Apple scrutinizing the bring-your-own-API-key AI
feature. "I want it on my phone" is a weekend with a PWA or a Capacitor sideload.

**D2 — Is offline support required?**
If yes, questions and spaced-repetition cards must live on-device with sync back to the
server. **Sync is the hardest single problem in this project — harder than the merge.**
If no, everything gets dramatically simpler.

**D3 — Does mobile get feature parity with web?**
Prior recommendation: **no.** Nobody sits a 230-minute Pearson VUE simulation on a phone.
The phone's job is spaced repetition, short drills, and mistake review. The desktop's job
is the full-length mock exam with the reference handbook open. If the owner agrees, v1
shrinks dramatically and the mobile client becomes a focused drill app rather than a port
of two exam simulators.

**Also confirm:** do the old apps stay running during the build? The owner is actively
studying, which determines whether content can be *moved* or must be *copied*.

---

## 9. Recommended architecture (a proposal, not a decision)

Contingent on D1–D3, the prior agent's recommendation was:

> **One repository.** A shared API + database.
> A **web app** carrying full exam simulation for both certifications — harvesting FE's
> NCEES ceremony and PMP's backend and learning loop.
> A **mobile app** that deliberately does *not* replicate the exam — it does spaced
> repetition, mistake drills, and progress tracking, with push notifications ("24 cards
> due today" is the feature most likely to drive actual daily study).
> The **AI extractor stays web-only and admin-only**, and finally retires the five seed
> scripts.

**Stack options for Android + iOS + web, in ascending cost:**

- **PWA** — cheapest, installable, offline-capable via service worker, no app stores.
- **Capacitor** — wraps a web app in a native shell. Preserves React DOM, Tailwind,
  react-pdf, dnd-kit, and KaTeX; ships to both stores. Fastest route to real store presence.
- **Expo / React Native + React Native Web** — true native, best offline story, real push
  notifications. But it is a **complete UI rewrite**: Tailwind→NativeWind,
  react-pdf→native PDF, dnd-kit→Reanimated/Gesture Handler, KaTeX→WebView bridge. Months.

React Native only pays for itself if push notifications and true offline are required —
which, for a spaced-repetition product, is a more serious argument than it first appears.

---

## 10. Suggested first tickets

1. **Export and commit the question bank** from the owner's `dev.db` to versioned JSON.
   Verify round-trip integrity and Arabic encoding. *Blocks everything.*
2. **Recover the loose source files** (`~/Downloads/*.md`, `*.txt`) that fed the seed
   scripts and archive them in the repo.
3. **Close D1–D3** with the owner.
4. **Write the spec** — data model, module boundaries, stack choice, v1 scope ceiling.
5. **Build a thin vertical slice** before any breadth: one cert, one question type, take a
   drill, persist the attempt, see the card surface in spaced repetition — on a phone. If
   that slice works end-to-end, the architecture is real.

---

## 11. Risks

- **Losing the question bank.** See §2. Highest-severity risk in the project by a wide margin.
- **Second-system syndrome.** The classic failure of exactly this decision: a beautiful
  clean-architecture rewrite that is 40% done and never replaces the apps it was meant to
  replace — while the owner is still studying on the old ones and an exam date is
  approaching. Mitigations: the vertical slice in §10, and a hard v1 scope ceiling agreed
  *in the spec*, while saying no is still cheap.
- **Over-abstracting the exam engine.** See §6.4.
- **Underestimating offline sync.** See D2.
- **Mobile UX for FE question types.** Drag-and-drop and point-and-click on a 390px screen
  are a redesign, not a port.
- **API keys on device.** FE stores user-supplied AI provider keys in localStorage. On a
  shipped mobile app this is both a security and an app-review concern — another reason to
  keep the extractor web-and-admin-only.

---

## 12. Working agreement

Follow the owner's five-phase method: **grill → spec → tickets → implement → review.**
They value being challenged; the grilling phase is not a formality. Push back on scope,
surface hidden requirements, and force decisions early rather than discovering them in
implementation.

Two things to hold firm on: **do not start implementing before D1–D3 are closed**, and
**do not let the question bank exist in only one place.**
