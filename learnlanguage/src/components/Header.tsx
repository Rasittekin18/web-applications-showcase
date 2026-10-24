import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, LogOut } from 'lucide-react';
import { useLanguages } from '../context/LanguageContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export const Header = () => {
  const location = useLocation();
  const { languages } = useLanguages();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <header style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
      <div className="container flex items-center justify-between gap-4">
        <Link 
          to="/" 
          className="flex items-center gap-2 shrink-0" 
          style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: 700 }}
        >
          <BookOpen size={28} color="var(--primary)" />
          <span>Learn<span style={{ color: 'var(--primary)' }}>Lang</span></span>
        </Link>

        {location.pathname !== '/' && (
          <nav className="flex gap-4 overflow-x-auto pb-2" style={{ flexWrap: 'nowrap' }}>
            {languages.map(lang => (
              <Link 
                key={lang.id}
                to={`/lang/${lang.id}`} 
                className={`btn shrink-0 ${location.pathname === `/lang/${lang.id}` ? 'btn-primary' : 'btn-outline'}`}
                style={{ textDecoration: 'none' }}
              >
                {lang.name}
              </Link>
            ))}
            <Link 
              to="/journal" 
              className={`btn shrink-0 ${location.pathname === '/journal' ? 'btn-primary' : 'btn-outline'}`}
              style={{ textDecoration: 'none' }}
            >
              Günlük
            </Link>
            <Link 
              to="/quiz" 
              className={`btn shrink-0 ${location.pathname === '/quiz' ? 'btn-primary' : 'btn-outline'}`}
              style={{ textDecoration: 'none' }}
            >
              Quiz
            </Link>
            <Link 
              to="/games" 
              className={`btn shrink-0 ${location.pathname === '/games' ? 'btn-primary' : 'btn-outline'}`}
              style={{ textDecoration: 'none' }}
            >
              Oyunlar
            </Link>
            <Link 
              to="/stories" 
              className={`btn shrink-0 ${location.pathname === '/stories' ? 'btn-primary' : 'btn-outline'}`}
              style={{ textDecoration: 'none' }}
            >
              Okuma
            </Link>
          </nav>
        )}

        <button 
          onClick={handleLogout} 
          className="shrink-0 p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors ml-auto" 
          title="Çıkış Yap"
        >
          <LogOut size={24} />
        </button>
      </div>
    </header>
  );
};
