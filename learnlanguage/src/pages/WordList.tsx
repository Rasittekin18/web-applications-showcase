import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { WordCard } from '../components/WordCard';
import { WordForm } from '../components/WordForm';
import type { Word } from '../types';
import { getWords, addWord, updateWord, deleteWord, advanceQuest } from '../api';
import { Plus } from 'lucide-react';
import { useLanguages } from '../context/LanguageContext';

export const WordList = () => {
  const { langId } = useParams<{ langId: string }>();
  const { languages, loading: langsLoading } = useLanguages();
  
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | undefined>();
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const currentLang = languages.find(l => l.id === langId);

  useEffect(() => {
    if (langId) {
      fetchWords();
    }
  }, [langId]);

  const fetchWords = async () => {
    try {
      setLoading(true);
      const data = await getWords(langId!);
      setWords(data);
    } catch (error) {
      console.error('Error fetching words:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (wordData: Omit<Word, 'id'>) => {
    try {
      const newWord = await addWord(langId!, wordData);
      setWords([...words, newWord]);
      advanceQuest('words_added', 1);
      setShowForm(false);
    } catch (error) {
      console.error('Error adding word:', error);
    }
  };

  const handleUpdate = async (wordData: Word) => {
    try {
      const updated = await updateWord(langId!, wordData);
      setWords(words.map(w => w.id === updated.id ? updated : w));
      setEditingWord(undefined);
    } catch (error) {
      console.error('Error updating word:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu kelimeyi silmek istediğinize emin misiniz?')) return;
    
    try {
      await deleteWord(langId!, id);
      setWords(words.filter(w => w.id !== id));
    } catch (error) {
      console.error('Error deleting word:', error);
    }
  };

  const handleSubmit = (wordData: Omit<Word, 'id'> | Word) => {
    if ('id' in wordData) {
      handleUpdate(wordData as Word);
    } else {
      handleAdd(wordData);
    }
  };

  const categories = Array.from(new Set(words.map(w => w.category).filter(Boolean))) as string[];
  const filteredWords = filterCategory === 'all' 
    ? words 
    : words.filter(w => w.category === filterCategory);

  if (langsLoading) return <div className="container page-enter">Yükleniyor...</div>;
  if (!currentLang) return <Navigate to="/" />;

  return (
    <div className="container page-enter">
      <div className="flex justify-between items-center mb-8">
        <h2 style={{ fontSize: '2rem', fontWeight: 700, color: currentLang.color }}>{currentLang.name} Kelimeleri</h2>
        {!showForm && !editingWord && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={18} /> Yeni Kelime
          </button>
        )}
      </div>

      {!loading && words.length > 0 && categories.length > 0 && (
        <div className="flex gap-2 mb-6" style={{ flexWrap: 'wrap' }}>
          <button 
            className={`btn ${filterCategory === 'all' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            onClick={() => setFilterCategory('all')}
          >
            Tümü
          </button>
          {categories.map(cat => (
            <button 
              key={cat}
              className={`btn ${filterCategory === cat ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              onClick={() => setFilterCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {(showForm || editingWord) && (
        <WordForm 
          langName={currentLang.name}
          initialData={editingWord} 
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingWord(undefined);
          }}
        />
      )}

      {loading ? (
        <div className="text-center" style={{ padding: '3rem 0', color: 'var(--text-muted)' }}>
          Yükleniyor...
        </div>
      ) : words.length === 0 ? (
        <div className="text-center card" style={{ padding: '3rem 1rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '1rem' }}>
            Henüz kelime eklenmemiş.
          </p>
          {!showForm && (
            <button className="btn btn-outline" onClick={() => setShowForm(true)}>
              İlk kelimenizi ekleyin
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredWords.length === 0 ? (
            <div className="text-center" style={{ padding: '2rem 0', color: 'var(--text-muted)' }}>
              Bu kategoride kelime bulunamadı.
            </div>
          ) : (
            filteredWords.map(word => (
              <WordCard 
                key={word.id} 
                word={word} 
                locale={currentLang.locale}
                onEdit={setEditingWord} 
                onDelete={handleDelete} 
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
