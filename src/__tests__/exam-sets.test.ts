import { describe, it, expect } from "vitest";
import {
  EXAM_SETS,
  CLASSIC_EXAM_SET_SLUGS,
  FULL_BROWSE_SET_SLUGS,
  ALL_EXAM_SET_SLUGS,
  isValidExamSet,
} from "@/lib/exam-sets";

describe("exam-sets config", () => {
  it("has unique slugs", () => {
    const slugs = EXAM_SETS.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every classic exam set is also a browse set", () => {
    for (const slug of CLASSIC_EXAM_SET_SLUGS) {
      expect(FULL_BROWSE_SET_SLUGS).toContain(slug);
    }
  });

  it("kill-mistakes is NOT in classic exam sets", () => {
    expect(CLASSIC_EXAM_SET_SLUGS).not.toContain("kill-mistakes");
  });

  it("isValidExamSet returns true for known slugs", () => {
    for (const slug of ALL_EXAM_SET_SLUGS) {
      expect(isValidExamSet(slug)).toBe(true);
    }
  });

  it("isValidExamSet returns false for unknown slugs", () => {
    expect(isValidExamSet("fake-set")).toBe(false);
    expect(isValidExamSet("")).toBe(false);
    expect(isValidExamSet("PMP")).toBe(false); // case-sensitive
  });

  it("all classic sets have inClassicExam: true", () => {
    for (const set of EXAM_SETS.filter((s) => s.inClassicExam)) {
      expect(CLASSIC_EXAM_SET_SLUGS).toContain(set.slug);
    }
  });
});
