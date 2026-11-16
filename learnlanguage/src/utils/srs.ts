import type { Word } from '../types';

export const SRS_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30] as const;

export interface SRSResult {
  newStage: number;
  nextReviewDate: string;
}

/**
 * Calculates the next SRS review date and stage based on user performance.
 * - If correct: advance stage up to 5.
 * - If incorrect: reset to stage 0.
 */
export function calculateSRSNextReview(
  currentStage: number = 0,
  isCorrect: boolean,
  baseDate: Date = new Date()
): SRSResult {
  let newStage = isCorrect ? (currentStage || 0) + 1 : 0;
  if (newStage > 5) newStage = 5;

  const addDays = SRS_INTERVAL_DAYS[newStage] ?? 0;
  const targetDate = new Date(baseDate.getTime());
  targetDate.setDate(targetDate.getDate() + addDays);

  return {
    newStage,
    nextReviewDate: targetDate.toISOString()
  };
}

/**
 * Determines whether a word is due for review based on its nextReviewDate.
 */
export function isWordDueForReview(word: Word, referenceDate: Date = new Date()): boolean {
  if (!word.nextReviewDate) return true; // Never reviewed or no schedule set
  return new Date(word.nextReviewDate).getTime() <= referenceDate.getTime();
}

/**
 * Checks if a word was created on the specified date (defaults to today in local/ISO date).
 */
export function isWordFromDate(word: Word, targetDateStr?: string): boolean {
  const target = targetDateStr || new Date().toISOString().split('T')[0];
  if (word.createdAt) {
    return word.createdAt.startsWith(target);
  }
  const timestamp = parseInt(word.id, 10);
  if (!isNaN(timestamp) && timestamp > 1000000000000) {
    return new Date(timestamp).toISOString().split('T')[0] === target;
  }
  return false;
}

