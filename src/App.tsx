import { useState, useEffect } from 'react';
import netlifyIdentity from 'netlify-identity-widget';

interface Author {
  id: string;
  name: string;
  birthDate: string;
  deathDate: string;
  biography: string;
  imageUrl: string;
}

function App() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'gallery' | 'admin' | 'detail'>('gallery');
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  
  // Форма күйлері
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', birthDate: '', deathDate: '', biography: '', imageUrl: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    netlifyIdentity.init();
    setUser(netlifyIdentity.currentUser());
    fetchAuthors();
    netlifyIdentity.on('login', (u) => { setUser(u); netlifyIdentity.close(); });
    netlifyIdentity.on('logout', () => { setUser(null); setView('gallery'); });
  }, []);

  const notify = (type: 'success' | 'error', msg: string) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 3000);
  };

  const fetchAuthors = async () => {
    try {
      const res = await fetch('/.netlify/functions/api');
      const data = await res.json();
      if (Array.isArray(data)) setAuthors(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, imageUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const saveAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Жаңа автор болса ID-ді мүлдем жібермейміз
    const payload = isEditing ? formData : {
      name: formData.name,
      birthDate: formData.birthDate,
      deathDate: formData.deathDate,
      biography: formData.biography,
      imageUrl: formData.imageUrl
    };

    try {
      const res = await fetch('/.netlify/functions/api', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Сервер қатесі');
      }

      notify('success', isEditing ? 'Жаңартылды' : 'Қосылды');
      closeForm();
      fetchAuthors();
    } catch (e: any) {
      notify('error', e.message);
      console.error("Сақтау қатесі:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (author: Author) => {
    setFormData(author);
    setIsEditing(true);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setFormData({ id: '', name: '', birthDate: '', deathDate: '', biography: '', imageUrl: '' });
  };

  const deleteAuthor = async (id: string) => {
    if (!confirm('Өшіруді растайсыз ба?')) return;
    await fetch('/.netlify/functions/api', { method: 'DELETE', body: JSON.stringify({ id }) });
    notify('success', 'Жойылды');
    fetchAuthors();
  };

  if (loading) return <div className="h-screen flex items-center justify-center animate-pulse text-slate-400">ЖҮКТЕЛУДЕ...</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 font-sans">
      {status && (
        <div className={`fixed top-6 right-6 z-[100] px-6 py-3 rounded-2xl shadow-2xl text-white animate-in slide-in-from-top duration-300 ${status.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {status.msg}
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white/70 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('gallery')}>
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl rotate-3 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200">A</div>
            <h1 className="text-xl font-black tracking-tighter">AUTHORS.KZ</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {user && (
              <button 
                onClick={() => setView(view === 'admin' ? 'gallery' : 'admin')}
                className={`text-xs font-black uppercase tracking-widest px-6 py-2 rounded-full transition-all ${view === 'admin' ? 'bg-slate-900 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
              >
                {view === 'admin' ? 'Галерея' : 'Басқару'}
              </button>
            )}
            <button onClick={() => user ? netlifyIdentity.logout() : netlifyIdentity.open()} className="text-slate-400 hover:text-indigo-600 transition">
              {user ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> : 'Кіру'}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-10">
        
        {/* VIEW: ADMIN PANEL */}
        {view === 'admin' && user && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-4xl font-black mb-2">Басқару панелі</h2>
                <p className="text-slate-400">Авторлар тізімін өңдеу және жою</p>
              </div>
              <button onClick={() => { setIsEditing(false); setShowForm(true); }} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:scale-105 transition">+ Жаңа автор</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {authors.map(author => (
                <div key={author.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 group">
                  <img src={author.imageUrl} className="w-20 h-20 rounded-2xl object-cover" />
                  <div className="flex-grow">
                    <h3 className="font-bold text-slate-800 leading-tight mb-1">{author.name}</h3>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(author)} className="text-[10px] font-bold uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg hover:bg-indigo-600 hover:text-white transition">Өңдеу</button>
                      <button onClick={() => deleteAuthor(author.id)} className="text-[10px] font-bold uppercase text-rose-600 bg-rose-50 px-3 py-1 rounded-lg hover:bg-rose-600 hover:text-white transition">Жою</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: GALLERY */}
        {view === 'gallery' && (
          <div className="animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {authors.map((author) => (
                <div 
                  key={author.id} 
                  onClick={() => { setSelectedAuthor(author); setView('detail'); }}
                  className="group cursor-pointer"
                >
                  <div className="relative h-[30rem] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200 transition-transform duration-500 group-hover:-translate-y-2">
                    <img src={author.imageUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-10 w-full">
                      <p className="text-indigo-400 font-black text-xs tracking-widest uppercase mb-2">{author.birthDate} — {author.deathDate}</p>
                      <h3 className="text-3xl font-bold text-white leading-tight">{author.name}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: DETAIL PAGE */}
        {view === 'detail' && selectedAuthor && (
          <div className="max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-500">
            <button onClick={() => setView('gallery')} className="mb-10 flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              АРТҚА ҚАЙТУ
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="relative h-[40rem] rounded-[3rem] overflow-hidden shadow-3xl">
                <img src={selectedAuthor.imageUrl} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-indigo-600 font-black tracking-[0.2em] mb-4 uppercase">{selectedAuthor.birthDate} — {selectedAuthor.deathDate}</p>
                <h2 className="text-6xl font-black text-slate-900 mb-8 leading-none">{selectedAuthor.name}</h2>
                <div className="w-20 h-2 bg-indigo-600 mb-10 rounded-full" />
                <p className="text-xl text-slate-600 leading-relaxed font-serif italic">
                  {selectedAuthor.biography}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Slide-over Form Overlay (Edit / Add) */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-md" onClick={closeForm} />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl p-12 overflow-y-auto animate-in slide-in-from-right duration-500">
            <h2 className="text-3xl font-black mb-10">{isEditing ? 'Авторды өңдеу' : 'Жаңа автор'}</h2>
            <form onSubmit={saveAuthor} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Аты-жөні</label>
                <input required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 focus:ring-2 ring-indigo-500 transition shadow-inner" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Туған жылы</label>
                  <input className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 focus:ring-2 ring-indigo-500 transition shadow-inner" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Қайтыс болған жылы</label>
                  <input className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 focus:ring-2 ring-indigo-500 transition shadow-inner" value={formData.deathDate} onChange={e => setFormData({...formData, deathDate: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Сурет</label>
                <div className="relative w-full h-48 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden transition hover:border-indigo-400">
                  {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" /> : <span className="text-slate-300 font-bold">Файлды таңдаңыз</span>}
                  <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Өмірбаяны</label>
                <textarea required rows={8} className="w-full bg-slate-50 border-none rounded-3xl px-6 py-5 focus:ring-2 ring-indigo-500 transition shadow-inner resize-none" value={formData.biography} onChange={e => setFormData({...formData, biography: e.target.value})} />
              </div>
              <button 
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 disabled:bg-slate-200 transition flex items-center justify-center gap-3"
              >
                {isSubmitting ? <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" /> : (isEditing ? 'Өзгерісті сақтау' : 'Базаға қосу')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;