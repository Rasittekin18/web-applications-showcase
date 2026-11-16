import { describe, it, expect } from 'vitest';
import { calculateSRSNextReview, isWordDueForReview, isWordFromDate, SRS_INTERVAL_DAYS } from '../srs';
import type { Word } from '../../types';

describe('SRS Utilities', () => {
  const baseDate = new Date('2026-11-09T10:00:00.000Z');

  describe('calculateSRSNextReview', () => {
    it('should advance from stage 0 to stage 1 on correct answer', () => {
      const result = calculateSRSNextReview(0, true, baseDate);
      expect(result.newStage).toBe(1);
      
      const expectedDate = new Date(baseDate);
      expectedDate.setDate(expectedDate.getDate() + SRS_INTERVAL_DAYS[1]);
      expect(result.nextReviewDate).toBe(expectedDate.toISOString());
    });

    it('should advance consecutively up to max stage 5', () => {
      let stage = 0;
      for (let i = 1; i <= 5; i++) {
        const res = calculateSRSNextReview(stage, true, baseDate);
        expect(res.newStage).toBe(i);
        stage = res.newStage;
      }

      // Beyond stage 5, should cap at 5
      const capped = calculateSRSNextReview(5, true, baseDate);
      expect(capped.newStage).toBe(5);
    });

    it('should reset to stage 0 on wrong answer', () => {
      const res = calculateSRSNextReview(4, false, baseDate);
      expect(res.newStage).toBe(0);
      expect(res.nextReviewDate).toBe(baseDate.toISOString());
    });

    it('should handle undefined or null initial stage gracefully', () => {
      const res = calculateSRSNextReview(undefined as any, true, baseDate);
      expect(res.newStage).toBe(1);
    });
  });

  describe('isWordDueForReview', () => {
    it('returns true if word has no nextReviewDate', () => {
      const word: Word = { id: '1', word: 'apple', translation: 'elma', sentence: '' };
      expect(isWordDueForReview(word, baseDate)).toBe(true);
    });

    it('returns true if nextReviewDate is in the past', () => {
      const pastDate = new Date(baseDate.getTime() - 86400000).toISOString();
      const word: Word = { id: '1', word: 'apple', translation: 'elma', sentence: '', nextReviewDate: pastDate };
      expect(isWordDueForReview(word, baseDate)).toBe(true);
    });

    it('returns false if nextReviewDate is in the future', () => {
      const futureDate = new Date(baseDate.getTime() + 86400000).toISOString();
      const word: Word = { id: '1', word: 'apple', translation: 'elma', sentence: '', nextReviewDate: futureDate };
      expect(isWordDueForReview(word, baseDate)).toBe(false);
    });
  });

  describe('isWordFromDate', () => {
    it('matches word by createdAt prefix', () => {
      const word: Word = {
        id: '1',
        word: 'test',
        translation: 'test',
        sentence: '',
        createdAt: '2026-11-09T08:30:00.000Z'
      };
      expect(isWordFromDate(word, '2026-11-09')).toBe(true);
      expect(isWordFromDate(word, '2026-11-08')).toBe(false);
    });

    it('matches word by timestamp ID if createdAt is missing', () => {
      const timestamp = new Date('2026-11-09T00:00:00.000Z').getTime().toString();
      const word: Word = {
        id: timestamp,
        word: 'test',
        translation: 'test',
        sentence: ''
      };
      expect(isWordFromDate(word, '2026-11-09')).toBe(true);
    });
  });
});

