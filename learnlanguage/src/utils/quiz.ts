import type { Word } from '../types';

/**
 * Normalizes a string for lenient comparison (trims, lowercases, removes double spaces).
 */
export function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Checks whether user input matches the expected answer.
 */
export function isAnswerCorrect(input: string, expected: string): boolean {
  return normalizeText(input) === normalizeText(expected);
}

/**
 * Generates options for a multiple choice question.
 * Always includes the correct answer and randomly selected unique distractors.
 */
export function generateQuizOptions(
  correctTranslation: string,
  allWords: Word[],
  totalOptions: number = 4
): string[] {
  // Collect unique distractor translations
  const uniqueDistractors = Array.from(
    new Set(
      allWords
        .map(w => w.translation?.trim())
        .filter(t => t && t.toLowerCase() !== correctTranslation.trim().toLowerCase())
    )
  );

  // Shuffle distractors
  const shuffled = [...uniqueDistractors].sort(() => 0.5 - Math.random());
  const selectedDistractors = shuffled.slice(0, Math.max(0, totalOptions - 1));

  // Combine and shuffle final options
  const options = [correctTranslation.trim(), ...selectedDistractors];
  return options.sort(() => 0.5 - Math.random());
}

