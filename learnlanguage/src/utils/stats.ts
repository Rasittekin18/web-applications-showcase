import type { Quest } from '../types';

/**
 * Calculates new streak based on last login date and current streak count.
 */
export function calculateNewStreak(
  lastLoginDate: string,
  currentStreak: number,
  todayStr?: string
): { newStreak: number; isNewDay: boolean } {
  const today = todayStr || new Date().toISOString().split('T')[0];

  if (!lastLoginDate) {
    return { newStreak: 1, isNewDay: true };
  }

  if (lastLoginDate === today) {
    return { newStreak: currentStreak || 1, isNewDay: false };
  }

  // Calculate yesterday's date string
  const todayDate = new Date(today);
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  if (lastLoginDate === yesterday) {
    return { newStreak: (currentStreak || 0) + 1, isNewDay: true };
  }

  // More than 1 day missed -> reset streak to 1
  return { newStreak: 1, isNewDay: true };
}

/**
 * Advances quest progress for matching uncompleted quests and calculates bonus XP.
 */
export function advanceQuestsProgress(
  quests: Quest[],
  type: Quest['type'],
  amount: number = 1,
  bonusXpPerQuest: number = 50
): { updatedQuests: Quest[]; xpBonus: number; hasChanged: boolean } {
  let xpBonus = 0;
  let hasChanged = false;

  const updatedQuests = quests.map(quest => {
    if (quest.type === type && !quest.completed) {
      hasChanged = true;
      const newProgress = Math.min(quest.target, quest.progress + amount);
      const isCompleted = newProgress >= quest.target;
      if (isCompleted) {
        xpBonus += bonusXpPerQuest;
      }
      return {
        ...quest,
        progress: newProgress,
        completed: isCompleted
      };
    }
    return quest;
  });

  return { updatedQuests, xpBonus, hasChanged };
}

