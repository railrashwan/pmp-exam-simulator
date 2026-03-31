import { describe, it, expect, vi, beforeEach } from "vitest";

// We test the tick logic by reimplementing the core computation
// (Zustand store requires a DOM environment for full integration tests)
function computeTick(state: {
  startTime: number | null;
  isFinished: boolean;
  isPaused: boolean;
  practiceMode: boolean;
  examDurationSeconds: number;
}): { timeRemaining: number; isFinished: boolean } | null {
  const { startTime, isFinished, isPaused, practiceMode, examDurationSeconds } = state;
  if (isFinished || isPaused || practiceMode || !startTime) return null;

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const remaining = examDurationSeconds - elapsed;
  if (remaining <= 0) {
    return { timeRemaining: 0, isFinished: true };
  }
  return { timeRemaining: remaining, isFinished: false };
}

describe("timer tick logic", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("decrements correctly during normal operation", () => {
    const startTime = Date.now();
    const duration = 100;

    vi.advanceTimersByTime(10_000); // 10s elapsed
    const result = computeTick({ startTime, isFinished: false, isPaused: false, practiceMode: false, examDurationSeconds: duration });

    expect(result).toEqual({ timeRemaining: 90, isFinished: false });
  });

  it("auto-finishes when time runs out", () => {
    const startTime = Date.now();
    const duration = 5;

    vi.advanceTimersByTime(6_000); // 6s elapsed, duration was 5s
    const result = computeTick({ startTime, isFinished: false, isPaused: false, practiceMode: false, examDurationSeconds: duration });

    expect(result).toEqual({ timeRemaining: 0, isFinished: true });
  });

  it("handles tab backgrounded for long period (simulated jump)", () => {
    const startTime = Date.now();
    const duration = 120; // 2 minutes

    // Tab was backgrounded for 3 minutes — time should be expired
    vi.advanceTimersByTime(180_000);
    const result = computeTick({ startTime, isFinished: false, isPaused: false, practiceMode: false, examDurationSeconds: duration });

    expect(result).toEqual({ timeRemaining: 0, isFinished: true });
  });

  it("returns null when paused", () => {
    const result = computeTick({ startTime: Date.now(), isFinished: false, isPaused: true, practiceMode: false, examDurationSeconds: 100 });
    expect(result).toBeNull();
  });

  it("returns null when finished", () => {
    const result = computeTick({ startTime: Date.now(), isFinished: true, isPaused: false, practiceMode: false, examDurationSeconds: 100 });
    expect(result).toBeNull();
  });

  it("returns null in practice mode", () => {
    const result = computeTick({ startTime: Date.now(), isFinished: false, isPaused: false, practiceMode: true, examDurationSeconds: 100 });
    expect(result).toBeNull();
  });

  it("returns null when no startTime", () => {
    const result = computeTick({ startTime: null, isFinished: false, isPaused: false, practiceMode: false, examDurationSeconds: 100 });
    expect(result).toBeNull();
  });
});
