
import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Settings, Lock, LogIn, RefreshCw, LogOut } from 'lucide-react';
import { auth, googleProvider, signInWithRedirect, signInWithPopup, getRedirectResult } from '../firebase';

interface LoginProps {
    authError?: string;
    onRetry?: (user: any) => void;
    isAuthButNoDb?: boolean;
    onLogout?: () => void;
}

const Login: React.FC<LoginProps> = ({ authError, onRetry, isAuthButNoDb, onLogout }) => {
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Iniciando...');
  const [error, setError] = useState('');
  const [detailedError, setDetailedError] = useState('');
  const [showConfigGuide, setShowConfigGuide] = useState(false);
  const [showRedirectFallback, setShowRedirectFallback] = useState(false);

  // Monitora erros vindos do App.tsx
  useEffect(() => {
    if (authError) {
        setLoading(false);
        setError(authError);
    }
  }, [authError]);

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          setLoading(true);
          setLoadingMsg("Validando acesso...");
        }
      } catch (err: any) {
        console.error("Erro redirect:", err);
      }
    };
    checkRedirect();
  }, []);

  const handleAuthError = (err: any) => {
    console.error("Auth Error:", err);
    setDetailedError(err.message || JSON.stringify(err));

    if (err.code === 'auth/unauthorized-domain') {
        setError('Domínio não autorizado.');
        // Se o erro for de domínio, sugerimos o fallback
        setTimeout(() => setShowRedirectFallback(true), 500);
    } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Janela fechada antes do login.');
    } else if (err.code === 'auth/popup-blocked') {
        setError('Pop-up bloqueado. Use o botão de Redirecionamento.');
        setShowRedirectFallback(true);
    } else if (err.code === 'auth/network-request-failed') {
        setError('Erro de conexão. Verifique a internet.');
    } else {
        setError('Falha ao autenticar.');
    }
  };

  const loginWithPopup = async () => {
    if (loading) return;
    
    // SE JÁ ESTAMOS AUTENTICADOS MAS O DB FALHOU, TENTAMOS RETRY
    if (isAuthButNoDb && onRetry && auth.currentUser) {
        setLoading(true);
        setLoadingMsg("Reconectando ao banco...");
        onRetry(auth.currentUser);
        return;
    }

    setLoading(true);
    setLoadingMsg('Abrindo janela...');
    setError('');
    setShowRedirectFallback(false);
    
    const fallbackTimer = setTimeout(() => {
        setLoadingMsg('Aguardando você...');
        setShowRedirectFallback(true);
    }, 4000);

    try {
      await signInWithPopup(auth, googleProvider);
      clearTimeout(fallbackTimer);
      setLoadingMsg("Carregando perfil...");
      
      setTimeout(() => {
          setLoading((prev) => {
              if (prev) {
                  setError("Login autorizado, mas o app não iniciou. Tente recarregar.");
                  return false;
              }
              return prev;
          });
      }, 10000);

    } catch (err: any) {
      clearTimeout(fallbackTimer);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
         setShowRedirectFallback(true);
         setLoading(false);
         if(err.code === 'auth/popup-blocked') setError('Pop-up bloqueado.');
      } else {
         handleAuthError(err);
         setLoading(false);
      }
    }
  };

  const loginWithRedirect = async () => {
      setLoading(true);
      setLoadingMsg('Redirecionando...');
      setError('');
      try {
          await signInWithRedirect(auth, googleProvider);
      } catch (err: any) {
          handleAuthError(err);
          setLoading(false);
      }
  };

  return (
    <div className="h-full w-full flex flex-col relative bg-[#0a0a0c] overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="flex-1 overflow-y-auto w-full relative z-10 scroll-smooth">
        <div className="min-h-full w-full flex flex-col items-center justify-center p-6">
          
          <div className="w-full max-w-sm py-10 glass p-8 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden">
            {/* Glossy effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>

            <div className="text-center mb-16 flex flex-col items-center relative z-10">
              <h1 className="text-6xl font-black f1-font text-white mb-2 tracking-tighter italic drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">F1 2026</h1>
              <div className="h-1.5 w-24 bg-[#e10600] mb-6 rounded-full shadow-[0_0_10px_#e10600]"></div>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em]">Fantasy League</p>
            </div>

            <div className="space-y-4 relative z-10">
              {/* Botão Principal - Google */}
              <button 
                onClick={loading ? undefined : loginWithPopup}
                disabled={loading}
                className={`w-full font-black py-6 rounded-3xl flex items-center justify-center gap-4 transition-all shadow-2xl text-xs tracking-widest
                    ${loading ? 'bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-white text-black active:scale-95 hover:bg-gray-100'}
                    ${isAuthButNoDb ? 'border-2 border-[#e10600] text-[#e10600] bg-transparent hover:bg-[#e10600] hover:text-white' : ''}
                `}
              >
                {loading ? (
                    <div className="flex items-center gap-3">
                        <Loader2 className="animate-spin" size={20} />
                        <span>{loadingMsg}</span>
                    </div>
                ) : isAuthButNoDb ? (
                    <>
                        <RefreshCw size={18} />
                        TENTAR CONECTAR NOVAMENTE
                    </>
                ) : (
                  <>
                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                    ENTRAR COM GOOGLE
                  </>
                )}
              </button>

              {/* Botão de Logout se estiver travado */}
              {isAuthButNoDb && onLogout && (
                  <button 
                    onClick={onLogout}
                    className="w-full py-3 text-gray-500 text-[10px] font-bold uppercase hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                      <LogOut size={12} /> Sair da conta atual
                  </button>
              )}

              {/* Opção de Redirecionamento (Aparece se demorar ou falhar) */}
              {(showRedirectFallback || loading) && !isAuthButNoDb && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-500 space-y-3">
                     {!loading ? (
                         <button 
                            onClick={loginWithRedirect}
                            className="w-full bg-[#e10600]/10 border border-[#e10600]/30 text-white py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all mt-2"
                         >
                            <LogIn size={16} className="text-[#e10600]" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Usar Modo Redirecionamento</span>
                         </button>
                     ) : (
                         <button 
                            onClick={() => setLoading(false)}
                            className="w-full text-center py-2 opacity-50 hover:opacity-100 transition-opacity"
                         >
                            <span className="text-[10px] text-gray-400 underline decoration-gray-600 underline-offset-4">
                                Cancelar e tentar novamente
                            </span>
                         </button>
                     )}
                  </div>
              )}

              {error && (
                <div className="space-y-3 animate-in shake duration-300">
                  <div 
                    onClick={() => setShowConfigGuide(true)}
                    className="p-5 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-start gap-4 cursor-pointer hover:bg-red-500/20 transition-all"
                  >
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                    <div className="flex-1">
                      <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</p>
                      <p className="text-[9px] text-red-500/60 uppercase font-bold mt-1">Toque para ver detalhes</p>
                    </div>
                  </div>
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

      {showConfigGuide && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#1a1a1e] border border-white/10 rounded-[40px] p-8 max-w-md w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-600/20 rounded-2xl">
                <Settings className="text-[#e10600]" size={24} />
              </div>
              <h3 className="text-xl font-black f1-font uppercase leading-tight">Ajuda</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-3xl">
                 <h4 className="text-[10px] font-black uppercase text-blue-400 mb-2">Detalhe Técnico:</h4>
                 <p className="text-[10px] text-red-300 font-mono break-all bg-black/30 p-2 rounded-lg">
                    {detailedError || "Erro desconhecido"}
                 </p>
              </div>
              <div className="bg-blue-600/10 p-4 rounded-3xl border border-blue-600/20">
                <p className="text-[10px] text-blue-400 font-black uppercase mb-2">Dica:</p>
                <p className="text-[10px] text-gray-300">
                    Se este erro persistir e você for o administrador, verifique as REGRAS (Rules) do Realtime Database no Firebase Console. Elas podem estar bloqueando leitura/gravação.
                </p>
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
    </div>
  );
};

export default Login;
