/**
 * Known exam sets and their metadata.
 * Single source of truth — used by API routes, seed scripts, and UI.
 */

export interface ExamSetConfig {
  /** Database value (must match the `examSet` column exactly) */
  slug: string;
  /** Display name */
  name: string;
  /** Whether this set participates in the classic domain-stratified exam */
  inClassicExam: boolean;
}

export const EXAM_SETS: ExamSetConfig[] = [
  { slug: "undraw",       name: "UNDRAW",            inClassicExam: true },
  { slug: "andrew-ultra", name: "Andrew Ramdayal Ultra", inClassicExam: true },
  { slug: "yassine",      name: "Yassine",           inClassicExam: true },
  { slug: "helena",       name: "Helena",            inClassicExam: true },
  { slug: "eduhub",       name: "EduHub",            inClassicExam: true },
  { slug: "kill-mistakes", name: "Kill Your Mistakes", inClassicExam: false },
];

/** Slugs of all exam sets that participate in the classic mixed exam */
export const CLASSIC_EXAM_SET_SLUGS = EXAM_SETS
  .filter((s) => s.inClassicExam)
  .map((s) => s.slug);

/** Slugs of all exam sets that return all questions (browse mode) */
export const FULL_BROWSE_SET_SLUGS = EXAM_SETS
  .filter((s) => s.inClassicExam)
  .map((s) => s.slug);

/** All known exam set slugs */
export const ALL_EXAM_SET_SLUGS = EXAM_SETS.map((s) => s.slug);

/** Check if a slug is a known exam set */
export function isValidExamSet(slug: string): boolean {
  return ALL_EXAM_SET_SLUGS.includes(slug);
}
