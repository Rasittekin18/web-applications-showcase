import { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, ChevronLeft } from 'lucide-react';
import { useLanguages } from '../context/LanguageContext';
import { getStories, addStory, deleteStory, addWord } from '../api';
import type { Story } from '../types';

export const Stories = () => {
  const { languages } = useLanguages();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  // Add Word Modal State
  const [selectedWord, setSelectedWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [isAddingWord, setIsAddingWord] = useState(false);

  useEffect(() => {
    if (languages.length > 0 && !newLanguage) {
      setNewLanguage(languages[0].id);
    }
  }, [languages]);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setLoading(true);
      const data = await getStories();
      setStories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !newLanguage) return;
    
    try {
      const added = await addStory({ title: newTitle, content: newContent, language: newLanguage });
      setStories([...stories, added]);
      setShowAddForm(false);
      setNewTitle('');
      setNewContent('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Silmek istediğinize emin misiniz?')) return;
    try {
      await deleteStory(id);
      setStories(stories.filter(s => s.id !== id));
      if (selectedStory?.id === id) setSelectedStory(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleWordClick = (wordRaw: string) => {
    // Strip punctuation
    const cleanWord = wordRaw.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"").trim();
    if (cleanWord) {
      setSelectedWord(cleanWord);
      setTranslation('');
      setIsAddingWord(true);
    }
  };

  const submitNewWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStory || !selectedWord || !translation) return;

    try {
      await addWord(selectedStory.language, {
        word: selectedWord.toLowerCase(),
        translation,
        category: 'Okuma',
        sentence: `"${selectedWord}" kelimesi '${selectedStory.title}' metninden eklendi.`,
        srsStage: 0
      });
      setIsAddingWord(false);
      alert('Kelime başarıyla eklendi!');
    } catch (error) {
      console.error(error);
      alert('Hata oluştu.');
    }
  };

  if (loading) return <div className="container page-enter">Yükleniyor...</div>;

  if (selectedStory) {
    const langColor = languages.find(l => l.id === selectedStory.language)?.color || 'var(--primary)';
    
    return (
      <div className="container page-enter flex flex-col items-center">
        <div className="flex justify-between items-center w-full mb-6" style={{ maxWidth: '800px' }}>
          <button className="btn btn-outline flex items-center gap-2" onClick={() => setSelectedStory(null)}>
            <ChevronLeft size={18} /> Geri
          </button>
          <button className="btn btn-outline danger" onClick={(e) => handleDelete(selectedStory.id, e)}>
            <Trash2 size={18} />
          </button>
        </div>

        <div className="card w-full" style={{ maxWidth: '800px', padding: '2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem', color: langColor, borderBottom: `2px solid ${langColor}40`, paddingBottom: '1rem' }}>
            {selectedStory.title}
          </h2>
          <div style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--text-main)' }}>
            <p className="mb-4" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
              Bilmediğiniz kelimelerin üzerine tıklayarak sözlüğünüze ekleyebilirsiniz.
            </p>
            {selectedStory.content.split('\n').map((paragraph, i) => (
              <p key={i} className="mb-4">
                {paragraph.split(' ').map((word, j) => (
                  <span 
                    key={j} 
                    style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                    onClick={() => handleWordClick(word)}
                    onMouseEnter={(e) => e.currentTarget.style.color = langColor}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                  >
                    {word}{' '}
                  </span>
                ))}
              </p>
            ))}
          </div>
        </div>

        {/* Word Add Modal */}
        {isAddingWord && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} className="page-enter">
            <div className="card" style={{ width: '90%', maxWidth: '400px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                Kelime Ekle 
                <span style={{ color: langColor }}>{languages.find(l => l.id === selectedStory.language)?.name}</span>
              </h3>
              <form onSubmit={submitNewWord}>
                <div className="input-group mb-4">
                  <label className="input-label">Kelime</label>
                  <input type="text" className="input-field" value={selectedWord} onChange={e => setSelectedWord(e.target.value)} required />
                </div>
                <div className="input-group mb-4">
                  <label className="input-label">Türkçe Çevirisi</label>
                  <input type="text" className="input-field" value={translation} onChange={e => setTranslation(e.target.value)} autoFocus required />
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn btn-outline flex-1" onClick={() => setIsAddingWord(false)}>İptal</button>
                  <button type="submit" className="btn btn-primary flex-1">Ekle</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container page-enter flex flex-col items-center">
      <BookOpen size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
      <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Okuma Parçaları</h2>

      <div className="w-full mb-6" style={{ maxWidth: '800px' }}>
        {!showAddForm ? (
          <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowAddForm(true)}>
            <Plus size={20} /> Yeni Metin Ekle
          </button>
        ) : (
          <form className="card page-enter" onSubmit={handleAddStory}>
            <div className="input-group mb-4">
              <label className="input-label">Dil</label>
              <select className="input-field" value={newLanguage} onChange={e => setNewLanguage(e.target.value)}>
                {languages.map(lang => (
                  <option key={lang.id} value={lang.id}>{lang.name}</option>
                ))}
              </select>
            </div>
            <div className="input-group mb-4">
              <label className="input-label">Başlık</label>
              <input type="text" className="input-field" value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
            </div>
            <div className="input-group mb-4">
              <label className="input-label">Metin (Hikaye, Makale vs.)</label>
              <textarea 
                className="input-field" 
                rows={10} 
                value={newContent} 
                onChange={e => setNewContent(e.target.value)} 
                required
                placeholder="Metni buraya yapıştırın..."
              ></textarea>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn btn-outline" onClick={() => setShowAddForm(false)}>İptal</button>
              <button type="submit" className="btn btn-primary">Kaydet</button>
            </div>
          </form>
        )}
      </div>

      <div className="w-full grid-layout" style={{ maxWidth: '800px' }}>
        {stories.length === 0 ? (
          <div className="card text-center" style={{ gridColumn: '1 / -1' }}>
            <p style={{ color: 'var(--text-muted)' }}>Henüz okuma parçası eklemediniz.</p>
          </div>
        ) : (
          stories.map(story => {
            const langColor = languages.find(l => l.id === story.language)?.color || 'var(--text-muted)';
            return (
              <div 
                key={story.id} 
                className="card" 
                style={{ cursor: 'pointer', borderTop: `4px solid ${langColor}`, transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                onClick={() => setSelectedStory(story)}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{story.title}</h3>
                  <button className="btn-icon danger" onClick={(e) => handleDelete(story.id, e)}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {story.content}
                </p>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
};
