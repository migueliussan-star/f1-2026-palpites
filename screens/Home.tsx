
import React, { useState, useEffect } from 'react';
import { User, RaceGP } from '../types';
import { ChevronRight, Zap, Flag, Timer, Trophy, LogOut, Trash2, UserCircle, MapPin, Download, Share, CheckCircle2 } from 'lucide-react';

interface HomeProps {
  user: User;
  nextGP: RaceGP;
  predictionsCount: number;
  onNavigateToPredict: () => void;
  onLogout: () => void;
  onDeleteAccount: () => Promise<void>;
  hasNoAdmin: boolean;
  onClaimAdmin: () => void;
}

const Home: React.FC<HomeProps> = ({ 
  user, nextGP, predictionsCount, onNavigateToPredict, onLogout, onDeleteAccount, hasNoAdmin, onClaimAdmin
}) => {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  // Lógica de Cores baseada nos palpites
  const totalSessions = nextGP.isSprint ? 4 : 2;
  const isComplete = predictionsCount >= totalSessions;
  const isPartial = predictionsCount > 0 && predictionsCount < totalSessions;

  let cardOverlayClass = "from-[#e10600]/20"; // Padrão (Vermelho)
  let statusText = "Aberto";
  let statusColor = "bg-green-500"; 
  let buttonClass = "bg-[#e10600] text-white shadow-[0_0_30px_rgba(225,6,0,0.4)] hover:bg-[#ff0a00]";

  if (isComplete) {
    // Verde Limão (Lime) para Completo
    cardOverlayClass = "from-lime-600/80 to-lime-900/90 mix-blend-multiply"; 
    statusText = "Completo";
    statusColor = "bg-lime-400";
    buttonClass = "bg-lime-400 text-black shadow-[0_0_30px_rgba(163,230,53,0.6)] hover:bg-lime-300";
  } else if (isPartial) {
    // Amarelo para Parcial
    cardOverlayClass = "from-yellow-500/30 to-yellow-600/10 mix-blend-normal"; 
    statusText = "Em andamento";
    statusColor = "bg-yellow-400";
    buttonClass = "bg-yellow-400 text-black shadow-[0_0_30px_rgba(250,204,21,0.4)] hover:bg-yellow-300";
  }

  useEffect(() => {
    // Timer do Countdown - Ajustado para 06 de Março (Início do GP)
    const interval = setInterval(() => {
      const target = new Date('2026-03-06T00:00:00'); 
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

    // Lógica de Instalação PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Detecta iOS para mostrar instruções manuais
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <div className="p-6 pt-10">
      {/* Header Profile */}
      <div className="flex items-center justify-between mb-8 animate-enter">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#e10600] to-orange-600 p-[2px] shadow-lg shadow-red-900/20">
            <div className="w-full h-full rounded-full bg-[#0a0a0c] flex items-center justify-center">
                <span className="text-xl font-bold f1-font text-white">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            {user.isAdmin && <div className="absolute -top-1 -right-1 bg-yellow-400 text-black p-1 rounded-full border-2 border-[#0a0a0c]"><Trophy size={10} /></div>}
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-0.5">Bem-vindo,</p>
            <h1 className="text-xl font-black text-white leading-none">{user.name}</h1>
          </div>
        </div>
        <button onClick={onLogout} className="glass w-12 h-12 rounded-full flex items-center justify-center text-gray-400 hover:text-white active:scale-90 transition-all">
          <LogOut size={20} />
        </button>
      </div>

      {hasNoAdmin && !user.isAdmin && (
        <div className="mb-6 p-6 bg-gradient-to-r from-amber-900/40 to-amber-600/10 border border-amber-500/30 rounded-[32px] animate-enter" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center gap-3 mb-4"><Zap className="text-amber-500" size={24} /><p className="text-[12px] font-black uppercase text-amber-500">Sistema sem Admin</p></div>
            <button onClick={onClaimAdmin} className="w-full bg-amber-500 text-black font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all">REIVINDICAR ACESSO</button>
        </div>
      )}

      {/* Main GP Card */}
      <div className={`relative w-full aspect-[4/5] max-h-[420px] rounded-[40px] overflow-hidden mb-8 shadow-2xl group animate-enter transition-all duration-500 ${isComplete ? 'shadow-lime-900/40 border border-lime-500/20' : isPartial ? 'shadow-yellow-900/40 border border-yellow-500/20' : ''}`} style={{animationDelay: '0.2s'}}>
        {/* Background Image / Gradient */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1535136829775-7b3b3d81b947?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-[#0a0a0c]/80 to-transparent"></div>
        
        {/* Dynamic Color Overlay based on Status */}
        <div className={`absolute inset-0 bg-gradient-to-b ${cardOverlayClass} transition-colors duration-500`}></div>

        <div className="absolute inset-0 p-8 flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusColor} animate-pulse`}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{statusText}</span>
                </div>
                <div className="text-right">
                    <p className="text-4xl font-black f1-font leading-none mb-1">{nextGP.id}</p>
                    <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Round</p>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <div className={`flex items-center gap-2 mb-2 transition-colors ${isComplete ? 'text-lime-400' : isPartial ? 'text-yellow-400' : 'text-[#e10600]'}`}>
                        <MapPin size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">{nextGP.location}</span>
                    </div>
                    <h2 className="text-4xl font-black f1-font uppercase italic leading-none">{nextGP.name}</h2>
                    <p className="text-sm font-medium text-gray-300 mt-2">{nextGP.date}</p>
                </div>

                {/* Countdown styling */}
                <div className="flex gap-3">
                    <CountdownUnit value={timeLeft.d} label="Dias" />
                    <CountdownUnit value={timeLeft.h} label="Hrs" />
                    <CountdownUnit value={timeLeft.m} label="Min" />
                    <CountdownUnit value={timeLeft.s} label="Seg" />
                </div>

                <button 
                    onClick={onNavigateToPredict} 
                    className={`w-full font-black py-5 rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all text-xs uppercase tracking-widest border border-white/20 ${buttonClass}`}
                >
                    {isComplete ? (
                        <>PALPITES COMPLETOS <CheckCircle2 size={18} /></>
                    ) : (
                        <>FAZER PALPITE <ChevronRight size={18} /></>
                    )}
                </button>
            </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 mb-12 animate-enter" style={{animationDelay: '0.3s'}}>
        <div className="glass-card p-6 rounded-[32px] relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 bg-yellow-500/10 w-24 h-24 rounded-full blur-xl group-hover:bg-yellow-500/20 transition-all"></div>
          <Zap className="text-yellow-500 mb-4" size={28} />
          <p className="text-3xl font-black f1-font text-white mb-1">{user.points || 0}</p>
          <p className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Pontos Totais</p>
        </div>
        <div className="glass-card p-6 rounded-[32px] relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 bg-blue-500/10 w-24 h-24 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
          <Trophy className="text-blue-500 mb-4" size={28} />
          <p className="text-3xl font-black f1-font text-white mb-1">{user.rank > 0 ? `${user.rank}º` : '-'}</p>
          <p className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Ranking Global</p>
        </div>
      </div>

      {/* Install App Section - ONLY visible if browser allows or is iOS */}
      {(deferredPrompt || isIOS) && (
        <div className="mb-8 animate-enter" style={{animationDelay: '0.35s'}}>
             <div className="flex items-center gap-3 mb-6 px-2 opacity-50">
                <div className="h-[1px] flex-1 bg-white/20"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Instalação</span>
                <div className="h-[1px] flex-1 bg-white/20"></div>
            </div>

            <div className="p-[2px] rounded-[24px] bg-gradient-to-r from-blue-500 via-purple-500 to-red-500">
                <div className="bg-[#0a0a0c] rounded-[22px] p-6 relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white/10 rounded-xl">
                            <Download size={20} className="text-white"/>
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase">Instalar App</h3>
                            <p className="text-[10px] text-gray-400 font-bold">Acesso rápido e tela cheia</p>
                        </div>
                    </div>

                    {deferredPrompt ? (
                        <button 
                            onClick={handleInstallClick}
                            className="w-full bg-white text-black font-black py-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                        >
                            ADICIONAR À TELA INICIAL
                        </button>
                    ) : (
                        <div className="text-[10px] text-gray-400 bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 mb-2 text-white font-bold">
                                <Share size={12} /> <span className="uppercase">Para iPhone (iOS):</span>
                            </div>
                            <ol className="list-decimal list-inside space-y-1 ml-1">
                                <li>Toque no botão <strong>Compartilhar</strong></li>
                                <li>Selecione <strong>"Adicionar à Tela de Início"</strong></li>
                            </ol>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Account Management */}
      <div className="mb-24 animate-enter" style={{animationDelay: '0.4s'}}>
        <div className="flex items-center gap-3 mb-6 px-2 opacity-50">
            <div className="h-[1px] flex-1 bg-white/20"></div>
            <span className="text-[10px] font-black uppercase tracking-widest">Conta</span>
            <div className="h-[1px] flex-1 bg-white/20"></div>
        </div>
        
        <button 
        onClick={onDeleteAccount}
        className="w-full glass p-5 rounded-[24px] flex items-center justify-between hover:bg-red-900/20 transition-all active:scale-95 group border border-red-500/10"
        >
        <div className="flex items-center gap-4">
            <div className="p-3 bg-red-600/10 rounded-2xl group-hover:bg-red-600/20 transition-all">
            <Trash2 size={18} className="text-red-500" />
            </div>
            <div className="text-left">
            <p className="text-xs font-black uppercase text-red-500 tracking-widest">Excluir Conta</p>
            </div>
        </div>
        <ChevronRight size={16} className="text-red-900" />
        </button>
      </div>
    </div>
  );
};

const CountdownUnit: React.FC<{ value: number, label: string }> = ({ value, label }) => (
    <div className="flex-1 bg-black/40 backdrop-blur-md rounded-xl p-2 text-center border border-white/10">
        <span className="block text-xl font-black f1-font text-white leading-none mb-1">{value < 10 ? `0${value}` : value}</span>
        <span className="block text-[8px] font-bold uppercase text-gray-500 tracking-wider">{label}</span>
    </div>
);

export default Home;
