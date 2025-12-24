
import React, { useState } from 'react';
import { Loader2, AlertCircle, ShieldCheck, Settings, Lock, Globe, Users, CreditCard } from 'lucide-react';
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
      if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed' || err.code === 'auth/unauthorized-domain') {
        setError('Configuração pendente no console.');
        setShowConfigGuide(true);
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelado.');
      } else {
        setError('Erro ao conectar. Verifique o console.');
        setShowConfigGuide(true);
      }
      setLoading(false);
    }
  };

  const currentDomain = window.location.hostname;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0a0c] relative overflow-hidden">
      {/* Estética F1 */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-600/5 blur-[120px] rounded-full"></div>

      {showConfigGuide && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#1a1a1e] border border-white/10 rounded-[40px] p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-600/20 rounded-2xl">
                <Settings className="text-[#e10600]" size={24} />
              </div>
              <h3 className="text-xl font-black f1-font uppercase leading-tight">Configuração Final</h3>
            </div>
            
            <div className="space-y-6">
              <section className="bg-white/5 p-4 rounded-3xl border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={14} className="text-[#e10600]" />
                  <h4 className="text-[10px] font-black uppercase text-white tracking-widest">1. Liberar Acesso (Público-alvo)</h4>
                </div>
                <p className="text-gray-400 text-[11px] mb-3 leading-relaxed">Para remover o erro "Aguardando Aprovação":</p>
                <ol className="text-[10px] text-gray-500 space-y-2 list-decimal ml-4 font-bold uppercase">
                  <li>No menu lateral, clique em <span className="text-white">"Público-alvo"</span>.</li>
                  <li>Clique no botão <span className="text-green-500">"PUBLICAR APLICATIVO"</span>.</li>
                  <li>Confirme. Agora qualquer pessoa pode entrar.</li>
                </ol>
              </section>

              <section className="bg-white/5 p-4 rounded-3xl border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard size={14} className="text-blue-400" />
                  <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-widest">2. Autorizar Site (Clientes)</h4>
                </div>
                <p className="text-gray-400 text-[11px] mb-2 leading-relaxed">Se o login falhar, verifique se o site está na lista branca:</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Menu "Clientes" &gt; Web Client &gt; Origens JavaScript:</p>
                <code className="block bg-black p-3 rounded-xl text-[#e10600] text-[10px] font-mono break-all border border-white/5 select-all">
                  {currentDomain}
                </code>
              </section>

              <section className="bg-white/5 p-4 rounded-3xl border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Globe size={14} className="text-green-400" />
                  <h4 className="text-[10px] font-black uppercase text-green-400 tracking-widest">3. Domínio no Firebase</h4>
                </div>
                <p className="text-gray-400 text-[11px] mb-2 leading-relaxed">No console do Firebase, em "Authorized Domains", adicione o mesmo link acima.</p>
              </section>
            </div>

            <button 
              onClick={() => setShowConfigGuide(false)}
              className="w-full mt-8 bg-[#e10600] text-white font-black py-5 rounded-3xl text-[10px] uppercase tracking-widest shadow-xl shadow-red-600/20 active:scale-95 transition-all"
            >
              FECHAR E TENTAR LOGIN
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
              className="p-5 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-start gap-4 mt-6 cursor-pointer hover:bg-red-500/20 transition-colors"
            >
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
              <div className="flex-1">
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-1">
                    {error}
                </p>
                <p className="text-[9px] text-red-500/60 uppercase font-bold">Clique aqui para ver como liberar o acesso</p>
              </div>
            </div>
          )}
          
          <button 
            onClick={() => setShowConfigGuide(true)}
            className="w-full text-[9px] text-gray-600 font-black uppercase tracking-[0.2em] py-4 hover:text-gray-400 transition-colors"
          >
            Guia para o Administrador
          </button>
        </div>

        <div className="mt-12 pt-10 border-t border-white/5 opacity-30 text-center">
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
