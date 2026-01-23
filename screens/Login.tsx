
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

    // Verificação de redirecionamento SILENCIOSA
    // Não ativamos o loading(true) aqui para não travar a UI enquanto o Firebase inicializa
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        
        if (result) {
          console.log("Login via redirect detectado com sucesso");
          // NÃO ativamos setLoading(true) aqui. 
          // Deixamos o onAuthStateChanged no App.tsx lidar com a transição.
          // Se travar, o usuário ainda verá o botão de login para tentar novamente.
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
    if (loading) return;
    setLoading(true);
    setError('');
    setDetailedError('');
    
    // Timeout de segurança
    const loginTimeout = setTimeout(() => {
        setLoading(false);
        setError('O login demorou muito. Tente novamente.');
    }, 15000); 

    try {
      await signInWithPopup(auth, googleProvider);
      clearTimeout(loginTimeout);
    } catch (err: any) {
        console.log("Popup falhou, tentando redirect...", err.code);
        
        if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request' || isAppEnv) {
            try {
                await signInWithRedirect(auth, googleProvider);
            } catch (redirectErr: any) {
                clearTimeout(loginTimeout);
                handleAuthError(redirectErr);
                setLoading(false);
            }
        } else {
            clearTimeout(loginTimeout);
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
    // Estrutura Flex Padrão (ocupa 100% do pai #root)
    <div className="h-full w-full flex flex-col relative bg-[#0a0a0c] overflow-hidden">
      
      {/* Background Decorativo (Absoluto para não interferir no fluxo) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      {/* Container de Rolagem (Flex-1 força ocupar o espaço restante e scrollar se passar) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full relative z-10 scroll-smooth">
        
        {/* Wrapper de Conteúdo (Min-h-full garante que centralize se for pequeno, mas cresça se for grande) */}
        <div className="min-h-full w-full flex flex-col items-center justify-center p-6">
          
          <div className="w-full max-w-sm py-10">
            <div className="text-center mb-24 flex flex-col items-center">
              <h1 className="text-6xl font-black f1-font text-white mb-2 tracking-tighter italic drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">F1 2026</h1>
              <div className="h-1.5 w-24 bg-[#e10600] mb-6 rounded-full shadow-[0_0_10px_#e10600]"></div>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em]">Fantasy League</p>
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
              
              {/* Botão de Destravamento Manual */}
              {loading && (
                  <button 
                    onClick={() => setLoading(false)}
                    className="w-full text-center py-2"
                  >
                    <span className="text-[10px] text-gray-500 underline decoration-gray-700 underline-offset-4 hover:text-white transition-colors cursor-pointer">
                        Demorando muito? Toque para cancelar
                    </span>
                  </button>
              )}

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

      {/* Modal de Ajuda (Fixo no topo da tela, independente do scroll) */}
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
