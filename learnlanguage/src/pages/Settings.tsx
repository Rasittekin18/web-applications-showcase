import { useState, useEffect } from 'react';
import { getWords, addWord, addLanguage, factoryReset } from '../api';
import { Download, Upload, Settings as SettingsIcon, AlertCircle, CheckCircle2, Plus, Loader2, AlertTriangle } from 'lucide-react';
import { useLanguages } from '../context/LanguageContext';

export const Settings = () => {
  const { languages, refreshLanguages } = useLanguages();
  const [status, setStatus] = useState<{ type: 'error' | 'success' | 'info', message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [importLang, setImportLang] = useState<string>('');

  // New language form state
  const [newLangName, setNewLangName] = useState('');
  const [newLangId, setNewLangId] = useState('');
  const [newLangColor, setNewLangColor] = useState('#3b82f6');
  const [newLangLocale, setNewLangLocale] = useState('');

  // AI Settings
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');

  useEffect(() => {
    if (languages.length > 0 && !importLang) {
      setImportLang(languages[0].id);
    }
  }, [languages]);

  const exportData = async () => {
    try {
      setLoading(true);
      const dataObj: Record<string, any> = {};
      
      for (const lang of languages) {
        const words = await getWords(lang.id);
        dataObj[lang.id] = words;
      }
      
      const dataStr = JSON.stringify(dataObj, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `learnlang_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setStatus({ type: 'success', message: 'Yedekleme başarıyla indirildi!' });
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Dışa aktarma sırasında bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const importCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus({ type: 'info', message: 'Kelimeler içe aktarılıyor, lütfen bekleyin...' });
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        
        let successCount = 0;
        
        let startIndex = 0;
        if (lines[0].toLowerCase().includes('word') || lines[0].toLowerCase().includes('kelime')) {
          startIndex = 1;
        }

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          
          if (parts.length >= 2) {
            const word = parts[0].replace(/^"|"$/g, '').trim();
            const translation = parts[1].replace(/^"|"$/g, '').trim();
            const category = parts.length > 2 ? parts[2].replace(/^"|"$/g, '').trim() : '';
            const sentence = parts.length > 3 ? parts[3].replace(/^"|"$/g, '').trim() : '';
            
            if (word && translation) {
              await addWord(importLang, {
                word,
                translation,
                category,
                sentence,
                srsStage: 0
              });
              successCount++;
            }
          }
        }
        
        const langObj = languages.find(l => l.id === importLang);
        setStatus({ type: 'success', message: `Başarılı! ${successCount} adet kelime (${langObj?.name || importLang}) veritabanına eklendi.` });
      } catch (error) {
        console.error(error);
        setStatus({ type: 'error', message: 'İçe aktarma sırasında hata oluştu. CSV formatını kontrol edin.' });
      } finally {
        setLoading(false);
        event.target.value = '';
      }
    };
    reader.onerror = () => {
      setStatus({ type: 'error', message: 'Dosya okunamadı.' });
      setLoading(false);
    };
    
    reader.readAsText(file);
  };

  const handleAddLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLangName || !newLangId || !newLangColor) return;
    
    try {
      setLoading(true);
      await addLanguage({
        id: newLangId.toLowerCase().replace(/[^a-z0-9]/g, ''),
        name: newLangName,
        color: newLangColor,
        locale: newLangLocale || undefined
      });
      await refreshLanguages();
      setStatus({ type: 'success', message: `${newLangName} dili başarıyla eklendi!` });
      setNewLangName('');
      setNewLangId('');
      setNewLangColor('#3b82f6');
      setNewLangLocale('');
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Dil eklenirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-enter flex flex-col items-center">
      <SettingsIcon size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
      <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Ayarlar & Veri Yönetimi</h2>

      {status && (
        <div className={`card w-full mb-6 flex items-center gap-3`} style={{ 
          maxWidth: '600px', 
          backgroundColor: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-card)',
          borderColor: status.type === 'error' ? 'var(--danger)' : status.type === 'success' ? 'var(--success)' : 'var(--border-color)'
        }}>
          {status.type === 'error' ? <AlertCircle color="var(--danger)" /> : <CheckCircle2 color="var(--success)" />}
          <p style={{ color: status.type === 'error' ? 'var(--danger)' : status.type === 'success' ? 'var(--success)' : 'var(--text-main)', fontWeight: 500 }}>
            {status.message}
          </p>
        </div>
      )}

      {/* NEW: Add Language Form */}
      <div className="card w-full mb-6" style={{ maxWidth: '600px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          Yeni Dil Ekle
        </h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Sisteme Arapça, İspanyolca gibi yeni bir dil ekleyin.
        </p>
        
        <form onSubmit={handleAddLanguage} className="flex flex-col gap-4">
          <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
            <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
              <label className="input-label">Dil Adı (Örn: Arapça)</label>
              <input 
                type="text" 
                className="input-field" 
                value={newLangName} 
                onChange={e => {
                  setNewLangName(e.target.value);
                  if (!newLangId) {
                    setNewLangId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                  }
                }} 
                required 
              />
            </div>
            <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
              <label className="input-label">Sistem ID (Örn: arabic)</label>
              <input 
                type="text" 
                className="input-field" 
                value={newLangId} 
                onChange={e => setNewLangId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))} 
                required 
              />
            </div>
          </div>
          
          <div className="flex gap-4 mb-4" style={{ flexWrap: 'wrap' }}>
            <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
              <label className="input-label">Bölge Kodu (İsteğe Bağlı - Örn: ar-SA)</label>
              <input 
                type="text" 
                className="input-field" 
                value={newLangLocale} 
                onChange={e => setNewLangLocale(e.target.value)} 
                placeholder="Sesli okuma için"
              />
            </div>
            
            <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
              <label className="input-label">Tema Rengi</label>
              <div className="flex items-center gap-4 mt-2">
                <input 
                  type="color" 
                  value={newLangColor} 
                  onChange={e => setNewLangColor(e.target.value)} 
                  style={{ width: '50px', height: '40px', padding: '0', border: 'none', cursor: 'pointer', borderRadius: '4px', background: 'none' }}
                />
                <span style={{ color: newLangColor, fontWeight: 600 }}>Örnek Renk</span>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary flex items-center justify-center gap-2 mt-2" disabled={loading}>
            <Plus size={20} /> Dili Sisteme Ekle
          </button>
        </form>
      </div>

      {/* AI Settings */}
      <div className="card w-full mb-6" style={{ maxWidth: '600px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          Yapay Zeka (AI) Ayarları
        </h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Kelime eklerken otomatik örnek cümle üretmek için Google Gemini API anahtarınızı girin.
        </p>
        
        <div className="input-group mb-4">
          <label className="input-label">Gemini API Key</label>
          <input 
            type="password" 
            className="input-field" 
            value={apiKey} 
            onChange={e => setApiKey(e.target.value)} 
            placeholder="Enter your Gemini API Key..."
          />
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            localStorage.setItem('gemini_api_key', apiKey);
            setStatus({ type: 'success', message: 'API anahtarı kaydedildi!' });
          }}
        >
          Anahtarı Kaydet
        </button>
      </div>

      <div className="card w-full mb-6" style={{ maxWidth: '600px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          Yedekleme (Dışa Aktarma)
        </h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Tüm kelimelerinizi güvenli bir JSON dosyası olarak bilgisayarınıza indirebilirsiniz.
        </p>
        <button className="btn btn-outline flex items-center justify-center gap-2 w-full" onClick={exportData} disabled={loading}>
          <Download size={20} /> Yedekle (JSON İndir)
        </button>
      </div>

      <div className="card w-full mb-6" style={{ maxWidth: '600px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          Toplu Kelime Yükleme (CSV İçe Aktar)
        </h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.95rem' }}>
          Excel veya Not Defteri ile hazırladığınız CSV dosyasını yükleyebilirsiniz. <br/>
          <strong style={{ color: 'var(--text-main)' }}>Format:</strong> <code style={{ backgroundColor: '#0f172a', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>Kelime,Çevirisi,Kategori,Örnek Cümle</code>
        </p>
        
        <div className="input-group mb-4">
          <label className="input-label">Hangi dile eklensin?</label>
          <select className="input-field" value={importLang} onChange={e => setImportLang(e.target.value)}>
            {languages.map(lang => (
              <option key={lang.id} value={lang.id}>{lang.name}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <input 
            type="file" 
            accept=".csv" 
            onChange={importCSV}
            disabled={loading}
            style={{ 
              opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: loading ? 'default' : 'pointer' 
            }}
          />
          <div className="btn btn-primary flex items-center justify-center gap-2 w-full" style={{ pointerEvents: 'none', opacity: loading ? 0.7 : 1 }}>
            <Upload size={20} /> {loading ? 'Yükleniyor...' : 'CSV Dosyası Seç ve Yükle'}
          </div>
        </div>
      </div>

      {/* Danger Zone (Reset) */}
      <div className="card w-full mb-6" style={{ maxWidth: '600px', border: '1px solid var(--danger)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'var(--danger)' }}>
          Tehlikeli Bölge
        </h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Sistemdeki tüm kelimeleri, okuma parçalarını, görevleri ve dilleri siler. Sistemi ilk kurulduğu varsayılan ayarlara (Sadece İngilizce ve Almanca boş olarak) döndürür. Bu işlem geri alınamaz!
        </p>
        <button 
          className="btn flex items-center justify-center gap-2" 
          style={{ width: '100%', backgroundColor: 'var(--danger)', color: 'white' }}
          disabled={resetting}
          onClick={async () => {
            if (confirm('TÜM VERİLERİNİZ SİLİNECEK! Bu işlemi onaylıyor musunuz?')) {
              if (confirm('Emin misiniz? Geri dönüşü yoktur!')) {
                setResetting(true);
                try {
                  await factoryReset();
                  setStatus({ type: 'success', message: 'Sistem başarıyla sıfırlandı!' });
                  await refreshLanguages();
                  setTimeout(() => window.location.reload(), 1500);
                } catch (e) {
                  setStatus({ type: 'error', message: 'Sıfırlama sırasında hata oluştu.' });
                } finally {
                  setResetting(false);
                }
              }
            }
          }}
        >
          {resetting ? <Loader2 className="spin" size={20} /> : <AlertTriangle size={20} />}
          {resetting ? 'Sıfırlanıyor...' : 'Tüm Sistemi Sıfırla (Hard Reset)'}
        </button>
      </div>
    </div>
  );
};
