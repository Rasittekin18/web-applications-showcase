import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Globe2, BrainCircuit, Flame, Star, Trophy, Gamepad2, Target, CheckCircle2, Settings } from 'lucide-react';
import { getStats, getWords, updateStats } from '../api';
import type { UserStats, Quest } from '../types';
import { useLanguages } from '../context/LanguageContext';

export const Home = () => {
  const { languages, loading: langsLoading } = useLanguages();
  const [stats, setStats] = useState<UserStats>({ xp: 0, streak: 0, lastLoginDate: '' });
  
  // Store counts per language
  const [langCounts, setLangCounts] = useState<{ id: string, name: string, count: number }[]>([]);
  const [totalWords, setTotalWords] = useState(0);

  const generateDailyQuests = (): Quest[] => {
    return [
      { id: 'q1', title: '5 Kelime Ekle', target: 5, progress: 0, completed: false, type: 'words_added' },
      { id: 'q2', title: 'Quizde 5 Doğru Yap', target: 5, progress: 0, completed: false, type: 'quiz_score' },
      { id: 'q3', title: '1 Günlük Yazısı Yaz', target: 1, progress: 0, completed: false, type: 'journal_entries' }
    ];
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        let userStats = await getStats();
        
        // Quest Logic
        const today = new Date().toISOString().split('T')[0];
        if (userStats.lastQuestDate !== today || !userStats.quests) {
          const newQuests = generateDailyQuests();
          userStats = { ...userStats, quests: newQuests, lastQuestDate: today };
          await updateStats(userStats);
        }

        setStats(userStats);

        if (languages.length > 0) {
          const counts = await Promise.all(
            languages.map(async (lang) => {
              const words = await getWords(lang.id);
              return { id: lang.id, name: lang.name, count: words.length };
            })
          );
          setLangCounts(counts);
          setTotalWords(counts.reduce((sum, item) => sum + item.count, 0));
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
      }
    };
    if (!langsLoading) {
      loadDashboardData();
    }
  }, [languages, langsLoading]);

  return (
    <div className="container flex flex-col items-center page-enter" style={{ minHeight: '60vh' }}>
      
      {/* Dashboard Top Bar with Settings */}
      <div className="w-full flex justify-between items-center mb-8" style={{ width: '100%', maxWidth: '800px' }}>
        <div className="flex items-center gap-4" style={{ backgroundColor: 'var(--bg-card)', padding: '1rem 1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', flex: 1 }}>
          <div className="flex items-center gap-2" style={{ color: 'var(--success)', fontWeight: 600, fontSize: '1.25rem' }}>
            <Star fill="currentColor" size={24} /> {stats.xp} XP
          </div>
          <div className="flex items-center gap-2" style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '1.25rem' }}>
            <Flame fill="currentColor" size={24} /> {stats.streak} Gün
          </div>
          <div className="flex flex-col items-end ml-auto">
            <div className="flex items-center gap-2" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '1.1rem' }}>
              <Trophy size={20} /> Toplam {totalWords} Kelime
            </div>
            {langCounts.length > 0 && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                ({langCounts.map(l => `${l.count} ${l.name}`).join(', ')})
              </div>
            )}
          </div>
        </div>
        
        <Link 
          to="/settings" 
          className="btn btn-outline flex items-center justify-center ml-4" 
          style={{ width: '56px', height: '56px', borderRadius: '1rem', border: '1px solid var(--border-color)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}
          title="Ayarlar & Veri Yönetimi"
        >
          <Settings size={24} />
        </Link>
      </div>

      <div className="text-center mb-8">
        <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem' }}>
          LearnLang
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
          Kelime dağarcığınızı geliştirin, esnek ve hızlı bir şekilde pratik yapın.
        </p>
      </div>

      {/* Daily Quests Section */}
      {stats.quests && stats.quests.length > 0 && (
        <div className="w-full mb-8" style={{ maxWidth: '800px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={20} color="var(--primary)" /> Günlük Görevler
          </h2>
          <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
            {stats.quests.map(quest => (
              <div key={quest.id} className="card flex-1" style={{ minWidth: '200px', backgroundColor: quest.completed ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-card)', borderColor: quest.completed ? 'var(--success)' : 'var(--border-color)' }}>
                <div className="flex justify-between items-start mb-2">
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: quest.completed ? 'var(--success)' : 'var(--text-main)' }}>{quest.title}</h3>
                  {quest.completed && <CheckCircle2 size={18} color="var(--success)" />}
                </div>
                <div style={{ width: '100%', backgroundColor: 'var(--border-color)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%`, backgroundColor: quest.completed ? 'var(--success)' : 'var(--primary)', height: '100%', transition: 'width 0.3s ease' }}></div>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'right' }}>
                  {quest.progress} / {quest.target}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex gap-6 mt-4" style={{ width: '100%', maxWidth: '800px', justifyContent: 'center', flexWrap: 'wrap' }}>
        
        {/* Dynamic Language Cards */}
        {languages.map(lang => (
          <Link 
            key={lang.id}
            to={`/lang/${lang.id}`} 
            className="card text-center" 
            style={{ flex: '1 1 300px', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
          >
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: `${lang.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Globe2 size={32} color={lang.color} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{lang.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{lang.name} kelime listeni yönet</p>
          </Link>
        ))}

        {/* Add Language Card */}
        <Link 
          to="/settings" 
          className="card text-center" 
          style={{ flex: '1 1 300px', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', borderStyle: 'dashed', borderWidth: '2px', borderColor: 'var(--primary)' }}
        >
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '2rem', color: 'var(--primary)', fontWeight: 'bold' }}>+</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Yeni Dil Ekle</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>İspanyolca, Fransızca...</p>
        </Link>
        
        {/* Fixed Modules */}
        <Link 
          to="/journal" 
          className="card text-center" 
          style={{ flex: '1 1 300px', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
        >
           <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgb(239 68 68 / 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={32} color="var(--danger)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Günlük</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Kendini özgürce ifade et</p>
        </Link>

        <Link 
          to="/quiz" 
          className="card text-center" 
          style={{ flex: '1 1 300px', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
        >
           <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgb(168 85 247 / 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BrainCircuit size={32} color="#a855f7" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Quiz</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Öğrendiklerini test et</p>
        </Link>

        <Link 
          to="/games" 
          className="card text-center" 
          style={{ flex: '1 1 300px', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
        >
           <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(234, 179, 8, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Gamepad2 size={32} color="#eab308" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Oyunlar</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Eğlenerek öğren</p>
        </Link>

        <Link 
          to="/stories" 
          className="card text-center" 
          style={{ flex: '1 1 300px', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
        >
           <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(14, 165, 233, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={32} color="#0ea5e9" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Okuma</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Metinler üzerinde çalışın</p>
        </Link>
      </div>
    </div>
  );
};
