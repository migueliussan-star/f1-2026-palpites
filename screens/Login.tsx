
import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, ShieldCheck, UserCircle2, ChevronRight, ExternalLink, Settings } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, db, ref, set, get } from '../firebase';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');
  const [showConfigGuide, setShowConfigGuide] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      // O App.tsx detectará a mudança de estado e redirecionará
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
        setError('Google Auth não ativado no Firebase.');
        setShowConfigGuide(true);
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Você fechou a janela de login.');
      } else {
        setError('Erro ao conectar com Google. Tente o Modo Convidado.');
      }
      setLoading(false);
    }
  };

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    
    setLoading(true);
    const guestId = `guest_${guestName.toLowerCase().replace(/\s/g, '_')}_${Math.floor(Math.random() * 1000)}`;
    
    try {
      const allUsersSnap = await get(ref(db, 'users'));
      const currentTotal = allUsersSnap.exists() ? Object.keys(allUsersSnap.val()).length : 0;

      const userRef = ref(db, `users/${guestId}`);
      const userData = {
        id: guestId,
        name: guestName.trim(),
        email: `${guestId}@convidado.f1`,
        points: 0,
        rank: currentTotal + 1,
        level: 'Bronze',
        isAdmin: false
      };
      await set(userRef, userData);
      localStorage.setItem('f1_guest_user', JSON.stringify(userData));
      window.location.reload();
    } catch (err) {
      setError('Erro ao criar perfil de convidado.');
      setLoading(false);
    }
  };

  const currentDomain = window.location.origin;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0a0c] relative overflow-hidden">
      {showConfigGuide && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#1a1a1e] border border-white/10 rounded-[32px] p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-600/20 rounded-2xl">
                <Settings className="text-[#e10600]" size={24} />
              </div>
              <h3 className="text-xl font-black f1-font">ERRO DE CONFIGURAÇÃO</h3>
            </div>
            
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Vimos que você está tentando ativar o Google. Siga estes 2 passos finais:
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                <p className="text-xs text-gray-300">Na tela que você está aberto, selecione um <b>E-mail de suporte</b> e clique em <b>Salvar</b>.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                <div className="space-y-2">
                   <p className="text-xs text-gray-300">Confirme se este domínio está em "Domínios Autorizados":</p>
                   <code className="block bg-black p-3 rounded-xl text-[#e10600] text-[10px] font-mono break-all border border-white/5 select-all">
                     {currentDomain}
                   </code>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowConfigGuide(false)}
              className="w-full bg-[#e10600] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-xl shadow-red-600/20"
            >
              JÁ SALVEI, TENTAR NOVAMENTE
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <div className="inline-block p-4 rounded-3xl bg-red-600/10 mb-6 border border-red-600/20 shadow-[0_0_30px_rgba(225,6,0,0.1)]">
            <h1 className="text-4xl font-black f1-font text-[#e10600]">F1 2026</h1>
          </div>
          <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-tighter">Fantasy League</h2>
          <p className="text-gray-400 text-sm">Aqueça os pneus e prepare o grid</p>
        </div>

        <div className="space-y-4">
          {!guestMode ? (
            <>
              <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                    ENTRAR COM GOOGLE
                  </>
                )}
              </button>

              <div className="flex items-center gap-4 my-6">
                <div className="h-[1px] flex-1 bg-white/5"></div>
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Ou</span>
                <div className="h-[1px] flex-1 bg-white/5"></div>
              </div>

              <button 
                onClick={() => setGuestMode(true)}
                className="w-full bg-white/5 text-gray-400 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 border border-white/5 active:scale-95 transition-all text-[10px] uppercase tracking-widest"
              >
                <UserCircle2 size={16} /> Perfil de Convidado (Rápido)
              </button>
            </>
          ) : (
            <form onSubmit={handleGuestLogin} className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Seu Nome de Piloto</label>
                <input 
                  autoFocus
                  type="text" 
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Ex: Lewis Hamilton"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-[#e10600] transition-colors"
                />
              </div>
              <button 
                type="submit"
                disabled={loading || !guestName.trim()}
                className="w-full bg-[#e10600] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-red-600/20 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <><ChevronRight size={20} /> INICIAR CARREIRA</>}
              </button>
              <button 
                type="button"
                onClick={() => setGuestMode(false)}
                className="w-full text-gray-600 text-[10px] font-black uppercase tracking-widest py-2"
              >
                Voltar
              </button>
            </form>
          )}

          {error && (
            <div 
              onClick={() => setShowConfigGuide(true)}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 mt-4 cursor-pointer hover:bg-red-500/20 transition-colors"
            >
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={14} />
              <div className="flex-1">
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                    {error}
                </p>
                <p className="text-[8px] text-red-500/60 uppercase font-bold">Clique para ver como resolver</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 opacity-50 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
                <ShieldCheck size={12} className="text-green-500" />
                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter">Sistema de Criptografia Ativo</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
