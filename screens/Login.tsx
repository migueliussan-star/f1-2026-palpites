
import React, { useState } from 'react';
import { Loader2, AlertCircle, ShieldCheck, Settings, Lock } from 'lucide-react';
import { auth, googleProvider, signInWithPopup } from '../firebase';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfigGuide, setShowConfigGuide] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
        setError('Google Auth pendente no Firebase.');
        setShowConfigGuide(true);
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelado.');
      } else {
        setError('Erro de conexão com o servidor.');
      }
      setLoading(false);
    }
  };

  const currentDomain = window.location.origin;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0a0c] relative overflow-hidden">
      {/* Luzes de fundo para estética F1 */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-600/5 blur-[120px] rounded-full"></div>

      {showConfigGuide && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#1a1a1e] border border-white/10 rounded-[40px] p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-600/20 rounded-2xl">
                <Settings className="text-[#e10600]" size={24} />
              </div>
              <h3 className="text-xl font-black f1-font">LIBERAR ACESSO</h3>
            </div>
            
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              O Google exige que você autorize este domínio no painel do Firebase:
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                <p className="text-xs text-gray-300">No Console do Firebase, defina o <b>E-mail de suporte</b> e salve.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                <div className="space-y-2 flex-1">
                   <p className="text-xs text-gray-300">Adicione este domínio em "Domínios Autorizados":</p>
                   <code className="block bg-black p-4 rounded-2xl text-[#e10600] text-[10px] font-mono break-all border border-white/5 select-all">
                     {currentDomain}
                   </code>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowConfigGuide(false)}
              className="w-full bg-[#e10600] text-white font-black py-5 rounded-3xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-xl shadow-red-600/20 active:scale-95 transition-all"
            >
              JÁ AUTORIZEI, TENTAR AGORA
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-12">
          <div className="inline-block p-5 rounded-[40px] bg-red-600/10 mb-8 border border-red-600/20 shadow-[0_0_50px_rgba(225,6,0,0.1)]">
            <h1 className="text-5xl font-black f1-font text-[#e10600] tracking-tighter">F1 2026</h1>
          </div>
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Fantasy League</h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em]">Sua conta oficial de piloto</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-black font-black py-6 rounded-3xl flex items-center justify-center gap-4 active:scale-95 transition-all shadow-2xl disabled:opacity-50 text-xs tracking-widest"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                CONECTAR COM GOOGLE
              </>
            )}
          </button>

          {error && (
            <div 
              onClick={() => setShowConfigGuide(true)}
              className="p-5 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-start gap-4 mt-6 cursor-pointer hover:bg-red-500/20 transition-colors animate-in slide-in-from-top duration-300"
            >
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
              <div className="flex-1">
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-1">
                    {error}
                </p>
                <p className="text-[9px] text-red-500/60 uppercase font-bold">Clique aqui para ver o tutorial de ajuda</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-24 pt-10 border-t border-white/5 opacity-30 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
                <Lock size={12} className="text-gray-400" />
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Acesso Seguro Criptografado</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
