export type Rating = "easy" | "hard" | "forgot";

export interface CardState {
  interval: number;
  ease: number;
}

/**
 * SM-2 spaced repetition algorithm (simplified)
 *
 * Returns updated interval and ease after a review rating.
 *
 * - "forgot": reset interval to 1 day, reduce ease
 * - "hard":   slow growth, reduce ease slightly
 * - "easy":   normal growth, increase ease
 */
export function processReview(
  currentState: CardState,
  rating: Rating
): CardState {
  let { interval, ease } = currentState;

  if (rating === "forgot") {
    interval = 1;
    ease = Math.round((Math.max(1.3, ease - 0.2)) * 100) / 100;
  } else if (rating === "hard") {
    interval = Math.max(1, Math.ceil(interval * 1.2));
    ease = Math.round((Math.max(1.3, ease - 0.15)) * 100) / 100;
  } else {
    // easy
    interval = Math.max(1, Math.ceil(interval * ease));
    ease = Math.round((ease + 0.1) * 100) / 100;
  }

  return { interval, ease };
}

/**
 * Compute the next review date from today + interval days
 */
export function nextReviewDate(intervalDays: number): Date {
  const now = new Date();
  now.setDate(now.getDate() + intervalDays);
  return now;
}

/**
 * Mastery levels based on review history
 */
export function getMasteryLevel(reviewCount: number, interval: number): "new" | "learning" | "reviewing" | "mastered" {
  if (reviewCount === 0) return "new";
  if (interval < 7) return "learning";
  if (interval < 21) return "reviewing";
  return "mastered";
}
