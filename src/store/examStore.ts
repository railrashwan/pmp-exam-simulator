"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ExamQuestion, Language } from "@/lib/types";

interface ExamState {
  questions: ExamQuestion[];
  currentIndex: number;
  answers: Record<number, string>;
  markedForReview: number[];
  startTime: number | null;
  examDurationSeconds: number;
  timeRemaining: number;
  isFinished: boolean;
  isPaused: boolean;
  language: Language;
  examSet: string;
  savedAttemptId: number | null;
  practiceMode: boolean;
}

interface ExamActions {
  startExam: (questions: ExamQuestion[], durationSeconds?: number, examSet?: string, practiceMode?: boolean) => void;
  selectAnswer: (questionId: number, answer: string) => void;
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  toggleMarkForReview: (questionId: number) => void;
  tick: () => void;
  endExam: () => void;
  resetExam: () => void;
  toggleLanguage: () => void;
  pauseExam: () => void;
  resumeExam: () => void;
  setSavedAttemptId: (id: number) => void;
}

const DEFAULT_DURATION = 230 * 60; // 3h 50min (PMP standard)

const initialState: ExamState = {
  questions: [],
  currentIndex: 0,
  answers: {},
  markedForReview: [],
  startTime: null,
  examDurationSeconds: DEFAULT_DURATION,
  timeRemaining: DEFAULT_DURATION,
  isFinished: false,
  isPaused: false,
  language: "en",
  examSet: "pmp",
  savedAttemptId: null,
  practiceMode: false,
};

export const useExamStore = create<ExamState & ExamActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      startExam: (questions, durationSeconds = DEFAULT_DURATION, examSet = "pmp", practiceMode = false) => {
        set({
          questions,
          currentIndex: 0,
          answers: {},
          markedForReview: [],
          startTime: Date.now(),
          examDurationSeconds: durationSeconds,
          timeRemaining: durationSeconds,
          isFinished: false,
          isPaused: false,
          examSet,
          savedAttemptId: null,
          practiceMode,
        });
      },

      selectAnswer: (questionId, answer) => {
        set((s) => ({
          answers: { ...s.answers, [questionId]: answer },
        }));
      },

      goToQuestion: (index) => {
        const { questions } = get();
        if (index >= 0 && index < questions.length) {
          set({ currentIndex: index });
        }
      },

      nextQuestion: () => {
        const { currentIndex, questions } = get();
        if (currentIndex < questions.length - 1) {
          set({ currentIndex: currentIndex + 1 });
        }
      },

      prevQuestion: () => {
        const { currentIndex } = get();
        if (currentIndex > 0) {
          set({ currentIndex: currentIndex - 1 });
        }
      },

      toggleMarkForReview: (questionId) => {
        set((s) => {
          const marked = s.markedForReview.includes(questionId)
            ? s.markedForReview.filter((id) => id !== questionId)
            : [...s.markedForReview, questionId];
          return { markedForReview: marked };
        });
      },

      tick: () => {
        const { timeRemaining, isFinished, isPaused, practiceMode } = get();
        if (isFinished || isPaused) return;
        if (!practiceMode && timeRemaining <= 1) {
          set({ timeRemaining: 0, isFinished: true });
        } else {
          set({ timeRemaining: Math.max(0, timeRemaining - 1) });
        }
      },

      endExam: () => {
        set({ isFinished: true });
      },

      resetExam: () => {
        set(initialState);
      },

      toggleLanguage: () => {
        set((s) => ({ language: s.language === "en" ? "ar" : "en" }));
      },

      pauseExam: () => set({ isPaused: true }),
      resumeExam: () => set({ isPaused: false }),
      setSavedAttemptId: (id) => set({ savedAttemptId: id }),
    }),
    {
      name: "pmp-exam-state",
      partialize: (s) => ({
        questions: s.questions,
        currentIndex: s.currentIndex,
        answers: s.answers,
        markedForReview: s.markedForReview,
        startTime: s.startTime,
        examDurationSeconds: s.examDurationSeconds,
        timeRemaining: s.timeRemaining,
        isFinished: s.isFinished,
        isPaused: s.isPaused,
        language: s.language,
        examSet: s.examSet,
        savedAttemptId: s.savedAttemptId,
        practiceMode: s.practiceMode,
      }),
      onRehydrateStorage: () => (state) => {
        // Recalculate remaining time based on actual elapsed time since exam started
        if (state && state.startTime && !state.isFinished) {
          const elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);
          const remaining = state.examDurationSeconds - elapsedSeconds;
          if (remaining <= 0) {
            state.timeRemaining = 0;
            state.isFinished = true;
          } else {
            state.timeRemaining = remaining;
          }
        }
      },
    }
  )
);
