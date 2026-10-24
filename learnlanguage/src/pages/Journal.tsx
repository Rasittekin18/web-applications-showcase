import { useState, useEffect } from 'react';
import type { JournalEntry } from '../types';
import { getJournals, addJournal, deleteJournal, updateJournal, advanceQuest } from '../api';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { useLanguages } from '../context/LanguageContext';

export const Journal = () => {
  const { languages } = useLanguages();
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState<string>('all');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (languages.length > 0 && language === 'english') {
      setLanguage('all');
    }
  }, [languages]);

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      setLoading(true);
      const data = await getJournals();
      // Sort by date descending
      setJournals(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error('Error fetching journals:', error);
      // If endpoint doesn't exist yet, json-server might throw 404, we can handle it gracefully.
      setJournals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;

    try {
      if (editingId) {
        const updated = await updateJournal({
          id: editingId,
          date,
          content,
          language
        });
        setJournals(journals.map(j => j.id === editingId ? updated : j).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } else {
        const newEntry = await addJournal({
          date,
          content,
          language
        });
        setJournals([newEntry, ...journals].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        advanceQuest('journal_entries', 1);
      }
      setShowForm(false);
      setEditingId(null);
      setContent('');
      setDate(new Date().toISOString().split('T')[0]);
      setLanguage('all');
    } catch (error) {
      console.error('Error saving journal:', error);
    }
  };

  const handleEdit = (journal: JournalEntry) => {
    setEditingId(journal.id);
    setDate(journal.date);
    setLanguage(journal.language);
    setContent(journal.content);
    setShowForm(true);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu günlük girişini silmek istediğinize emin misiniz?')) return;
    
    try {
      await deleteJournal(id);
      setJournals(journals.filter(j => j.id !== id));
    } catch (error) {
      console.error('Error deleting journal:', error);
    }
  };

  const getLanguageLabel = (langId: string) => {
    if (langId === 'all' || langId === 'both') return 'Karma';
    const lang = languages.find(l => l.id === langId);
    return lang ? lang.name : langId;
  };

  const getLanguageColor = (langId: string) => {
    if (langId === 'all' || langId === 'both') return 'var(--danger)';
    const lang = languages.find(l => l.id === langId);
    return lang ? lang.color : 'var(--text-muted)';
  };

  return (
    <div className="container page-enter">
      <div className="flex justify-between items-center mb-8">
        <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>Günlük</h2>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => {
            setEditingId(null);
            setContent('');
            setDate(new Date().toISOString().split('T')[0]);
            setLanguage('all');
            setShowForm(true);
          }}>
            <Plus size={18} /> Yeni Giriş
          </button>
        )}
      </div>

      {showForm && (
        <form className="card mb-6" onSubmit={handleSubmit} style={{ border: '1px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>
            {editingId ? 'Günlüğü Düzenle' : 'Günlüğe Yaz'}
          </h3>
          
          <div className="flex gap-4 mb-4" style={{ flexWrap: 'wrap' }}>
            <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
              <label className="input-label" htmlFor="date">Tarih</label>
              <input
                id="date"
                className="input-field"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            
            <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
              <label className="input-label" htmlFor="language">Kullanılan Dil</label>
              <select
                id="language"
                className="input-field"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="all">Karma (Tüm Diller)</option>
                {languages.map(lang => (
                  <option key={lang.id} value={lang.id}>{lang.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-group mb-4">
            <label className="input-label" htmlFor="content">Bugün neler yaptınız? Kendinizi ifade edin...</label>
            <textarea
              id="content"
              className="input-field"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="I woke up early today..."
              rows={5}
              style={{ resize: 'vertical' }}
              required
            />
          </div>

          <div className="flex gap-4 justify-end">
            <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
              İptal
            </button>
            <button type="submit" className="btn btn-primary">
              Kaydet
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center" style={{ padding: '3rem 0', color: 'var(--text-muted)' }}>
          Yükleniyor...
        </div>
      ) : journals.length === 0 ? (
        <div className="text-center card" style={{ padding: '3rem 1rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '1rem' }}>
            Henüz hiç günlük girişi yapmamışsınız.
          </p>
          {!showForm && (
            <button className="btn btn-outline" onClick={() => setShowForm(true)}>
              İlk günlüğünüzü yazın
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {journals.map(journal => (
            <div key={journal.id} className="card flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                    {new Date(journal.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}
                  </h3>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    padding: '0.2rem 0.5rem', 
                    backgroundColor: 'var(--border-color)', 
                    borderRadius: '1rem', 
                    color: getLanguageColor(journal.language),
                    fontWeight: 600
                  }}>
                    {getLanguageLabel(journal.language)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button className="btn-icon" onClick={() => handleEdit(journal)} title="Düzenle">
                    <Edit2 size={18} />
                  </button>
                  <button className="btn-icon danger" onClick={() => handleDelete(journal.id)} title="Sil">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div style={{ padding: '1rem', backgroundColor: '#0f172a', borderRadius: '0.5rem', borderLeft: `3px solid ${getLanguageColor(journal.language)}` }}>
                <p style={{ color: 'var(--text-main)', fontSize: '1.05rem', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {journal.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
