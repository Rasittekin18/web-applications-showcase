import { collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import type { Word, JournalEntry, UserStats, Language, Story } from './types';

const getUserId = () => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Kullanıcı girişi yapılmamış.");
  return uid;
};

// --- WORDS ---
export const getWords = async (language: string): Promise<Word[]> => {
  const uid = getUserId();
  const snapshot = await getDocs(collection(db, `users/${uid}/${language}`));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Word));
};

export const addWord = async (language: string, word: Omit<Word, 'id'>): Promise<Word> => {
  const uid = getUserId();
  const docRef = await addDoc(collection(db, `users/${uid}/${language}`), {
    ...word,
    createdAt: new Date().toISOString()
  });
  return { id: docRef.id, ...word } as Word;
};

export const updateWord = async (language: string, word: Word): Promise<Word> => {
  const uid = getUserId();
  const { id, ...data } = word;
  await updateDoc(doc(db, `users/${uid}/${language}`, id), data);
  return word;
};

export const deleteWord = async (language: string, id: string): Promise<void> => {
  const uid = getUserId();
  await deleteDoc(doc(db, `users/${uid}/${language}`, id));
};

// --- JOURNALS ---
export const getJournals = async (): Promise<JournalEntry[]> => {
  const uid = getUserId();
  const snapshot = await getDocs(collection(db, `users/${uid}/journals`));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry));
};

export const addJournal = async (journal: Omit<JournalEntry, 'id'>): Promise<JournalEntry> => {
  const uid = getUserId();
  const docRef = await addDoc(collection(db, `users/${uid}/journals`), journal);
  return { id: docRef.id, ...journal } as JournalEntry;
};

export const updateJournal = async (journal: JournalEntry): Promise<JournalEntry> => {
  const uid = getUserId();
  const { id, ...data } = journal;
  await updateDoc(doc(db, `users/${uid}/journals`, id), data);
  return journal;
};

export const deleteJournal = async (id: string): Promise<void> => {
  const uid = getUserId();
  await deleteDoc(doc(db, `users/${uid}/journals`, id));
};

// --- STATS ---
export const getStats = async (): Promise<UserStats> => {
  const uid = getUserId();
  const docSnap = await getDoc(doc(db, `users/${uid}/stats`, 'main'));
  if (docSnap.exists()) {
    return docSnap.data() as UserStats;
  }
  return { xp: 0, streak: 0, lastLoginDate: '', quests: [] };
};

export const updateStats = async (stats: Partial<UserStats>): Promise<UserStats> => {
  const uid = getUserId();
  const currentStats = await getStats();
  const newStats = { ...currentStats, ...stats };
  await setDoc(doc(db, `users/${uid}/stats`, 'main'), newStats);
  return newStats as UserStats;
};

export const advanceQuest = async (type: 'words_added' | 'quiz_score' | 'journal_entries', amount: number = 1) => {
  try {
    const stats = await getStats();
    if (!stats.quests) return;

    let updated = false;
    const newQuests = stats.quests.map(q => {
      if (q.type === type && !q.completed) {
        updated = true;
        const newProgress = Math.min(q.target, q.progress + amount);
        const completed = newProgress >= q.target;
        return { ...q, progress: newProgress, completed };
      }
      return q;
    });

    if (updated) {
      let xpBonus = 0;
      newQuests.forEach((q, i) => {
        if (q.completed && !stats.quests![i].completed) xpBonus += 50;
      });

      await updateStats({ ...stats, xp: (stats.xp || 0) + xpBonus, quests: newQuests });
    }
  } catch (e) {
    console.error('Error advancing quest:', e);
  }
};

// --- LANGUAGES ---
export const getLanguages = async (): Promise<Language[]> => {
  const uid = getUserId();
  const snapshot = await getDocs(collection(db, `users/${uid}/languages`));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Language));
};

export const addLanguage = async (lang: Language): Promise<Language> => {
  const uid = getUserId();
  if (lang.id) {
    await setDoc(doc(db, `users/${uid}/languages`, lang.id), lang);
    return lang;
  } else {
    const docRef = await addDoc(collection(db, `users/${uid}/languages`), lang);
    return { ...lang, id: docRef.id };
  }
};

// --- STORIES ---
export const getStories = async (): Promise<Story[]> => {
  const uid = getUserId();
  const snapshot = await getDocs(collection(db, `users/${uid}/stories`));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));
};

export const addStory = async (story: Omit<Story, 'id'>): Promise<Story> => {
  const uid = getUserId();
  const docRef = await addDoc(collection(db, `users/${uid}/stories`), story);
  return { id: docRef.id, ...story } as Story;
};

export const deleteStory = async (id: string): Promise<void> => {
  const uid = getUserId();
  await deleteDoc(doc(db, `users/${uid}/stories`, id));
};

// --- SYSTEM RESET / INIT ---
export const factoryReset = async (overrideUid?: string): Promise<void> => {
  const uid = overrideUid || auth.currentUser?.uid;
  if (!uid) throw new Error("Kullanıcı girişi yapılmamış.");
  
  await setDoc(doc(db, `users/${uid}/stats`, 'main'), {
    xp: 0, streak: 0, lastLoginDate: '', quests: [], lastQuestDate: ''
  });

  await setDoc(doc(db, `users/${uid}/languages`, 'english'), {
    id: 'english', name: 'İngilizce', color: '#3b82f6', locale: 'en-US'
  });
  
  await setDoc(doc(db, `users/${uid}/languages`, 'german'), {
    id: 'german', name: 'Almanca', color: '#eab308', locale: 'de-DE'
  });
};
