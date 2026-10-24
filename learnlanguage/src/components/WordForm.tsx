import { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import type { Word } from '../types';

interface WordFormProps {
  initialData?: Word;
  langName?: string;
  onSubmit: (word: Omit<Word, 'id'> | Word) => void;
  onCancel: () => void;
}

export const WordForm = ({ initialData, langName, onSubmit, onCancel }: WordFormProps) => {
  const [word, setWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [sentence, setSentence] = useState('');
  const [category, setCategory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (initialData) {
      setWord(initialData.word);
      setTranslation(initialData.translation);
      setSentence(initialData.sentence || '');
      setCategory(initialData.category || '');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word || !translation) return;

    if (initialData) {
      onSubmit({ ...initialData, word, translation, sentence, category });
    } else {
      onSubmit({ word, translation, sentence, category });
    }
    
    // Reset form
    if (!initialData) {
      setWord('');
      setTranslation('');
      setSentence('');
      setCategory('');
    }
  };

  const generateSentence = async () => {
    if (!word || !translation) {
      alert('AI ile cümle üretmek için önce kelimeyi ve anlamını girmelisiniz.');
      return;
    }

    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      alert('Ayarlar sayfasından Gemini API anahtarınızı girmeniz gerekiyor.');
      return;
    }

    try {
      setIsGenerating(true);
      const prompt = `${langName ? langName + ' dilinde' : ''} "${word}" (Anlamı: ${translation}) kelimesini içeren bir örnek cümle yaz ve bir alt satırda Türkçesini ver. Sadece cümleyi ve çeviriyi ver, başka açıklama yapma.`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      
      const generatedText = data.candidates[0].content.parts[0].text;
      setSentence(generatedText.trim());
    } catch (e: any) {
      console.error(e);
      alert('Cümle üretilirken hata oluştu: ' + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <form className="card mb-6" onSubmit={handleSubmit} style={{ border: '1px solid var(--primary)' }}>
      <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>
        {initialData ? 'Kelimeyi Düzenle' : 'Yeni Kelime Ekle'}
      </h3>
      
      <div className="input-group">
        <label className="input-label" htmlFor="word">Kelime</label>
        <input
          id="word"
          className="input-field"
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Örn: Serendipity"
          required
        />
      </div>
      
      <div className="input-group">
        <label className="input-label" htmlFor="translation">Türkçe Karşılığı</label>
        <input
          id="translation"
          className="input-field"
          type="text"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          placeholder="Örn: Mutlu tesadüf"
          required
        />
      </div>

      <div className="input-group">
        <label className="input-label" htmlFor="category">Kategori / Grup (İsteğe Bağlı)</label>
        <input
          id="category"
          className="input-field"
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Örn: Fiil, A1, İş, vb."
        />
      </div>

      <div className="input-group mb-4">
        <div className="flex justify-between items-center mb-1">
          <label className="input-label" htmlFor="sentence" style={{ margin: 0 }}>Örnek Cümle (İsteğe Bağlı)</label>
          <button 
            type="button" 
            className="btn btn-outline" 
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
            onClick={generateSentence}
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />} 
            AI ile Üret
          </button>
        </div>
        <textarea
          id="sentence"
          className="input-field"
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          placeholder="Kelimeyi bir cümle içinde kullanın..."
          rows={3}
          style={{ resize: 'vertical' }}
        />
      </div>

      <div className="flex gap-4 justify-end">
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          İptal
        </button>
        <button type="submit" className="btn btn-primary">
          {initialData ? 'Güncelle' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
};
