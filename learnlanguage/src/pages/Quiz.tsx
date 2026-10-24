import { useState, useEffect } from 'react';
import type { Word } from '../types';
import { getWords, updateWord, getStats, updateStats, advanceQuest } from '../api';
import { BrainCircuit, Check, X, RotateCcw, Keyboard, List, Layers, Volume2, Mic } from 'lucide-react';
import { useLanguages } from '../context/LanguageContext';

type QuizMode = 'all' | 'today' | 'category' | 'srs';
type QuizType = 'flashcard' | 'multiple_choice' | 'typing' | 'speaking';

interface QuizQuestion {
  word: Word;
  options?: string[]; // For multiple choice
}

export const Quiz = () => {
  const { languages } = useLanguages();
  const [language, setLanguage] = useState<string>('');
  const [mode, setMode] = useState<QuizMode>('all');
  const [quizType, setQuizType] = useState<QuizType>('flashcard');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongWords, setWrongWords] = useState<Word[]>([]);
  
  // Flashcard state
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Typing state
  const [typingInput, setTypingInput] = useState('');
  const [typingFeedback, setTypingFeedback] = useState<'none' | 'correct' | 'wrong'>('none');

  // Multiple choice state
  const [mcFeedback, setMcFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Speaking state
  const [speakingFeedback, setSpeakingFeedback] = useState<'none' | 'listening' | 'correct' | 'wrong'>('none');
  const [spokenText, setSpokenText] = useState('');

  const [quizState, setQuizState] = useState<'setup' | 'playing' | 'results'>('setup');
  const [loading, setLoading] = useState(false);
  
  // XP Earned in this session
  const [xpEarned, setXpEarned] = useState(0);

  useEffect(() => {
    if (languages.length > 0 && !language) {
      setLanguage(languages[0].id);
    }
  }, [languages]);

  useEffect(() => {
    if (quizState === 'setup' && language) {
      fetchWordsForSetup();
    }
  }, [language, quizState]);

  const fetchWordsForSetup = async () => {
    try {
      setLoading(true);
      const data = await getWords(language);
      setAllWords(data);
      
      const uniqueCats = Array.from(new Set(data.map(w => w.category).filter(Boolean))) as string[];
      setCategories(uniqueCats);
      if (uniqueCats.length > 0 && !selectedCategory) {
        setSelectedCategory(uniqueCats[0]);
      }
    } catch (error) {
      console.error('Error fetching words:', error);
    } finally {
      setLoading(false);
    }
  };

  const isWordFromToday = (word: Word) => {
    const today = new Date().toISOString().split('T')[0];
    if (word.createdAt) {
      return word.createdAt.startsWith(today);
    }
    const timestamp = parseInt(word.id);
    if (!isNaN(timestamp) && timestamp > 1000000000000) {
      return new Date(timestamp).toISOString().split('T')[0] === today;
    }
    return false;
  };

  const isWordDueForReview = (word: Word) => {
    if (!word.nextReviewDate) return true; // Never reviewed
    return new Date(word.nextReviewDate).getTime() <= Date.now();
  };

  const generateOptions = (correctTranslation: string, all: Word[]): string[] => {
    const others = all.filter(w => w.translation !== correctTranslation).sort(() => 0.5 - Math.random()).slice(0, 3);
    const options = [correctTranslation, ...others.map(w => w.translation)];
    return options.sort(() => 0.5 - Math.random());
  };

  const startQuiz = () => {
    let filtered = [...allWords];
    
    if (mode === 'today') {
      filtered = filtered.filter(isWordFromToday);
    } else if (mode === 'category' && selectedCategory) {
      filtered = filtered.filter(w => w.category === selectedCategory);
    } else if (mode === 'srs') {
      filtered = filtered.filter(isWordDueForReview);
    }

    if (filtered.length === 0) {
      alert('Bu kriterlere uygun kelime bulunamadı.');
      return;
    }

    filtered.sort(() => Math.random() - 0.5);
    
    // Limit to 20 words max per session to keep it manageable
    const selectedWords = filtered.slice(0, 20);

    const generatedQuestions: QuizQuestion[] = selectedWords.map(word => ({
      word,
      options: quizType === 'multiple_choice' ? generateOptions(word.translation, allWords) : undefined
    }));
    
    setQuestions(generatedQuestions);
    setCurrentIndex(0);
    setScore(0);
    setXpEarned(0);
    setWrongWords([]);
    setIsFlipped(false);
    setTypingInput('');
    setTypingFeedback('none');
    setMcFeedback('none');
    setSelectedOption(null);
    setSpeakingFeedback('none');
    setSpokenText('');
    setQuizState('playing');
  };

  const currentLocale = languages.find(l => l.id === language)?.locale;

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    if (currentLocale) utterance.lang = currentLocale;
    window.speechSynthesis.speak(utterance);
  };

  const processSRS = async (word: Word, isCorrect: boolean) => {
    const currentStage = word.srsStage || 0;
    let newStage = isCorrect ? currentStage + 1 : 0;
    if (newStage > 5) newStage = 5;

    // Calculate next review date based on stage
    const now = new Date();
    let addDays = 0;
    switch(newStage) {
      case 0: addDays = 0; break; // Review immediately/tomorrow
      case 1: addDays = 1; break; // 1 day
      case 2: addDays = 3; break; // 3 days
      case 3: addDays = 7; break; // 1 week
      case 4: addDays = 14; break; // 2 weeks
      case 5: addDays = 30; break; // 1 month
    }
    
    now.setDate(now.getDate() + addDays);
    
    const updatedWord = { ...word, srsStage: newStage, nextReviewDate: now.toISOString() };
    await updateWord(language, updatedWord);
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setTypingInput('');
      setTypingFeedback('none');
      setMcFeedback('none');
      setSelectedOption(null);
      setSpeakingFeedback('none');
      setSpokenText('');
    } else {
      finishQuiz();
    }
  };

  const handleAnswer = async (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(s => s + 1);
      advanceQuest('quiz_score', 1);
    } else {
      setWrongWords(w => [...w, questions[currentIndex].word]);
    }
    
    // Fire and forget SRS update
    processSRS(questions[currentIndex].word, isCorrect);
    
    // If flashcard, go next immediately. Otherwise, show feedback and wait.
    if (quizType === 'flashcard') {
      handleNext();
    }
  };

  const finishQuiz = async () => {
    setQuizState('results');
    try {
      // Calculate XP: 10 XP per correct answer
      const earned = score * 10;
      if (earned > 0) {
        setXpEarned(earned);
        const currentStats = await getStats();
        
        // Streak logic
        const today = new Date().toISOString().split('T')[0];
        let newStreak = currentStats.streak;
        if (currentStats.lastLoginDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (currentStats.lastLoginDate === yesterday.toISOString().split('T')[0]) {
            newStreak += 1; // Logged in yesterday, increment
          } else {
            newStreak = 1; // Broken streak
          }
        }

        await updateStats({
          xp: currentStats.xp + earned,
          streak: newStreak,
          lastLoginDate: today
        });
      }
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  const resetQuiz = () => {
    setQuizState('setup');
  };

  // RENDERING HELPERS
  const renderFlashcard = (word: Word) => (
    <>
      <div 
        className="card text-center" 
        style={{ 
          width: '100%', maxWidth: '500px', minHeight: '250px', display: 'flex', flexDirection: 'column', 
          justifyContent: 'center', alignItems: 'center', cursor: isFlipped ? 'default' : 'pointer',
          transition: 'all 0.3s ease', border: isFlipped ? '2px solid var(--primary)' : '2px dashed var(--border-color)'
        }}
        onClick={() => !isFlipped && setIsFlipped(true)}
      >
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {word.word}
          <button className="btn-icon" onClick={(e) => { e.stopPropagation(); speak(word.word); }} title="Dinle">
            <Volume2 size={24} />
          </button>
        </h2>
        
        {!isFlipped ? (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Cevabı görmek için karta tıklayın</p>
        ) : (
          <div className="page-enter">
            <p style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
              {word.translation}
            </p>
            {word.sentence && <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>"{word.sentence}"</p>}
          </div>
        )}
      </div>

      {isFlipped && (
        <div className="flex gap-4 mt-8 page-enter" style={{ width: '100%', maxWidth: '500px' }}>
          <button className="btn btn-danger flex-1" style={{ padding: '1rem', fontSize: '1.1rem' }} onClick={() => handleAnswer(false)}>
            <X size={20} /> Bilemedim
          </button>
          <button className="btn flex-1" style={{ backgroundColor: 'var(--success)', color: 'white', padding: '1rem', fontSize: '1.1rem' }} onClick={() => handleAnswer(true)}>
            <Check size={20} /> Bildim
          </button>
        </div>
      )}
    </>
  );

  const renderMultipleChoice = (q: QuizQuestion) => {
    const handleMcSelect = (opt: string) => {
      if (mcFeedback !== 'none') return;
      setSelectedOption(opt);
      const isCorrect = opt === q.word.translation;
      setMcFeedback(isCorrect ? 'correct' : 'wrong');
      handleAnswer(isCorrect);
    };

    return (
      <>
        <div className="card text-center mb-6" style={{ width: '100%', maxWidth: '500px', minHeight: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{q.word.word}</h2>
        </div>

        <div className="flex flex-col gap-3" style={{ width: '100%', maxWidth: '500px' }}>
          {q.options?.map(opt => {
            let bgClass = 'var(--bg-card)';
            let borderColor = 'var(--border-color)';
            if (mcFeedback !== 'none') {
              if (opt === q.word.translation) {
                bgClass = 'rgba(16, 185, 129, 0.1)';
                borderColor = 'var(--success)';
              } else if (opt === selectedOption && mcFeedback === 'wrong') {
                bgClass = 'rgba(239, 68, 68, 0.1)';
                borderColor = 'var(--danger)';
              }
            }
            return (
              <button 
                key={opt}
                className="card text-left"
                style={{ 
                  backgroundColor: bgClass, border: `2px solid ${borderColor}`, padding: '1rem', 
                  fontSize: '1.2rem', cursor: mcFeedback === 'none' ? 'pointer' : 'default',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => handleMcSelect(opt)}
                disabled={mcFeedback !== 'none'}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {mcFeedback !== 'none' && (
          <button className="btn btn-primary mt-6" style={{ width: '100%', maxWidth: '500px', padding: '1rem' }} onClick={handleNext}>
            Sıradaki
          </button>
        )}
      </>
    );
  };

  const renderTyping = (word: Word) => {
    const checkTyping = (e: React.FormEvent) => {
      e.preventDefault();
      if (typingFeedback !== 'none' || !typingInput.trim()) return;
      
      const isCorrect = typingInput.trim().toLowerCase() === word.translation.toLowerCase();
      setTypingFeedback(isCorrect ? 'correct' : 'wrong');
      handleAnswer(isCorrect);
    };

    return (
      <>
        <div className="card text-center mb-6" style={{ width: '100%', maxWidth: '500px', minHeight: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{word.word}</h2>
        </div>

        <form onSubmit={checkTyping} style={{ width: '100%', maxWidth: '500px' }}>
          <div className="input-group mb-4">
            <input 
              type="text"
              className="input-field text-center"
              style={{ fontSize: '1.5rem', padding: '1rem', 
                borderColor: typingFeedback === 'correct' ? 'var(--success)' : typingFeedback === 'wrong' ? 'var(--danger)' : 'var(--border-color)'
              }}
              value={typingInput}
              onChange={e => setTypingInput(e.target.value)}
              placeholder="Türkçe çevirisini yazın..."
              disabled={typingFeedback !== 'none'}
              autoFocus
            />
          </div>
          
          {typingFeedback === 'none' ? (
             <button type="submit" className="btn btn-primary w-full" style={{ padding: '1rem', width: '100%' }}>Kontrol Et</button>
          ) : (
            <div className="page-enter text-center card" style={{ backgroundColor: typingFeedback === 'correct' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderColor: typingFeedback === 'correct' ? 'var(--success)' : 'var(--danger)' }}>
              {typingFeedback === 'wrong' && (
                <p style={{ color: 'var(--danger)', marginBottom: '0.5rem', fontWeight: 600 }}>Doğru Cevap: {word.translation}</p>
              )}
              <button type="button" className="btn btn-primary mt-2" onClick={handleNext}>Sıradaki</button>
            </div>
          )}
        </form>
      </>
    );
  };

  const renderSpeaking = (word: Word) => {
    const handleListen = () => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Tarayıcınız konuşma tanıma özelliğini desteklemiyor. Lütfen Chrome kullanın.');
        return;
      }
      
      const recognition = new SpeechRecognition();
      if (currentLocale) recognition.lang = currentLocale;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setSpeakingFeedback('listening');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSpokenText(transcript);
        
        // Remove punctuation and lowercase for comparison
        const cleanTarget = word.word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
        const cleanTranscript = transcript.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
        
        if (cleanTranscript.includes(cleanTarget) || cleanTarget.includes(cleanTranscript)) {
          setSpeakingFeedback('correct');
          handleAnswer(true);
        } else {
          setSpeakingFeedback('wrong');
          handleAnswer(false);
        }
      };

      recognition.onerror = () => {
        setSpeakingFeedback('none');
        alert('Sesiniz anlaşılamadı, lütfen tekrar deneyin.');
      };

      recognition.onend = () => {
        if (speakingFeedback === 'listening') {
          setSpeakingFeedback('none');
        }
      };

      recognition.start();
    };

    return (
      <>
        <div className="card text-center mb-6" style={{ width: '100%', maxWidth: '500px', minHeight: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Aşağıdaki kelimeyi okuyun:</p>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {word.word}
            <button className="btn-icon" onClick={() => speak(word.word)} title="Dinle">
              <Volume2 size={24} />
            </button>
          </h2>
          <p style={{ fontSize: '1.25rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.5rem' }}>
            {word.translation}
          </p>
        </div>

        <div className="flex flex-col items-center gap-4" style={{ width: '100%', maxWidth: '500px' }}>
          {speakingFeedback === 'none' && (
            <button className="btn btn-primary w-full flex items-center justify-center gap-2" style={{ padding: '1rem' }} onClick={handleListen}>
              <Mic size={24} /> Konuşmak için Tıklayın
            </button>
          )}

          {speakingFeedback === 'listening' && (
            <div className="card text-center w-full" style={{ borderColor: 'var(--primary)', animation: 'pulse 2s infinite' }}>
              <Mic size={32} color="var(--primary)" style={{ margin: '0 auto', marginBottom: '0.5rem' }} />
              <p>Dinleniyor... Lütfen konuşun.</p>
            </div>
          )}

          {(speakingFeedback === 'correct' || speakingFeedback === 'wrong') && (
             <div className="page-enter text-center card w-full" style={{ backgroundColor: speakingFeedback === 'correct' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderColor: speakingFeedback === 'correct' ? 'var(--success)' : 'var(--danger)' }}>
               <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Duyulan: <strong>{spokenText}</strong></p>
               {speakingFeedback === 'wrong' && (
                 <p style={{ color: 'var(--danger)', marginBottom: '1rem', fontWeight: 600 }}>Yanlış telaffuz. Hedef: {word.word}</p>
               )}
               <button className="btn btn-primary" onClick={handleNext}>Sıradaki</button>
             </div>
          )}
        </div>
      </>
    );
  };

  // RENDER SETUP
  if (quizState === 'setup') {
    return (
      <div className="container page-enter flex flex-col items-center">
        <BrainCircuit size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Kendinizi Test Edin</h2>
        
        <div className="card" style={{ width: '100%', maxWidth: '600px' }}>
          {/* Language Selection */}
          <div className="input-group mb-6">
            <label className="input-label">Hangi dili test etmek istersiniz?</label>
            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              {languages.map(lang => (
                <button 
                  key={lang.id}
                  className={`btn flex-1 ${language === lang.id ? 'btn-primary' : 'btn-outline'}`} 
                  onClick={() => setLanguage(lang.id)}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>

          {/* Quiz Type Selection */}
          <div className="input-group mb-6">
            <label className="input-label">Soru Tipi</label>
            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              <button className={`btn flex-1 flex flex-col items-center justify-center gap-2 ${quizType === 'flashcard' ? 'btn-primary' : 'btn-outline'}`} style={{ height: '100px' }} onClick={() => setQuizType('flashcard')}>
                <Layers size={24} /> Flashcard
              </button>
              <button className={`btn flex-1 flex flex-col items-center justify-center gap-2 ${quizType === 'multiple_choice' ? 'btn-primary' : 'btn-outline'}`} style={{ height: '100px' }} onClick={() => setQuizType('multiple_choice')}>
                <List size={24} /> Çoktan Seçmeli
              </button>
              <button className={`btn flex-1 flex flex-col items-center justify-center gap-2 ${quizType === 'typing' ? 'btn-primary' : 'btn-outline'}`} style={{ height: '100px', minWidth: '100px' }} onClick={() => setQuizType('typing')}>
                <Keyboard size={24} /> Yazarak
              </button>
              <button className={`btn flex-1 flex flex-col items-center justify-center gap-2 ${quizType === 'speaking' ? 'btn-primary' : 'btn-outline'}`} style={{ height: '100px', minWidth: '100px' }} onClick={() => setQuizType('speaking')}>
                <Mic size={24} /> Konuşarak
              </button>
            </div>
          </div>

          {/* Word Set Selection */}
          <div className="input-group mb-4">
            <label className="input-label">Hangi Kelimeler?</label>
            <select className="input-field" value={mode} onChange={(e) => setMode(e.target.value as QuizMode)}>
              <option value="srs">Akıllı Tekrar (Bugün Çalışılması Gerekenler)</option>
              <option value="all">Karışık (Tüm Kelimeler)</option>
              <option value="today">Sadece Bugün Eklenenler</option>
              {categories.length > 0 && <option value="category">Belirli Bir Kategori</option>}
            </select>
          </div>

          {mode === 'category' && categories.length > 0 && (
            <div className="input-group mb-4 page-enter">
              <label className="input-label">Kategori Seçin</label>
              <select className="input-field" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem', padding: '1rem', fontSize: '1.1rem' }}
            onClick={startQuiz}
            disabled={loading || allWords.length === 0}
          >
            {loading ? 'Yükleniyor...' : 'Teste Başla'}
          </button>
        </div>
      </div>
    );
  }

  // RENDER PLAYING
  if (quizState === 'playing') {
    const currentQ = questions[currentIndex];
    return (
      <div className="container page-enter flex flex-col items-center">
        <div className="flex justify-between" style={{ width: '100%', maxWidth: '500px', marginBottom: '1rem', color: 'var(--text-muted)' }}>
          <span>Soru {currentIndex + 1} / {questions.length}</span>
          <span>Doğru: {score}</span>
        </div>

        {quizType === 'flashcard' && renderFlashcard(currentQ.word)}
        {quizType === 'multiple_choice' && renderMultipleChoice(currentQ)}
        {quizType === 'typing' && renderTyping(currentQ.word)}
        {quizType === 'speaking' && renderSpeaking(currentQ.word)}
      </div>
    );
  }

  // RENDER RESULTS
  return (
    <div className="container page-enter flex flex-col items-center">
      <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Quiz Tamamlandı!</h2>
      <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        {questions.length} kelimeden <span style={{ color: 'var(--success)', fontWeight: 700 }}>{score}</span> tanesini doğru bildiniz.
      </p>
      
      {xpEarned > 0 && (
        <div className="card text-center mb-6 page-enter" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'var(--warning)' }}>
          <h3 style={{ color: 'var(--warning)', fontSize: '1.5rem', fontWeight: 700 }}>+{xpEarned} XP Kazandınız!</h3>
        </div>
      )}

      <div className="card w-full mb-8" style={{ width: '100%', maxWidth: '600px' }}>
        {wrongWords.length === 0 ? (
          <div className="text-center" style={{ color: 'var(--success)', padding: '2rem 0' }}>
            <Check size={48} style={{ margin: '0 auto', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.5rem' }}>Harika İş Çıkardınız!</h3>
            <p>Tüm kelimeleri doğru bildiniz. Akıllı tekrar algoritması kelimelerinizi ileri bir tarihe erteledi.</p>
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--danger)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Tekrar Çalışmanız Gereken Kelimeler
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {wrongWords.map(w => (
                <li key={w.id} className="flex justify-between items-center" style={{ padding: '0.75rem', backgroundColor: '#0f172a', borderRadius: '0.5rem' }}>
                  <span style={{ fontWeight: 600 }}>{w.word}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{w.translation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button className="btn btn-primary" onClick={resetQuiz} style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
        <RotateCcw size={20} /> Yeni Quiz Yap
      </button>
    </div>
  );
};
