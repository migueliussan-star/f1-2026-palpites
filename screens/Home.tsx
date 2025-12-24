import React, { useState, useEffect } from 'react';
import { User, RaceGP } from '../types';
import { ChevronRight, Zap, Flag, Timer, Trophy, LogOut, Smartphone, ShieldCheck, Share, PlusSquare, Trash2, UserCircle, HelpCircle, MoreVertical, X } from 'lucide-react';

interface HomeProps {
  user: User;
  nextGP: RaceGP;
  predictionsCount: number;
  onNavigateToPredict: () => void;
  onLogout: () => void;
  onDeleteAccount: () => Promise<void>;
  hasNoAdmin: boolean;
  onClaimAdmin: () => void;
  canInstall: boolean;
  onInstall: () => void;
}

const Home: React.FC<HomeProps> = ({ 
  user, nextGP, predictionsCount, onNavigateToPredict, onLogout, onDeleteAccount, hasNoAdmin, onClaimAdmin, canInstall, onInstall 
}) => {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showManualInstallModal, setShowManualInstallModal] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(!!standalone);

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const interval = setInterval(() => {
      const target = new Date('2026-03-08T00:00:00'); 
      const diff = target.getTime() - Date.now();
      if (diff > 0) {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: Math.floor((diff / 1000) % 60)
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleInstallClick = () => {
    if (canInstall) {
      onInstall();
    } else {
      setShowManualInstallModal(true);
    }
  };

  return (
    <div className="p-6">
      {/* Modal de Instalação Manual */}
      {showManualInstallModal && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
          <div className="bg-[#1a1a1e] w-full max-w-sm rounded-[32px] border border-white/10 p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowManualInstallModal(false)}
              className="absolute top-4 right-4 bg-white/10 p-2 rounded-full text-white/70 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-600/20 p-3 rounded-2xl">
                <Smartphone className="text-blue-500" size={24} />
              </div>
              <h3 className="text-xl font-black f1-font uppercase leading-none">Instalação Manual</h3>
            </div>

            <p className="text-xs text-gray-400 font-bold mb-6 leading-relaxed">
              O navegador bloqueou a instalação automática. Siga os passos abaixo para instalar:
            </p>

            {isIOS ? (
              <div className="space-y-4 bg-blue-900/10 p-4 rounded-2xl border border-blue-500/10">
                <div className="flex items-center gap-4">
                  <div className="bg-white/10 p-2 rounded-lg shrink-0"><Share size={18} /></div>
                  <p className="text-xs font-bold">1. Toque no botão <span className="text-blue-400">Compartilhar</span> na barra inferior.</p>
                </div>
                <div className="w-full h-px bg-white/5"></div>
                <div className="flex items-center gap-4">
                  <div className="bg-white/10 p-2 rounded-lg shrink-0"><PlusSquare size={18} /></div>
                  <p className="text-xs font-bold">2. Role para baixo e toque em <span className="text-blue-400">Adicionar à Tela de Início</span>.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 bg-blue-900/10 p-4 rounded-2xl border border-blue-500/10">
                <div className="flex items-center gap-4">
                  <div className="bg-white/10 p-2 rounded-lg shrink-0"><MoreVertical size={18} /></div>
                  <p className="text-xs font-bold">1. Toque nos <span className="text-blue-400">Três Pontinhos</span> no topo direito.</p>
                </div>
                <div className="w-full h-px bg-white/5"></div>
                <div className="flex items-center gap-4">
                  <div className="bg-white/10 p-2 rounded-lg shrink-0"><Smartphone size={18} /></div>
                  <p className="text-xs font-bold">2. Selecione <span className="text-blue-400">Instalar aplicativo</span> ou <span className="text-blue-400">Adicionar à tela inicial</span>.</p>
                </div>
              </div>
            )}

            <button 
              onClick={() => setShowManualInstallModal(false)}
              className="w-full mt-6 bg-white text-black font-black py-4 rounded-2xl uppercase tracking-widest text-xs active:scale-95 transition-all"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#e10600] to-red-900 border-2 border-white/20 flex items-center justify-center shadow-lg relative">
            <span className="text-xl font-bold f1-font">{user.name.charAt(0).toUpperCase()}</span>
            {user.isAdmin && <div className="absolute -top-1 -right-1 bg-yellow-500 p-1 rounded-full border border-black"><Trophy size={8} className="text-black" /></div>}
          </div>
          <div>
            <h1 className="text-xl font-bold">{user.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-400">{user.rank > 0 ? `${user.rank}º lugar` : 'Estreante'}</span>
              {user.isAdmin && <span className="text-[10px] bg-red-600/20 text-red-500 px-2 py-0.5 rounded-full font-black">ADMIN</span>}
            </div>
          </div>
        </div>
        <button onClick={onLogout} className="bg-white/5 p-3 rounded-2xl text-gray-400 hover:text-white transition-all active:scale-90" title="Sair">
          <LogOut size={20} />
        </button>
      </div>

      {/* Guia de Instalação Inteligente */}
      {!isStandalone && (
        <div className="mb-6 bg-gradient-to-r from-blue-600/20 to-blue-900/20 border border-blue-600/30 p-5 rounded-[32px] animate-in slide-in-from-top duration-500 shadow-2xl shadow-blue-600/10">
           <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Smartphone className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-white tracking-widest mb-1">Instalar Aplicativo</p>
                <p className="text-[9px] text-blue-200/60 font-bold uppercase leading-tight">Melhor experiência em tela cheia.</p>
              </div>
           </div>
           
           <button 
             onClick={handleInstallClick}
             className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
               canInstall 
               ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 active:scale-95' 
               : 'bg-white/10 text-blue-200 border border-white/5 hover:bg-white/20'
             }`}
           >
             {canInstall ? 'INSTALAR AGORA' : 'COMO INSTALAR?'}
           </button>
           
           {!canInstall && (
             <p className="text-[8px] text-blue-300/50 mt-3 text-center uppercase font-bold px-2">
               Toque acima para ver o guia manual
             </p>
           )}
        </div>
      )}

      {/* Alerta de Administrador */}
      {hasNoAdmin && !user.isAdmin && (
        <div className="mb-6 p-6 bg-amber-600/10 border-2 border-amber-600/40 rounded-[32px]">
            <div className="flex items-center gap-3 mb-4"><ShieldCheck className="text-amber-500" size={24} /><p className="text-[12px] font-black uppercase text-amber-500">Sistema sem Admin</p></div>
            <p className="text-xs text-white/80 mb-5 leading-relaxed font-bold">Torne-se o administrador para gerenciar o calendário e resultados.</p>
            <button onClick={onClaimAdmin} className="w-full bg-amber-600 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-amber-600/30 active:scale-95 transition-all">REIVINDICAR ACESSO</button>
        </div>
      )}

      <div className="bg-gradient-to-br from-[#1a1a1e] to-[#0a0a0c] rounded-[40px] p-8 mb-6 relative overflow-hidden border border-white/5 shadow-2xl">
        <div className="absolute -right-8 -bottom-8 opacity-5"><Flag size={200} /></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#e10600] text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Timer size={14} /> PRÓXIMO GP</span>
            <span className="text-[10px] font-black px-3 py-1 rounded-full border border-green-500/20 bg-green-500/10 text-green-500 uppercase">Aberto</span>
          </div>
          <h2 className="text-3xl font-black f1-font mb-2 leading-none">{nextGP.name.toUpperCase()}</h2>
          <p className="text-gray-400 text-xs font-medium mb-8 uppercase tracking-widest">{nextGP.date} • {nextGP.location.toUpperCase()}</p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                <p className="text-2xl font-black f1-font">{predictionsCount}</p>
                <p className="text-[8px] uppercase text-gray-500 font-bold tracking-widest">Sessões</p>
            </div>
            <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                <p className="text-2xl font-black f1-font">{timeLeft.d}d</p>
                <p className="text-[8px] uppercase text-gray-500 font-bold tracking-widest">Countdown</p>
            </div>
          </div>
          <button onClick={onNavigateToPredict} className="w-full bg-[#e10600] text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-red-600/30 text-xs uppercase tracking-widest">PALPITAR AGORA <ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-12">
        <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 shadow-inner">
          <Zap className="text-yellow-500 mb-3" size={24} />
          <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-1">Pontos</p>
          <p className="text-2xl font-black f1-font">{user.points || 0}</p>
        </div>
        <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 shadow-inner">
          <Trophy className="text-[#e10600] mb-3" size={24} />
          <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-1">Ranking</p>
          <p className="text-2xl font-black f1-font">{user.rank > 0 ? `${user.rank}º` : '--'}</p>
        </div>
      </div>

      {/* Seção de Gerenciamento de Conta */}
      <div className="mb-24">
        <div className="flex items-center gap-2 mb-4 px-2">
            <UserCircle size={16} className="text-gray-600" />
            <h3 className="text-[10px] font-black uppercase text-gray-600 tracking-widest">Gerenciamento de Conta</h3>
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={onLogout}
            className="w-full bg-white/5 border border-white/10 p-5 rounded-[24px] flex items-center justify-between hover:bg-white/10 transition-all active:scale-95 group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-500/10 rounded-2xl group-hover:bg-gray-500/20 transition-all">
                <LogOut size={18} className="text-gray-400" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black uppercase text-white tracking-widest">Sair da Conta</p>
                <p className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter">Desconectar do dispositivo atual</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-600" />
          </button>

          <button 
            onClick={onDeleteAccount}
            className="w-full bg-red-600/5 border border-red-600/10 p-5 rounded-[24px] flex items-center justify-between hover:bg-red-600/10 transition-all active:scale-95 group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-600/10 rounded-2xl group-hover:bg-red-600/20 transition-all">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black uppercase text-red-500 tracking-widest">Excluir Dados</p>
                <p className="text-[8px] font-bold text-red-900 uppercase tracking-tighter">Apagar conta e todos os palpites</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-red-900" />
          </button>
        </div>

        <p className="text-[8px] text-gray-700 font-black text-center mt-8 uppercase tracking-widest">
          App Palpites F1 2026 • v1.4.0
        </p>
      </div>
    </div>
  );
};

export default Home;