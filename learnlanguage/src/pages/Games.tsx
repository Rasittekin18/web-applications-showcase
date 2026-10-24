import { useState, useEffect } from 'react';
import { Gamepad2, Brain, Type, Check, X } from 'lucide-react';
import { useLanguages } from '../context/LanguageContext';
import { getWords, updateStats, getStats } from '../api';
import type { Word } from '../types';

type GameMode = 'none' | 'match' | 'hangman';

export const Games = () => {
  const { languages } = useLanguages();
  const [language, setLanguage] = useState<string>('');
  const [mode, setMode] = useState<GameMode>('none');
  const [, setLoading] = useState(false);
  const [words, setWords] = useState<Word[]>([]);

  // Match Game State
  const [matchForeign, setMatchForeign] = useState<Word[]>([]);
  const [matchNative, setMatchNative] = useState<Word[]>([]);
  const [selectedForeign, setSelectedForeign] = useState<Word | null>(null);
  const [selectedNative, setSelectedNative] = useState<Word | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [matchScore, setMatchScore] = useState(0);
  const [matchStartTime, setMatchStartTime] = useState<number>(0);

  // Hangman State
  const [hangmanWord, setHangmanWord] = useState<Word | null>(null);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [lives, setLives] = useState(6);
  const [hangmanScore, setHangmanScore] = useState(0);

  useEffect(() => {
    if (languages.length > 0 && !language) {
      setLanguage(languages[0].id);
    }
  }, [languages]);

  const loadGameData = async (game: GameMode) => {
    try {
      setLoading(true);
      const data = await getWords(language);
      if (data.length < 5) {
        alert('Bu oyunu oynamak için seçili dilde en az 5 kelimeniz olmalıdır.');
        return;
      }
      setWords(data);
      
      if (game === 'match') {
        setupMatchGame(data);
      } else if (game === 'hangman') {
        setupHangmanGame(data);
      }
      
      setMode(game);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addXp = async (amount: number) => {
    try {
      const stats = await getStats();
      await updateStats({ ...stats, xp: stats.xp + amount });
    } catch (e) {
      console.error(e);
    }
  };

  // --- MATCH GAME LOGIC ---
  const setupMatchGame = (allWords: Word[]) => {
    const shuffled = [...allWords].sort(() => 0.5 - Math.random()).slice(0, 8);
    setMatchForeign([...shuffled].sort(() => 0.5 - Math.random()));
    setMatchNative([...shuffled].sort(() => 0.5 - Math.random()));
    setMatchedIds(new Set());
    setSelectedForeign(null);
    setSelectedNative(null);
    setMatchScore(0);
    setMatchStartTime(Date.now());
  };

  const handleMatchSelect = (word: Word, type: 'foreign' | 'native') => {
    if (matchedIds.has(word.id)) return;

    if (type === 'foreign') {
      if (selectedForeign?.id === word.id) setSelectedForeign(null);
      else setSelectedForeign(word);
    } else {
      if (selectedNative?.id === word.id) setSelectedNative(null);
      else setSelectedNative(word);
    }
  };

  useEffect(() => {
    if (selectedForeign && selectedNative) {
      if (selectedForeign.id === selectedNative.id) {
        // Match!
        const newMatched = new Set(matchedIds);
        newMatched.add(selectedForeign.id);
        setMatchedIds(newMatched);
        
        if (newMatched.size === matchForeign.length) {
          // Win!
          const timeTaken = (Date.now() - matchStartTime) / 1000;
          let xp = 50;
          if (timeTaken < 30) xp = 100;
          setMatchScore(xp);
          addXp(xp);
        }
      } else {
        // Penalty for wrong match could be added here
      }
      // Reset selection after a short delay
      setTimeout(() => {
        setSelectedForeign(null);
        setSelectedNative(null);
      }, 500);
    }
  }, [selectedForeign, selectedNative]);

  // --- HANGMAN LOGIC ---
  const setupHangmanGame = (allWords: Word[]) => {
    const random = allWords[Math.floor(Math.random() * allWords.length)];
    setHangmanWord(random);
    setGuessedLetters(new Set());
    setLives(6);
    setHangmanScore(0);
  };

  const handleGuess = (letter: string) => {
    if (!hangmanWord || lives <= 0 || isHangmanWon) return;
    
    const lowerLetter = letter.toLowerCase();
    if (guessedLetters.has(lowerLetter)) return;

    const newGuessed = new Set(guessedLetters);
    newGuessed.add(lowerLetter);
    setGuessedLetters(newGuessed);

    const targetWord = hangmanWord.word.toLowerCase();
    if (!targetWord.includes(lowerLetter)) {
      setLives(l => l - 1);
    }
  };

  // Listen to keyboard
  useEffect(() => {
    if (mode === 'hangman' && lives > 0 && !isHangmanWon) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key.match(/^[a-zäöüßğüşöç]$/i)) {
          handleGuess(e.key);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [mode, lives, guessedLetters, hangmanWord]);

  const isHangmanWon = hangmanWord ? hangmanWord.word.toLowerCase().split('').every(char => 
    !char.match(/[a-zäöüßğüşöç]/i) || guessedLetters.has(char)
  ) : false;

  useEffect(() => {
    if (isHangmanWon && hangmanScore === 0) {
      const xp = lives * 5 + 10;
      setHangmanScore(xp);
      addXp(xp);
    }
  }, [isHangmanWon]);


  // --- RENDERS ---

  if (mode === 'none') {
    return (
      <div className="container page-enter flex flex-col items-center">
        <Gamepad2 size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Oyunlar</h2>
        
        <div className="card w-full mb-6 text-center" style={{ maxWidth: '600px' }}>
          <div className="input-group mb-4 text-left">
            <label className="input-label">Hangi dil ile oynamak istersiniz?</label>
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

          <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
            <div 
              className="card flex-1 text-center" 
              style={{ cursor: 'pointer', border: '2px solid var(--border-color)', transition: 'border-color 0.2s' }}
              onClick={() => loadGameData('match')}
            >
              <Brain size={32} color="var(--success)" style={{ margin: '0 auto', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Eşleştirme</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Kelimeleri anlamlarıyla eşleştirin.</p>
            </div>

            <div 
              className="card flex-1 text-center" 
              style={{ cursor: 'pointer', border: '2px solid var(--border-color)', transition: 'border-color 0.2s' }}
              onClick={() => loadGameData('hangman')}
            >
              <Type size={32} color="var(--warning)" style={{ margin: '0 auto', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Adam Asmaca</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Harfleri tahmin ederek kelimeyi bulun.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'match') {
    return (
      <div className="container page-enter flex flex-col items-center">
        <div className="flex justify-between w-full mb-6" style={{ maxWidth: '800px' }}>
          <button className="btn btn-outline" onClick={() => setMode('none')}>&larr; Geri</button>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Eşleştirme Oyunu</h2>
          <div></div>
        </div>

        {matchedIds.size === matchForeign.length && matchForeign.length > 0 ? (
          <div className="card text-center page-enter" style={{ maxWidth: '400px', width: '100%' }}>
            <Check size={48} color="var(--success)" style={{ margin: '0 auto', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Tebrikler!</h3>
            <p style={{ color: 'var(--success)', fontWeight: 600, fontSize: '1.2rem', marginBottom: '1.5rem' }}>+{matchScore} XP Kazandınız</p>
            <button className="btn btn-primary w-full" onClick={() => setupMatchGame(words)}>Tekrar Oyna</button>
          </div>
        ) : (
          <div className="flex gap-4 w-full" style={{ maxWidth: '800px' }}>
            {/* Foreign Column */}
            <div className="flex flex-col gap-2 flex-1">
              {matchForeign.map(word => {
                const isMatched = matchedIds.has(word.id);
                const isSelected = selectedForeign?.id === word.id;
                let bg = 'var(--bg-card)';
                if (isMatched) bg = 'rgba(16, 185, 129, 0.1)';
                else if (isSelected) bg = 'var(--bg-hover)';
                
                return (
                  <button
                    key={`f-${word.id}`}
                    className="card text-center"
                    style={{ 
                      padding: '1rem', backgroundColor: bg, opacity: isMatched ? 0.5 : 1,
                      border: isSelected ? '2px solid var(--primary)' : isMatched ? '2px solid var(--success)' : '2px solid var(--border-color)',
                      cursor: isMatched ? 'default' : 'pointer'
                    }}
                    onClick={() => handleMatchSelect(word, 'foreign')}
                    disabled={isMatched}
                  >
                    <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{word.word}</span>
                  </button>
                )
              })}
            </div>

            {/* Native Column */}
            <div className="flex flex-col gap-2 flex-1">
              {matchNative.map(word => {
                const isMatched = matchedIds.has(word.id);
                const isSelected = selectedNative?.id === word.id;
                let bg = 'var(--bg-card)';
                if (isMatched) bg = 'rgba(16, 185, 129, 0.1)';
                else if (isSelected) bg = 'var(--bg-hover)';
                
                return (
                  <button
                    key={`n-${word.id}`}
                    className="card text-center"
                    style={{ 
                      padding: '1rem', backgroundColor: bg, opacity: isMatched ? 0.5 : 1,
                      border: isSelected ? '2px solid var(--primary)' : isMatched ? '2px solid var(--success)' : '2px solid var(--border-color)',
                      cursor: isMatched ? 'default' : 'pointer'
                    }}
                    onClick={() => handleMatchSelect(word, 'native')}
                    disabled={isMatched}
                  >
                    <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{word.translation}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (mode === 'hangman' && hangmanWord) {
    const letters = hangmanWord.word.split('');
    const alphabet = 'abcdefghijklmnopqrstuvwxyzäöüßğüşöç'.split('');
    
    return (
      <div className="container page-enter flex flex-col items-center">
        <div className="flex justify-between w-full mb-6" style={{ maxWidth: '600px' }}>
          <button className="btn btn-outline" onClick={() => setMode('none')}>&larr; Geri</button>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Adam Asmaca</h2>
          <div style={{ color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             Kalan Can: {lives}
          </div>
        </div>

        <div className="card text-center mb-8" style={{ width: '100%', maxWidth: '600px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>İpucu: {hangmanWord.translation}</p>
          
          <div className="flex justify-center gap-2 mb-6" style={{ flexWrap: 'wrap' }}>
            {letters.map((char, i) => {
              const isAlpha = char.match(/[a-zäöüßğüşöç]/i);
              const isGuessed = guessedLetters.has(char.toLowerCase());
              const displayChar = !isAlpha ? char : (isGuessed || lives <= 0 ? char : '_');
              
              return (
                <span key={i} style={{ 
                  fontSize: '2rem', fontWeight: 800, minWidth: '40px', 
                  borderBottom: isAlpha ? '3px solid var(--text-main)' : 'none',
                  color: !isGuessed && lives <= 0 ? 'var(--danger)' : 'var(--text-main)'
                }}>
                  {displayChar}
                </span>
              );
            })}
          </div>

          {(isHangmanWon || lives <= 0) ? (
            <div className="page-enter">
              {isHangmanWon ? (
                <div style={{ color: 'var(--success)' }}>
                  <Check size={48} style={{ margin: '0 auto', marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Tebrikler! +{hangmanScore} XP</h3>
                </div>
              ) : (
                <div style={{ color: 'var(--danger)' }}>
                  <X size={48} style={{ margin: '0 auto', marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Bilemediniz!</h3>
                </div>
              )}
              <button className="btn btn-primary mt-4" onClick={() => setupHangmanGame(words)}>Tekrar Oyna</button>
            </div>
          ) : (
            <div className="flex justify-center gap-2" style={{ flexWrap: 'wrap', maxWidth: '500px', margin: '0 auto' }}>
              {alphabet.map(letter => {
                const isGuessed = guessedLetters.has(letter);
                const isCorrect = isGuessed && hangmanWord.word.toLowerCase().includes(letter);
                const isWrong = isGuessed && !isCorrect;
                
                let bg = 'var(--bg-card)';
                let color = 'var(--text-main)';
                let border = '1px solid var(--border-color)';
                
                if (isCorrect) {
                  bg = 'var(--success)'; color = 'white'; border = '1px solid var(--success)';
                } else if (isWrong) {
                  bg = 'var(--danger)'; color = 'white'; border = '1px solid var(--danger)';
                }

                return (
                  <button 
                    key={letter}
                    onClick={() => handleGuess(letter)}
                    disabled={isGuessed}
                    style={{
                      width: '36px', height: '36px', borderRadius: '4px',
                      backgroundColor: bg, color, border, fontWeight: 600,
                      cursor: isGuessed ? 'default' : 'pointer'
                    }}
                  >
                    {letter.toUpperCase()}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};
