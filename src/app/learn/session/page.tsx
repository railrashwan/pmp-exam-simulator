"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Question {
  id: number;
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
  wrongExplanationEn: string | null;
  wrongExplanationAr: string | null;
}

interface QueueCard {
  id: number;
  questionId: number;
  interval: number;
  ease: number;
  reviewCount: number;
  lastRating: string | null;
  question: Question;
}

type Rating = "easy" | "hard" | "forgot";

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

export default function LearnSessionPage() {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [reviewCount, setReviewCount] = useState({ easy: 0, hard: 0, forgot: 0 });

  useEffect(() => {
    loadQueue();
  }, []);

  async function loadQueue() {
    try {
      const res = await fetch("/api/learn/queue");
      const data = await res.json();
      setQueue(data);
      if (data.length === 0) setCompleted(true);
    } catch {
      setQueue([]);
      setCompleted(true);
    } finally {
      setLoading(false);
    }
  }

  const currentCard = queue[currentIndex];

  const getOptionText = useCallback(
    (card: QueueCard, index: number) => {
      const q = card.question;
      const isAr = language === "ar";
      switch (index) {
        case 0:
          return isAr ? q.optionAAr : q.optionAEn;
        case 1:
          return isAr ? q.optionBAr : q.optionBEn;
        case 2:
          return isAr ? q.optionCAr : q.optionCEn;
        case 3:
          return isAr ? q.optionDAr : q.optionDEn;
        default:
          return "";
      }
    },
    [language]
  );

  function handleSelectAnswer(option: string) {
    if (revealed) return;
    setSelectedOption(option);
    setRevealed(true);
  }

  async function handleRate(rating: Rating) {
    if (!currentCard || reviewing) return;
    setReviewing(true);

    try {
      await fetch("/api/learn/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: currentCard.id, rating }),
      });

      setReviewCount((prev) => ({
        ...prev,
        [rating]: prev[rating] + 1,
      }));

      // Move to next card
      if (currentIndex + 1 >= queue.length) {
        setCompleted(true);
      } else {
        setCurrentIndex((i) => i + 1);
        setSelectedOption(null);
        setRevealed(false);
      }
    } catch {
      // Silent fail, user can retry
    } finally {
      setReviewing(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center" dir="ltr">
        <p className="text-muted text-sm-type">Loading review queue...</p>
      </div>
    );
  }

  // Completed state
  if (completed) {
    const total = reviewCount.easy + reviewCount.hard + reviewCount.forgot;
    return (
      <div className="min-h-screen bg-canvas" dir="ltr">
        <header className="bg-primary border-b border-primary">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
            <h1 className="text-2xl font-bold text-white tracking-wide drop-shadow-sm">
              Session Complete
            </h1>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center space-y-6">
          <div className="text-5xl">🎯</div>
          <h2 className="text-xl font-bold text-content">Great work!</h2>
          <p className="text-sm-type text-muted">
            You reviewed {total} card{total !== 1 ? "s" : ""} this session.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            <div className="bg-canvas border border-edge rounded-lg p-3 text-center">
              <div className="text-stat font-black text-ok tabular-nums">
                {reviewCount.easy}
              </div>
              <div className="text-xs-type text-muted mt-1">Easy</div>
            </div>
            <div className="bg-canvas border border-edge rounded-lg p-3 text-center">
              <div className="text-stat font-black text-warn tabular-nums">
                {reviewCount.hard}
              </div>
              <div className="text-xs-type text-muted mt-1">Hard</div>
            </div>
            <div className="bg-canvas border border-edge rounded-lg p-3 text-center">
              <div className="text-stat font-black text-err tabular-nums">
                {reviewCount.forgot}
              </div>
              <div className="text-xs-type text-muted mt-1">Forgot</div>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/learn")}
              className="py-2.5 px-6 bg-interact text-white rounded-lg hover:bg-interact-h font-semibold text-xs-type transition-colors"
            >
              Back to Learning
            </button>
            <button
              onClick={() => router.push("/")}
              className="py-2.5 px-6 bg-surface text-content border border-edge rounded-lg hover:border-edge-2 font-semibold text-xs-type transition-colors"
            >
              Home
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!currentCard) return null;

  const q = currentCard.question;
  const isCorrect = selectedOption === q.correctAnswer;
  const options = [
    getOptionText(currentCard, 0),
    getOptionText(currentCard, 1),
    getOptionText(currentCard, 2),
    getOptionText(currentCard, 3),
  ];

  return (
    <div className="min-h-screen bg-canvas" dir="ltr">
      {/* Header */}
      <header className="bg-primary border-b border-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/learn")}
              className="text-xs-type text-white/70 hover:text-white transition-colors"
            >
              ← Exit
            </button>
            <h1 className="text-sm-type font-bold text-white">
              Learning Session
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs-type text-white/70 tabular-nums">
              {currentIndex + 1} / {queue.length}
            </span>
            <button
              onClick={() => setLanguage((l) => (l === "en" ? "ar" : "en"))}
              className="px-2 py-1 text-xs-type text-white/70 hover:text-white border border-white/20 rounded transition-colors"
            >
              {language === "en" ? "عربي" : "EN"}
            </button>
            <ThemeToggle className="border-white/20 text-white/70 hover:bg-white/10 hover:text-white" />
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-white/10">
          <div
            className="h-full bg-white/40 transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / queue.length) * 100}%`,
            }}
          />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Domain badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs-type text-muted bg-surface px-2 py-0.5 rounded border border-edge">
            {q.domain}
          </span>
          <span className="text-xs-type text-muted">
            {currentCard.reviewCount === 0
              ? "New"
              : `Reviewed ${currentCard.reviewCount}x · ${currentCard.interval}d interval`}
          </span>
        </div>

        {/* Question */}
        <div className="bg-canvas border border-edge rounded-lg shadow-sm">
          <div className="p-5">
            <p className="text-base text-content leading-relaxed">
              {language === "ar" ? q.questionTextAr : q.questionTextEn}
            </p>
          </div>

          {/* Options */}
          <div className="border-t border-edge">
            {options.map((text, i) => {
              const optionLetter = OPTION_LABELS[i];
              const isSelected = selectedOption === optionLetter;
              const isAnswer = q.correctAnswer === optionLetter;
              let optionClass =
                "p-4 border-b border-edge last:border-b-0 cursor-pointer transition-colors";

              if (revealed) {
                if (isAnswer) {
                  optionClass += " bg-correct border-l-4 border-l-ok";
                } else if (isSelected && !isAnswer) {
                  optionClass += " bg-wrong border-l-4 border-l-err";
                } else {
                  optionClass += " opacity-60";
                }
              } else {
                optionClass +=
                  " hover:bg-surface active:bg-surface";
              }

              return (
                <div
                  key={i}
                  className={optionClass}
                  onClick={() => handleSelectAnswer(optionLetter)}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs-type font-bold border ${
                        revealed && isAnswer
                          ? "bg-correct text-white border-correct"
                          : revealed && isSelected && !isAnswer
                          ? "bg-incorrect text-white border-incorrect"
                          : "bg-surface border-edge text-muted"
                      }`}
                    >
                      {optionLetter}
                    </span>
                    <span className="text-sm-type text-content leading-relaxed">
                      {text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Explanation (after reveal) */}
        {revealed && (
          <div className="space-y-4">
            {/* Result indicator */}
            <div
              className={`p-4 rounded-lg border ${
                isCorrect
                  ? "bg-correct border-ok"
                  : "bg-wrong border-err"
              }`}
            >
              <p className="text-sm-type font-bold text-content">
                {isCorrect ? "✓ Correct" : `✗ Incorrect — answer is ${q.correctAnswer}`}
              </p>
            </div>

            {/* Explanation */}
            <div className="bg-canvas border border-edge rounded-lg p-5 shadow-sm">
              <p className="text-sm-type text-content leading-relaxed whitespace-pre-wrap">
                {language === "ar" ? q.explanationAr : q.explanationEn}
              </p>
            </div>

            {/* Rating buttons */}
            <div className="bg-canvas border border-edge rounded-lg p-5 shadow-sm">
              <p className="text-xs-type text-muted mb-3 text-center">
                How well did you know this?
              </p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleRate("forgot")}
                  disabled={reviewing}
                  className="py-3 rounded-lg font-semibold text-sm-type transition-colors bg-wrong text-err border border-err hover:opacity-80 disabled:opacity-50"
                >
                  Forgot
                </button>
                <button
                  onClick={() => handleRate("hard")}
                  disabled={reviewing}
                  className="py-3 rounded-lg font-semibold text-sm-type transition-colors bg-warn-bg text-warn border border-warn hover:opacity-80 disabled:opacity-50"
                >
                  Hard
                </button>
                <button
                  onClick={() => handleRate("easy")}
                  disabled={reviewing}
                  className="py-3 rounded-lg font-semibold text-sm-type transition-colors bg-correct text-ok border border-ok hover:opacity-80 disabled:opacity-50"
                >
                  Easy
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
