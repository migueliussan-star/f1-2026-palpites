
import React, { useState } from 'react';
import { Loader2, AlertCircle, ShieldCheck, ExternalLink, Settings } from 'lucide-react';
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
        setError('Google Auth não ativado no Firebase.');
        setShowConfigGuide(true);
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Você fechou a janela de login.');
      } else {
        setError('Erro ao conectar com Google. Verifique sua conexão.');
      }
      setLoading(false);
    }
  };

  const currentDomain = window.location.origin;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0a0c] relative overflow-hidden">
      {/* Guia de Configuração para o Admin (Caso necessário) */}
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
              Vimos que o login Google ainda não está liberado. Siga estes passos:
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                <p className="text-xs text-gray-300">No Console do Firebase, selecione seu <b>E-mail de suporte</b> e salve.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                <div className="space-y-2">
                   <p className="text-xs text-gray-300">Adicione este domínio em "Domínios Autorizados":</p>
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
              JÁ CONFIGUREI, TENTAR NOVAMENTE
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
          <p className="text-gray-400 text-sm">Entre com sua conta oficial para pontuar</p>
        </div>

        <div className="space-y-4">
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
                <p className="text-[8px] text-red-500/60 uppercase font-bold">Clique para ver ajuda</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-20 pt-8 border-t border-white/5 opacity-50 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
                <ShieldCheck size={12} className="text-green-500" />
                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter">Acesso Exclusivo via Google OAuth 2.0</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
