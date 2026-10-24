export interface Word {
  id: string;
  word: string;
  translation: string;
  sentence: string;
  category?: string;
  createdAt?: string;
  srsStage?: number; // 0-5
  nextReviewDate?: string; // ISO String
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  language: string; // 'english' | 'german' | 'both'
}

export interface Quest {
  id: string;
  title: string;
  target: number;
  progress: number;
  completed: boolean;
  type: 'words_added' | 'quiz_score' | 'journal_entries';
}

export interface Story {
  id: string;
  title: string;
  content: string;
  language: string;
}

export interface UserStats {
  xp: number;
  streak: number;
  lastLoginDate: string;
  quests?: Quest[];
  lastQuestDate?: string;
}

export interface Language {
  id: string; // e.g. "english"
  name: string; // e.g. "İngilizce"
  color: string; // e.g. "var(--primary)" or hex
  locale?: string; // e.g. "en-US", "de-DE", "ar-SA" for TTS and Speech Recognition
}
