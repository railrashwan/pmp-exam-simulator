export interface Question {
  id: number;
  examSet?: string;
  domain: string;
  questionTextEn: string;
  questionTextAr: string;
  optionAEn: string;
  optionAAr: string;
  optionBEn: string;
  optionBAr: string;
  optionCEn: string;
  optionCAr: string;
  optionDEn: string;
  optionDAr: string;
  correctAnswer: string;
  explanationEn: string;
  explanationAr: string;
  wrongExplanationEn?: string | null;
  wrongExplanationAr?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Question sent to client during exam. In normal mode, answer/explanation fields are absent.
// In practice mode, they are included so feedback can be shown immediately after selection.
export type ExamQuestion = Omit<Question, "createdAt" | "updatedAt"> & {
  correctAnswer?: string;
  explanationEn?: string;
  explanationAr?: string;
  wrongExplanationEn?: string | null;
  wrongExplanationAr?: string | null;
};

export type Language = "en" | "ar";

export type AnswerKey = "A" | "B" | "C" | "D";

export interface ExamResult {
  questionId: number;
  questionTextEn: string;
  questionTextAr: string;
  selectedAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  explanationEn: string;
  explanationAr: string;
  wrongExplanationEn: string | null;
  wrongExplanationAr: string | null;
  optionAEn: string;
  optionAAr: string;
  optionBEn: string;
  optionBAr: string;
  optionCEn: string;
  optionCAr: string;
  optionDEn: string;
  optionDAr: string;
  domain: string;
}

export interface ExamResultsResponse {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  passed: boolean;
  domainBreakdown: Record<string, { correct: number; total: number }>;
  results: ExamResult[];
}
