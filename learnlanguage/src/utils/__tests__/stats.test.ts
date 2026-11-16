import { describe, it, expect } from 'vitest';
import { calculateNewStreak, advanceQuestsProgress } from '../stats';
import type { Quest } from '../../types';

describe('Stats & Quest Utilities', () => {
  describe('calculateNewStreak', () => {
    const today = '2026-11-09';
    const yesterday = '2026-11-08';
    const twoDaysAgo = '2026-11-07';

    it('starts streak at 1 if no previous login date exists', () => {
      const res = calculateNewStreak('', 0, today);
      expect(res.newStreak).toBe(1);
      expect(res.isNewDay).toBe(true);
    });

    it('keeps streak unchanged if user logs in multiple times on the same day', () => {
      const res = calculateNewStreak(today, 5, today);
      expect(res.newStreak).toBe(5);
      expect(res.isNewDay).toBe(false);
    });

    it('increments streak if previous login was yesterday', () => {
      const res = calculateNewStreak(yesterday, 3, today);
      expect(res.newStreak).toBe(4);
      expect(res.isNewDay).toBe(true);
    });

    it('resets streak to 1 if user missed a day', () => {
      const res = calculateNewStreak(twoDaysAgo, 10, today);
      expect(res.newStreak).toBe(1);
      expect(res.isNewDay).toBe(true);
    });
  });

  describe('advanceQuestsProgress', () => {
    const initialQuests: Quest[] = [
      { id: 'q1', title: '5 Kelime Ekle', target: 5, progress: 2, completed: false, type: 'words_added' },
      { id: 'q2', title: 'Quiz Yap', target: 5, progress: 0, completed: false, type: 'quiz_score' }
    ];

    it('increments progress for matching quest type', () => {
      const { updatedQuests, xpBonus, hasChanged } = advanceQuestsProgress(initialQuests, 'words_added', 2);
      expect(hasChanged).toBe(true);
      expect(updatedQuests[0].progress).toBe(4);
      expect(updatedQuests[0].completed).toBe(false);
      expect(xpBonus).toBe(0);
    });

    it('marks quest as completed and awards 50 XP bonus when target reached', () => {
      const { updatedQuests, xpBonus, hasChanged } = advanceQuestsProgress(initialQuests, 'words_added', 3);
      expect(hasChanged).toBe(true);
      expect(updatedQuests[0].progress).toBe(5);
      expect(updatedQuests[0].completed).toBe(true);
      expect(xpBonus).toBe(50);
    });

    it('does not re-advance already completed quests', () => {
      const completedQuests: Quest[] = [
        { id: 'q1', title: '5 Kelime Ekle', target: 5, progress: 5, completed: true, type: 'words_added' }
      ];
      const { updatedQuests, xpBonus, hasChanged } = advanceQuestsProgress(completedQuests, 'words_added', 1);
      expect(hasChanged).toBe(false);
      expect(updatedQuests[0].progress).toBe(5);
      expect(xpBonus).toBe(0);
    });
  });
});

