import { Edit2, Trash2, Volume2 } from 'lucide-react';
import type { Word } from '../types';

interface WordCardProps {
  word: Word;
  locale?: string;
  onEdit: (word: Word) => void;
  onDelete: (id: string) => void;
}

export const WordCard = ({ word, locale, onEdit, onDelete }: WordCardProps) => {
  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    if (locale) utterance.lang = locale;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {word.word}
            <button className="btn-icon" onClick={() => speak(word.word)} title="Dinle">
              <Volume2 size={16} />
            </button>
          </h3>
          <p style={{ color: 'var(--text-main)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {word.translation}
            {word.category && (
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--border-color)', borderRadius: '1rem', color: 'var(--text-muted)' }}>
                {word.category}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-icon" onClick={() => onEdit(word)} title="Düzenle">
            <Edit2 size={18} />
          </button>
          <button className="btn-icon danger" onClick={() => onDelete(word.id)} title="Sil">
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      {word.sentence && (
        <div style={{ padding: '0.75rem', backgroundColor: '#0f172a', borderRadius: '0.5rem', borderLeft: '3px solid var(--primary)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontStyle: 'italic' }}>
            "{word.sentence}"
          </p>
        </div>
      )}
    </div>
  );
};
