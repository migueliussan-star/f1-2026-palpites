import React, { useState, useEffect } from 'react';
import { User, RaceGP } from '../types';
import { ChevronRight, Zap, Flag, Timer, Trophy, LogOut, Smartphone, ShieldCheck } from 'lucide-react';

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
  user, nextGP, predictionsCount, onNavigateToPredict, onLogout, hasNoAdmin, onClaimAdmin, canInstall, onInstall 
}) => {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(!!standalone);

    const interval = setInterval(() => {
      // Data alvo da primeira corrida de 2026 (Austrália)
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

  return (
    <div className="p-6">
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
        <button onClick={onLogout} className="text-gray-600 hover:text-white transition-colors"><LogOut size={20} /></button>
      </div>

      {/* Banner de Instalação Real (PWA) */}
      {!isStandalone && (
        <div className="mb-6 bg-gradient-to-r from-blue-600/20 to-blue-900/20 border border-blue-600/30 p-5 rounded-[32px] animate-in slide-in-from-top duration-500">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Smartphone className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-white tracking-widest mb-1">Transformar em App</p>
                <p className="text-[9px] text-blue-200/60 font-bold uppercase leading-tight">Remova a barra do navegador e acesse direto da tela inicial.</p>
              </div>
           </div>
           
           <button 
             onClick={onInstall}
             className={`w-full mt-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
               canInstall 
               ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 active:scale-95' 
               : 'bg-white/5 text-gray-500 border border-white/5 cursor-default'
             }`}
           >
             {canInstall ? 'INSTALAR APLICATIVO AGORA' : 'AGUARDANDO NAVEGADOR...'}
           </button>
           
           {!canInstall && (
             <p className="text-[8px] text-gray-500 mt-3 text-center uppercase font-bold">
               Se o botão não ativar, use: <span className="text-white">Menu &gt; Instalar Aplicativo</span>
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
    </div>
  );
};

export default Home;