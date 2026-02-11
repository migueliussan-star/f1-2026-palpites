
import React, { useState, useEffect } from 'react';
import { User, RaceGP, Team } from '../types';
import { INITIAL_CALENDAR, TEAM_COLORS } from '../constants';
import { ChevronRight, Zap, Trophy, LogOut, MapPin, Download, CheckCircle2, Clock, Calendar, Flag, Car, Briefcase } from 'lucide-react';

interface HomeProps {
  user: User;
  nextGP: RaceGP;
  predictionsCount: number;
  onNavigateToPredict: () => void;
  onLogout: () => void;
  hasNoAdmin: boolean;
  onClaimAdmin: () => void;
  onTimerFinished?: () => void;
  constructorsList: Team[];
}

const Home: React.FC<HomeProps> = ({ 
  user, nextGP, predictionsCount, onNavigateToPredict, onLogout, hasNoAdmin, onClaimAdmin, onTimerFinished, constructorsList
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

  // --- Lógica de Contrato/Equipe ---
  const userRank = user.rank || 1;
  const teamIndex = Math.floor((userRank - 1) / 2);
  // Garante que não estoure o array se tiver muitos usuários
  const assignedTeam = constructorsList[teamIndex % constructorsList.length] || 'Williams'; 
  const teamColor = TEAM_COLORS[assignedTeam] || '#666';
  const isLeadDriver = (userRank - 1) % 2 === 0;

  useEffect(() => {
    // Função para encontrar a próxima sessão
    const getNextSession = () => {
      // Tenta usar as sessões do objeto nextGP (vindo do DB). 
      // Se não existir, busca no INITIAL_CALENDAR local para garantir que tenhamos os horários corretos (TL1, TL2, etc)
      // FIX: Comparação robusta de ID (String vs Number)
      const sessionData = nextGP.sessions || INITIAL_CALENDAR.find(c => String(c.id) === String(nextGP.id))?.sessions;

      if (!sessionData) {
        // Fallback antigo apenas se realmente não encontrar nada em lugar nenhum
        try {
           const months: { [key: string]: number } = {
            'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
            'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
          };
           const parts = nextGP.date.trim().split(' ');
           const daysPart = parts[0]; 
           const monthPart = parts[1].toLowerCase().substring(0, 3);
           const monthIndex = months[monthPart] ?? 0;
           let endDay = 1;
           if (daysPart.includes('-')) {
              const range = daysPart.split('-');
              endDay = parseInt(range[1]);
           } else {
              endDay = parseInt(daysPart);
           }
           return {
             name: 'Evento Principal',
             date: new Date(2026, monthIndex, endDay, 23, 59, 59)
           };
        } catch(e) { return null; }
      }

      const now = new Date();
      
      // Converte o objeto de sessões em array ordenado por data
      const sessionList = Object.entries(sessionData).map(([name, isoDate]) => ({
        name,
        date: new Date(isoDate as string)
      })).sort((a, b) => a.date.getTime() - b.date.getTime());

      // Encontra a primeira sessão que ainda não aconteceu (data futura)
      const next = sessionList.find(s => s.date > now);
      
      // Se tiver próxima, retorna. Se não, retorna a última (indicando fim)
      return next || { name: 'Grande Prêmio Finalizado', date: sessionList[sessionList.length-1].date };
    };

    let targetSession = getNextSession();
    
    // Timer do Countdown
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
        if (currentTarget.name === 'Grande Prêmio Finalizado' && onTimerFinished) {
            onTimerFinished();
        }
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
  }, [nextGP, onTimerFinished]);

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
    <div className="p-6 pt-10 lg:p-12">
      {/* Header Profile */}
      <div className="flex items-center justify-between mb-8 animate-enter">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#e10600] to-orange-600 p-[2px] shadow-lg shadow-red-900/20">
            <div className="w-full h-full rounded-full bg-[#0a0a0c] flex items-center justify-center relative">
               <span className="text-xl font-bold f1-font text-white">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            {user.isAdmin && <div className="absolute -top-1 -right-1 bg-yellow-400 text-black p-1 rounded-full border-2 border-[#0a0a0c]"><Trophy size={10} /></div>}
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-0.5">
               Bem-vindo,
            </p>
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

      {/* --- GRID SYSTEM PARA RESPONSIVIDADE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Main GP Card - Ocupa 2 colunas no desktop */}
        <div className="lg:col-span-2 relative w-full aspect-[4/5] md:aspect-[16/9] lg:aspect-[16/8] max-h-[500px] rounded-[40px] overflow-hidden shadow-2xl group animate-enter transition-all duration-500 border border-white/5" style={{animationDelay: '0.2s'}}>
            {/* Background Image / Gradient */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1535136829775-7b3b3d81b947?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-[#0a0a0c]/80 to-transparent"></div>
            <div className={`absolute inset-0 bg-gradient-to-b ${cardOverlayClass} transition-colors duration-500`}></div>

            <div className="absolute inset-0 p-8 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${statusColor} animate-pulse`}></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{statusText}</span>
                    </div>
                    <div className="text-right">
                        <p className="text-4xl lg:text-5xl font-black f1-font leading-none mb-1">{nextGP.id}</p>
                        <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Round</p>
                    </div>
                </div>

                <div className="space-y-6 lg:flex lg:items-end lg:justify-between lg:space-y-0">
                    <div className="lg:mb-0">
                        <div className={`flex items-center gap-2 mb-2 transition-colors ${isComplete ? 'text-lime-400' : isPartial ? 'text-yellow-400' : 'text-[#e10600]'}`}>
                            <MapPin size={16} />
                            <span className="text-xs font-black uppercase tracking-widest">{nextGP.location}</span>
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black f1-font uppercase italic leading-none">{nextGP.name}</h2>
                        <p className="text-sm font-medium text-gray-300 mt-2 flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400"/> {nextGP.date}
                        </p>
                    </div>

                    <div className="lg:w-1/2 space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1">
                                    <Clock size={10} /> Próxima Sessão:
                                </p>
                                <span className="text-[10px] font-black uppercase text-white bg-white/10 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                                {nextSessionName || 'Carregando...'}
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <CountdownUnit value={timeLeft.d} label="Dias" />
                                <CountdownUnit value={timeLeft.h} label="Hrs" />
                                <CountdownUnit value={timeLeft.m} label="Min" />
                                <CountdownUnit value={timeLeft.s} label="Seg" />
                            </div>
                        </div>

                        <button 
                            onClick={onNavigateToPredict} 
                            className={`w-full font-black py-5 lg:py-4 rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all text-xs uppercase tracking-widest border border-white/20 ${buttonClass}`}
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
        </div>

        {/* Stats Column - Ocupa 1 coluna no desktop, abaixo no mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 content-start animate-enter" style={{animationDelay: '0.3s'}}>
            
            {/* NOVO: CARD DE CONTRATO/EQUIPE */}
            <div className="col-span-2 glass-card p-6 rounded-[32px] relative overflow-hidden group border border-white/5">
                <div className="absolute right-0 top-0 bottom-0 w-24 opacity-10 bg-gradient-to-l from-current to-transparent" style={{ color: teamColor }} />
                
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-white/5">
                        <Briefcase className="text-white" size={20} />
                    </div>
                    <div>
                         <p className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Contrato Atual</p>
                         <h3 className="text-lg font-black f1-font uppercase" style={{ color: teamColor }}>{assignedTeam}</h3>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                        {isLeadDriver ? <Flag className="text-yellow-500" size={16} /> : <Car className="text-gray-400" size={16} />}
                        <span className={`text-xs font-bold uppercase ${isLeadDriver ? 'text-yellow-500' : 'text-gray-400'}`}>
                            {isLeadDriver ? '1º Piloto' : '2º Piloto'}
                        </span>
                    </div>
                    {isLeadDriver && (
                        <span className="text-[8px] bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded-full font-black uppercase tracking-wider">
                            Team Leader
                        </span>
                    )}
                </div>
            </div>

            <div className="glass-card p-6 rounded-[32px] relative overflow-hidden group h-full">
                <div className="absolute -right-4 -top-4 bg-yellow-500/10 w-24 h-24 rounded-full blur-xl group-hover:bg-yellow-500/20 transition-all"></div>
                <Zap className="text-yellow-500 mb-4" size={28} />
                <p className="text-3xl lg:text-4xl font-black f1-font text-white mb-1">{user.points || 0}</p>
                <p className="text-xs uppercase text-gray-500 font-black tracking-widest">Pontos Totais</p>
            </div>
            
            <div className="glass-card p-6 rounded-[32px] relative overflow-hidden group h-full">
                <div className="absolute -right-4 -top-4 bg-blue-500/10 w-24 h-24 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
                <Trophy className="text-blue-500 mb-4" size={28} />
                <p className="text-3xl lg:text-4xl font-black f1-font text-white mb-1">{user.rank > 0 && !user.isGuest ? `${user.rank}º` : '-'}</p>
                <p className="text-xs uppercase text-gray-500 font-black tracking-widest">Ranking Global</p>
            </div>

            {/* Install Box for Desktop (Hidden) / Mobile */}
            {(deferredPrompt || isIOS) && (
                <div className="col-span-2 lg:col-span-1 p-[2px] rounded-[24px] bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 mt-2">
                    <div className="bg-[#0a0a0c] rounded-[22px] p-6 relative overflow-hidden">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-white/10 rounded-xl">
                                <Download size={20} className="text-white"/>
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase">Instalar App</h3>
                                <p className="text-[10px] text-gray-400 font-bold">Acesso rápido</p>
                            </div>
                        </div>

                        {deferredPrompt ? (
                            <button 
                                onClick={handleInstallClick}
                                className="w-full bg-white text-black font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                            >
                                INSTALAR
                            </button>
                        ) : (
                            <div className="text-[10px] text-gray-400">
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

const CountdownUnit: React.FC<{ value: number, label: string }> = ({ value, label }) => (
    <div className="flex-1 bg-black/40 backdrop-blur-md rounded-xl p-2 text-center border border-white/10">
        <span className="block text-xl lg:text-2xl font-black f1-font text-white leading-none mb-1">{value < 10 ? `0${value}` : value}</span>
        <span className="block text-[8px] font-bold uppercase text-gray-500 tracking-wider">{label}</span>
    </div>
);

export default Home;
