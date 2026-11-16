import { describe, it, expect } from 'vitest';
import { generateQuizOptions, isAnswerCorrect, normalizeText } from '../quiz';
import type { Word } from '../../types';

describe('Quiz Utilities', () => {
  describe('normalizeText', () => {
    it('trims leading/trailing whitespace and downcases', () => {
      expect(normalizeText('  HELLO World  ')).toBe('hello world');
    });

    it('collapses multiple whitespace spaces into one', () => {
      expect(normalizeText('a   b    c')).toBe('a b c');
    });
  });

  describe('isAnswerCorrect', () => {
    it('returns true for exact match ignoring case', () => {
      expect(isAnswerCorrect('Apple', 'apple')).toBe(true);
      expect(isAnswerCorrect('  car ', 'CAR')).toBe(true);
    });

    it('returns false for mismatched answers', () => {
      expect(isAnswerCorrect('dog', 'cat')).toBe(false);
    });
  });

  describe('generateQuizOptions', () => {
    const mockWords: Word[] = [
      { id: '1', word: 'cat', translation: 'kedi', sentence: '' },
      { id: '2', word: 'dog', translation: 'köpek', sentence: '' },
      { id: '3', word: 'bird', translation: 'kuş', sentence: '' },
      { id: '4', word: 'fish', translation: 'balık', sentence: '' },
      { id: '5', word: 'horse', translation: 'at', sentence: '' },
      { id: '6', word: 'mouse', translation: 'fare', sentence: '' },
    ];

    it('always includes the correct translation', () => {
      const options = generateQuizOptions('kedi', mockWords, 4);
      expect(options).toContain('kedi');
    });

    it('returns requested number of options when enough distinct words exist', () => {
      const options = generateQuizOptions('kedi', mockWords, 4);
      expect(options.length).toBe(4);
      expect(new Set(options).size).toBe(4);
    });

    it('does not duplicate the correct answer among distractors', () => {
      const wordsWithDuplicates: Word[] = [
        ...mockWords,
        { id: '7', word: 'feline', translation: 'kedi', sentence: '' }
      ];
      const options = generateQuizOptions('kedi', wordsWithDuplicates, 4);
      const occurrences = options.filter(o => o.toLowerCase() === 'kedi').length;
      expect(occurrences).toBe(1);
    });

    it('gracefully handles fewer available words than requested options', () => {
      const fewWords: Word[] = [
        { id: '1', word: 'cat', translation: 'kedi', sentence: '' },
        { id: '2', word: 'dog', translation: 'köpek', sentence: '' }
      ];
      const options = generateQuizOptions('kedi', fewWords, 4);
      expect(options).toContain('kedi');
      expect(options).toContain('köpek');
      expect(options.length).toBe(2);
    });
  });
});

