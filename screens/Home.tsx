
import React, { useState, useEffect } from 'react';
import { User, RaceGP, Team } from '../types';
import { INITIAL_CALENDAR, TEAM_COLORS } from '../constants';
import { ChevronRight, Zap, Trophy, LogOut, MapPin, Download, CheckCircle2, Clock, Briefcase } from 'lucide-react';

interface HomeProps {
  user: User;
  nextGP: RaceGP;
  predictionsCount: number;
  onNavigateToPredict: () => void;
  onLogout: () => void;
  hasNoAdmin: boolean;
  onClaimAdmin: () => void;
  constructorsList: Team[];
}

const Home: React.FC<HomeProps> = ({ 
  user, nextGP, predictionsCount, onNavigateToPredict, onLogout, hasNoAdmin, onClaimAdmin, constructorsList
}) => {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [nextSessionName, setNextSessionName] = useState<string>('');
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
    cardOverlayClass = "from-lime-600/80 to-lime-900/90 mix-blend-multiply"; 
    statusText = "Completo";
    statusColor = "bg-lime-400";
    buttonClass = "bg-lime-400 text-black shadow-[0_0_30px_rgba(163,230,53,0.6)] hover:bg-lime-300";
  } else if (isPartial) {
    cardOverlayClass = "from-yellow-500/30 to-yellow-600/10 mix-blend-normal"; 
    statusText = "Em andamento";
    statusColor = "bg-yellow-400";
    buttonClass = "bg-yellow-400 text-black shadow-[0_0_30px_rgba(250,204,21,0.4)] hover:bg-yellow-300";
  }

  // --- Lógica de Contrato/Equipe ---
  const userRank = user.rank || 1;
  const teamIndex = Math.floor((userRank - 1) / 2);
  const assignedTeam = constructorsList[teamIndex % constructorsList.length] || 'Williams'; 
  const teamColor = TEAM_COLORS[assignedTeam] || '#666';
  const isLeadDriver = (userRank - 1) % 2 === 0;
  
  // Limpeza visual forçada do nome da equipe
  const displayTeamName = assignedTeam.split('-')[0];

  useEffect(() => {
    const getNextSession = () => {
      const sessionData = nextGP.sessions || INITIAL_CALENDAR.find(c => String(c.id) === String(nextGP.id))?.sessions;
      if (!sessionData) return null;

      const now = new Date();
      const sessionList = Object.entries(sessionData).map(([name, isoDate]) => ({
        name,
        date: new Date(isoDate as string)
      })).sort((a, b) => a.date.getTime() - b.date.getTime());

      const next = sessionList.find(s => s.date > now);
      return next || { name: 'Finalizado', date: sessionList[sessionList.length-1].date };
    };

    const interval = setInterval(() => {
      const currentTarget = getNextSession();
      if (!currentTarget) return;

      setNextSessionName(currentTarget.name);
      const now = new Date();
      const diff = currentTarget.date.getTime() - now.getTime();
      
      if (diff > 0) {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: Math.floor((diff / 1000) % 60)
        });
      } else {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
      }
    }, 1000);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [nextGP]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
  };

  return (
    <div className="p-4 pt-6 lg:p-12 pb-32">
      {/* Header Compacto */}
      <div className="flex items-center justify-between mb-4 lg:mb-8 animate-enter">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-full bg-gradient-to-tr from-[#e10600] to-orange-600 p-[2px]">
            <div className="w-full h-full rounded-full bg-[#0a0a0c] flex items-center justify-center relative overflow-hidden">
               {user.avatarUrl ? (
                   <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
               ) : (
                   <span className="text-sm lg:text-xl font-bold f1-font text-white">{user.name.charAt(0).toUpperCase()}</span>
               )}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Bem-vindo,</p>
            <h1 className="text-lg lg:text-xl font-black text-white leading-none truncate max-w-[200px] lg:max-w-none">{user.name}</h1>
          </div>
        </div>
        <button onClick={onLogout} className="glass w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white active:scale-90 transition-all">
          <LogOut size={16} />
        </button>
      </div>

      {hasNoAdmin && !user.isAdmin && (
        <div className="mb-4 p-4 bg-amber-900/20 border border-amber-500/30 rounded-2xl animate-enter">
            <button onClick={onClaimAdmin} className="w-full text-amber-500 font-black text-[10px] uppercase tracking-widest">REIVINDICAR ADMIN</button>
        </div>
      )}

      {/* Grid Principal - 1 Coluna Mobile / 3 Colunas Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
        
        {/* GP CARD: 16:9 no Mobile / Grande (2 colunas) no Desktop */}
        <div className="lg:col-span-2 relative w-full aspect-[16/9] lg:aspect-[16/10] rounded-[24px] lg:rounded-[40px] overflow-hidden shadow-2xl group animate-enter border border-white/5" style={{animationDelay: '0.1s'}}>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1535136829775-7b3b3d81b947?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-[#0a0a0c]/60 to-transparent"></div>
            <div className={`absolute inset-0 bg-gradient-to-b ${cardOverlayClass} transition-colors duration-500`}></div>

            <div className="absolute inset-0 p-5 lg:p-8 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className="glass px-2.5 py-1.5 lg:px-4 lg:py-2 rounded-full flex items-center gap-1.5 lg:gap-2">
                        <div className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full ${statusColor} animate-pulse`}></div>
                        <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest">{statusText}</span>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl lg:text-5xl font-black f1-font leading-none">{nextGP.id}</p>
                        <p className="text-[8px] lg:text-[10px] font-bold uppercase text-gray-400 tracking-widest">Round</p>
                    </div>
                </div>

                <div className="flex lg:block items-end justify-between lg:items-start lg:justify-start lg:space-y-6">
                    <div className="lg:mb-0">
                        <div className={`flex items-center gap-1.5 lg:gap-2 mb-1 ${isComplete ? 'text-lime-400' : 'text-[#e10600]'}`}>
                            <MapPin size={12} className="lg:w-4 lg:h-4" />
                            <span className="text-[10px] lg:text-xs font-black uppercase tracking-widest">{nextGP.location}</span>
                        </div>
                        <h2 className="text-2xl lg:text-6xl font-black f1-font uppercase italic leading-none">{nextGP.name}</h2>
                        
                        {/* Countdown Mobile */}
                        <div className="flex lg:hidden items-center gap-2 mt-1">
                             <span className="text-[9px] font-bold text-gray-300 bg-black/40 px-2 py-0.5 rounded flex items-center gap-1">
                                <Clock size={8} /> {nextSessionName}
                             </span>
                             {timeLeft.d > 0 && <span className="text-[9px] font-mono text-gray-400">{timeLeft.d}d {timeLeft.h}h</span>}
                             {timeLeft.d === 0 && <span className="text-[9px] font-mono text-gray-400">{timeLeft.h}:{timeLeft.m}:{timeLeft.s}</span>}
                        </div>

                         {/* Countdown Desktop (Maior) */}
                        <div className="hidden lg:block mt-6">
                             <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 mb-2">
                                <Clock size={12} /> Próxima Sessão: <span className="text-white">{nextSessionName}</span>
                            </p>
                            <div className="flex gap-4 max-w-md">
                                <CountdownUnitDesktop value={timeLeft.d} label="Dias" />
                                <CountdownUnitDesktop value={timeLeft.h} label="Hrs" />
                                <CountdownUnitDesktop value={timeLeft.m} label="Min" />
                                <CountdownUnitDesktop value={timeLeft.s} label="Seg" />
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={onNavigateToPredict} 
                        className={`h-10 px-4 lg:w-full lg:h-auto lg:py-5 rounded-xl lg:rounded-3xl flex items-center justify-center gap-2 lg:gap-3 font-black text-[10px] lg:text-xs uppercase tracking-widest active:scale-95 transition-all ${buttonClass}`}
                    >
                        {isComplete ? (
                            <>PALPITES COMPLETOS <CheckCircle2 size={14} className="lg:w-5 lg:h-5" /></>
                        ) : (
                            <>FAZER PALPITE <ChevronRight size={14} className="lg:w-5 lg:h-5" /></>
                        )}
                    </button>
                </div>
            </div>
        </div>

        {/* STATS: Linha Horizontal (Mobile) / Coluna Vertical (Desktop) */}
        <div className="lg:col-span-1 grid grid-cols-3 gap-3 lg:grid-cols-1 lg:gap-4 content-start animate-enter" style={{animationDelay: '0.2s'}}>
            
            {/* 1. Contrato */}
            <div className="glass-card p-3 lg:p-6 rounded-2xl lg:rounded-[32px] relative overflow-hidden flex flex-col justify-center items-center lg:items-start text-center lg:text-left border border-white/5 lg:min-h-[140px]">
                <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-current to-transparent" style={{ color: teamColor }} />
                <div className="hidden lg:block p-2 rounded-xl bg-white/5 mb-3 w-max">
                     <Briefcase className="text-white" size={20} />
                </div>
                <Briefcase size={16} className="lg:hidden text-gray-400 mb-1" />
                
                <div className="w-full">
                    <p className="hidden lg:block text-[10px] uppercase text-gray-500 font-black tracking-widest mb-1">Contrato</p>
                    <h3 className="text-xs lg:text-xl font-black f1-font uppercase truncate w-full" style={{ color: teamColor }}>{displayTeamName}</h3>
                </div>
                
                <span className={`text-[8px] lg:text-[10px] font-bold uppercase mt-1 lg:mt-3 px-1.5 py-0.5 lg:px-2 lg:py-1 rounded-md ${isLeadDriver ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-700/30 text-gray-400'}`}>
                    {isLeadDriver ? '1º Piloto' : '2º Piloto'}
                </span>
            </div>

            {/* 2. Pontos */}
            <div className="glass-card p-3 lg:p-6 rounded-2xl lg:rounded-[32px] flex flex-col justify-center items-center lg:items-start text-center lg:text-left border border-white/5 lg:min-h-[140px] relative overflow-hidden group">
                <div className="hidden lg:block absolute -right-4 -top-4 bg-yellow-500/10 w-24 h-24 rounded-full blur-xl group-hover:bg-yellow-500/20 transition-all"></div>
                <Zap size={16} className="lg:hidden text-yellow-500 mb-1" />
                <div className="hidden lg:block mb-2">
                    <Zap className="text-yellow-500" size={28} />
                </div>
                <p className="text-xl lg:text-4xl font-black f1-font text-white leading-none">{user.points || 0}</p>
                <p className="text-[8px] lg:text-[10px] uppercase text-gray-500 font-black tracking-wider mt-1 lg:mt-2">Pontos Totais</p>
            </div>
            
            {/* 3. Ranking */}
            <div className="glass-card p-3 lg:p-6 rounded-2xl lg:rounded-[32px] flex flex-col justify-center items-center lg:items-start text-center lg:text-left border border-white/5 lg:min-h-[140px] relative overflow-hidden group">
                <div className="hidden lg:block absolute -right-4 -top-4 bg-blue-500/10 w-24 h-24 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
                <Trophy size={16} className="lg:hidden text-blue-500 mb-1" />
                <div className="hidden lg:block mb-2">
                    <Trophy className="text-blue-500" size={28} />
                </div>
                <p className="text-xl lg:text-4xl font-black f1-font text-white leading-none">{user.rank > 0 && !user.isGuest ? `${user.rank}º` : '-'}</p>
                <p className="text-[8px] lg:text-[10px] uppercase text-gray-500 font-black tracking-wider mt-1 lg:mt-2">Global</p>
            </div>

            {/* Install Box */}
            {(deferredPrompt || isIOS) && (
                <div className="col-span-3 lg:col-span-1 p-[1px] lg:p-[2px] rounded-[18px] lg:rounded-[24px] bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 mt-2 lg:mt-0">
                    <div className="bg-[#0a0a0c] rounded-[17px] lg:rounded-[22px] p-4 lg:p-6 flex lg:flex-col items-center lg:items-start justify-between lg:justify-center gap-3">
                        <div className="flex items-center gap-3">
                            <div className="lg:p-3 lg:bg-white/10 lg:rounded-xl">
                                <Download size={16} className="text-white lg:w-5 lg:h-5"/>
                            </div>
                            <div>
                                <h3 className="text-xs lg:text-sm font-black text-white uppercase">Instalar App</h3>
                                <p className="text-[8px] lg:text-[10px] text-gray-400 font-bold">Acesso rápido e offline</p>
                            </div>
                        </div>
                        {deferredPrompt ? (
                            <button 
                                onClick={handleInstallClick} 
                                className="bg-white text-black font-black px-3 py-1.5 lg:w-full lg:py-3 rounded-lg lg:rounded-xl text-[9px] lg:text-[10px] uppercase hover:bg-gray-200"
                            >
                                {isIOS ? 'VER COMO' : 'INSTALAR'}
                            </button>
                        ) : (
                             <div className="text-[8px] lg:text-[10px] text-gray-400 lg:mt-2">
                                Toque em <strong>Compartilhar</strong> e <strong>Adicionar à Tela de Início</strong>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// Countdown simplificado para Desktop
const CountdownUnitDesktop: React.FC<{ value: number, label: string }> = ({ value, label }) => (
    <div className="flex-1 bg-black/40 backdrop-blur-md rounded-xl p-2 text-center border border-white/10">
        <span className="block text-2xl font-black f1-font text-white leading-none mb-1">{value < 10 ? `0${value}` : value}</span>
        <span className="block text-[8px] font-bold uppercase text-gray-500 tracking-wider">{label}</span>
    </div>
);

export default Home;
