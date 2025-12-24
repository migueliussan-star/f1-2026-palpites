
import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Settings, Lock, Smartphone, ExternalLink } from 'lucide-react';
import { auth, googleProvider, signInWithRedirect, signInWithPopup, getRedirectResult } from '../firebase';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailedError, setDetailedError] = useState('');
  const [showConfigGuide, setShowConfigGuide] = useState(false);
  const [isAppEnv, setIsAppEnv] = useState(false);

  useEffect(() => {
    // Detecta se está rodando dentro de um app (Capacitor/WebView)
    const isCapacitor = (window as any).Capacitor !== undefined;
    const isWebView = /wv|Webview/i.test(navigator.userAgent);
    setIsAppEnv(isCapacitor || isWebView);

    // Verifica se voltou de um redirecionamento (caso o popup falhe e o usuário tente redirect)
    const checkRedirect = async () => {
      try {
        setLoading(true);
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("Login via redirect sucesso");
        } else {
            setLoading(false);
        }
      } catch (err: any) {
        console.error("Erro no login redirect:", err);
        handleAuthError(err);
        setLoading(false);
      }
    };
    checkRedirect();
  }, []);

  const handleAuthError = (err: any) => {
    console.error("Auth Error:", err);
    setDetailedError(err.message || JSON.stringify(err));

    if (err.code === 'auth/unauthorized-domain') {
        setError('Domínio não autorizado no Firebase.');
    } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelado pelo usuário.');
    } else if (err.code === 'auth/popup-blocked') {
        setError('Pop-up bloqueado pelo navegador.');
    } else if (err.code === 'auth/network-request-failed') {
        setError('Erro de conexão. Verifique sua internet.');
    } else {
        setError('Falha ao autenticar.');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    setDetailedError('');
    
    try {
      // Tenta Popup primeiro (Melhor UX para Web/PWA Desktop)
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
        // Se falhar (ex: bloqueador de popup ou ambiente mobile estrito), tenta Redirect
        console.log("Popup falhou, tentando redirect...", err.code);
        
        if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user' || isAppEnv) {
            try {
                await signInWithRedirect(auth, googleProvider);
            } catch (redirectErr: any) {
                handleAuthError(redirectErr);
                setLoading(false);
            }
        } else {
            handleAuthError(err);
            setLoading(false);
        }
    }
  };

  const handleOpenInBrowser = () => {
    const url = window.location.href;
    window.open(url, '_system');
  };

  return (
    // Container principal fixo (não rola, segura o background)
    <div className="fixed inset-0 w-full h-full bg-[#0a0a0c] overflow-hidden">
      
      {/* Background Decorativo */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      {/* Container de Rolagem (ocupa tudo, permite scroll) */}
      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden scroll-smooth">
        
        {/* Wrapper de Layout (Centraliza verticalmente, mas cresce se precisar) */}
        <div className="min-h-full w-full flex flex-col items-center justify-center p-6">
          
          <div className="w-full max-w-sm relative z-10 py-10">
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
                    className="p-5 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-start gap-4 cursor-pointer hover:bg-red-500/20 transition-all"
                  >
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                    <div className="flex-1">
                      <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</p>
                      <p className="text-[9px] text-red-500/60 uppercase font-bold mt-1">Toque para ver detalhes técnicos</p>
                    </div>
                  </div>

                  {isAppEnv && (
                    <button 
                      onClick={handleOpenInBrowser}
                      className="w-full py-4 rounded-2xl border border-white/10 text-[10px] font-black uppercase text-gray-400 flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={14} /> Tentar no Navegador
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
      </div>

      {/* Modal de Ajuda (Fica fixo por cima de tudo) */}
      {showConfigGuide && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#1a1a1e] border border-white/10 rounded-[40px] p-8 max-w-md w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-600/20 rounded-2xl">
                <Settings className="text-[#e10600]" size={24} />
              </div>
              <h3 className="text-xl font-black f1-font uppercase leading-tight">Ajuda de Login</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                 <h4 className="text-[10px] font-black uppercase text-blue-400 mb-2">Erro Técnico:</h4>
                 <p className="text-[10px] text-red-300 font-mono break-all bg-black/30 p-2 rounded-lg">
                    {detailedError || "Nenhum detalhe disponível."}
                 </p>
              </div>

              <div className="bg-blue-600/10 p-4 rounded-3xl border border-blue-600/20">
                <p className="text-[10px] text-blue-400 font-black uppercase mb-2">Possíveis Soluções:</p>
                <ul className="text-[10px] text-gray-300 space-y-2 list-disc list-inside">
                  <li>Se o erro for "Unauthorized domain", adicione este domínio no Firebase Console.</li>
                  <li>Verifique sua conexão com a internet.</li>
                  <li>Tente abrir no Chrome (se estiver em outro app).</li>
                </ul>
              </div>
            </div>

            <button 
              onClick={() => setShowConfigGuide(false)}
              className="w-full mt-8 bg-[#e10600] text-white font-black py-5 rounded-3xl text-[10px] uppercase tracking-widest active:scale-95"
            >
              ENTENDI
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
