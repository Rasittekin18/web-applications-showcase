import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Language } from '../types';
import { getLanguages, addLanguage } from '../api';
import { useAuth } from './AuthContext';

interface LanguageContextType {
  languages: Language[];
  loading: boolean;
  refreshLanguages: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType>({
  languages: [],
  loading: true,
  refreshLanguages: async () => {},
});

export const useLanguages = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLangs = useCallback(async () => {
    if (!currentUser) {
      setLanguages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let data = await getLanguages();
      
      // Check default languages and add if empty
      if (data.length === 0) {
        await addLanguage({ id: 'english', name: 'İngilizce', color: '#3b82f6', locale: 'en-US' });
        await addLanguage({ id: 'german', name: 'Almanca', color: '#eab308', locale: 'de-DE' });
        data = await getLanguages();
      }
      
      setLanguages(data);
    } catch (error) {
      console.error('Error fetching languages:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchLangs();
  }, [fetchLangs]);

  return (
    <LanguageContext.Provider value={{ languages, loading, refreshLanguages: fetchLangs }}>
      {children}
    </LanguageContext.Provider>
  );
};
