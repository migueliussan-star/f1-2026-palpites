
import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, ShieldCheck, Settings, Lock, Globe, ExternalLink, Smartphone } from 'lucide-react';
import { auth, googleProvider, signInWithRedirect, getRedirectResult } from '../firebase';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfigGuide, setShowConfigGuide] = useState(false);
  const [isAppEnv, setIsAppEnv] = useState(false);

  useEffect(() => {
    // Detecta se está rodando dentro de um app (Capacitor/WebView)
    const isCapacitor = (window as any).Capacitor !== undefined;
    const isWebView = /wv|Webview/i.test(navigator.userAgent);
    setIsAppEnv(isCapacitor || isWebView);

    const checkRedirect = async () => {
      try {
        setLoading(true);
        const result = await getRedirectResult(auth);
        if (result) {
          // Logado com sucesso
        }
      } catch (err: any) {
        console.error("Erro no login:", err);
        if (err.code === 'auth/disallowed-user-agent' || err.message?.includes('user-agent')) {
          setError('O Google bloqueou o login neste formato de app.');
        } else if (err.code === 'auth/popup-blocked') {
          setError('O navegador bloqueou a janela de login.');
        } else {
          setError('Falha na conexão com o Google.');
        }
      } finally {
        setLoading(false);
      }
    };
    checkRedirect();
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // Em Apps nativos, Redirect é obrigatório
      await signInWithRedirect(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao abrir o Google.');
      setLoading(false);
    }
  };

  const handleOpenInBrowser = () => {
    // Tenta forçar a abertura no navegador padrão se estiver no app
    const url = window.location.href;
    window.open(url, '_system');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0a0c] relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/10 blur-[120px] rounded-full"></div>
      
      {showConfigGuide && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#1a1a1e] border border-white/10 rounded-[40px] p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-600/20 rounded-2xl">
                <Settings className="text-[#e10600]" size={24} />
              </div>
              <h3 className="text-xl font-black f1-font uppercase leading-tight">Problema de Login</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone size={14} className="text-blue-400" />
                  <h4 className="text-[10px] font-black uppercase text-blue-400">Por que o erro 403?</h4>
                </div>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  O Google bloqueia login em APKs simples por segurança.
                </p>
              </div>

              <div className="bg-blue-600/10 p-4 rounded-3xl border border-blue-600/20">
                <p className="text-[10px] text-blue-400 font-black uppercase mb-2">Solução Definitiva:</p>
                <ol className="text-[10px] text-gray-300 space-y-2 font-bold uppercase">
                  <li>1. Abra o site no Chrome do celular</li>
                  <li>2. Faça o login por lá</li>
                  <li>3. O App reconhecerá seu acesso</li>
                </ol>
              </div>
            </div>

            <button 
              onClick={() => setShowConfigGuide(false)}
              className="w-full mt-8 bg-[#e10600] text-white font-black py-5 rounded-3xl text-[10px] uppercase tracking-widest active:scale-95"
            >
              FECHAR
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-12">
          <div className="inline-block p-5 rounded-[40px] bg-red-600/10 mb-8 border border-red-600/20">
            <h1 className="text-5xl font-black f1-font text-[#e10600] tracking-tighter">F1 2026</h1>
          </div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em]">Acesse sua conta de piloto</p>
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
                LOGAR COM GOOGLE
              </>
            )}
          </button>

          {error && (
            <div className="space-y-3">
              <div 
                onClick={() => setShowConfigGuide(true)}
                className="p-5 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-start gap-4 cursor-pointer"
              >
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                <div className="flex-1">
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</p>
                  <p className="text-[9px] text-red-500/60 uppercase font-bold mt-1">Clique para saber como resolver</p>
                </div>
              </div>

              {isAppEnv && (
                <button 
                  onClick={handleOpenInBrowser}
                  className="w-full py-4 rounded-2xl border border-white/10 text-[10px] font-black uppercase text-gray-400 flex items-center justify-center gap-2"
                >
                  <ExternalLink size={14} /> Abrir no Navegador
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-12 opacity-30 text-center">
            <div className="flex items-center justify-center gap-3">
                <Lock size={12} className="text-gray-400" />
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Acesso Seguro</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
