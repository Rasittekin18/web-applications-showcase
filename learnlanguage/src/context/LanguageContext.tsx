import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Language } from '../types';
import { getLanguages } from '../api';

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
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLangs = async () => {
    try {
      setLoading(true);
      let data = await getLanguages();
      
      // Varsayılan dilleri kontrol et ve yoksa ekle
      if (data.length === 0) {
        const { addLanguage } = await import('../api');
        await addLanguage({ id: 'english', name: 'İngilizce', color: '#3b82f6', locale: 'en-US' });
        await addLanguage({ id: 'german', name: 'Almanca', color: '#eab308', locale: 'de-DE' });
        data = await getLanguages(); // Yeniden çek
      }
      
      setLanguages(data);
    } catch (error) {
      console.error('Error fetching languages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLangs();
  }, []);

  return (
    <LanguageContext.Provider value={{ languages, loading, refreshLanguages: fetchLangs }}>
      {children}
    </LanguageContext.Provider>
  );
};
