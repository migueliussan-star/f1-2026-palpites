
import React, { useState, useEffect } from 'react';
import { User, RaceGP } from '../types';
import { ChevronRight, Zap, Flag, Timer, Trophy, LogOut, UserMinus, AlertTriangle, Loader2, X } from 'lucide-react';

interface HomeProps {
  user: User;
  nextGP: RaceGP;
  predictionsCount: number;
  totalUsers: number;
  onNavigateToPredict: () => void;
  onLogout: () => void;
  onDeleteAccount: () => Promise<void>;
}

const Home: React.FC<HomeProps> = ({ user, nextGP, predictionsCount, totalUsers, onNavigateToPredict, onLogout, onDeleteAccount }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number }>({ d: 0, h: 0, m: 0, s: 0 });
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const dayStr = nextGP.date.split('-')[0];
      const monthStr = nextGP.date.split(' ')[1];
      const months: any = { 'Mar': 2, 'Abr': 3, 'Mai': 4, 'Jun': 5, 'Jul': 6, 'Ago': 7, 'Set': 8, 'Out': 9, 'Nov': 10, 'Dez': 11 };
      
      const targetDate = new Date(2026, months[monthStr] || 2, parseInt(dayStr));
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff > 0) {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: Math.floor((diff / 1000) % 60)
        });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [nextGP]);

  const handleFinalDeletion = async () => {
    setIsDeleting(true);
    await onDeleteAccount();
    // O App.tsx cuidará do logout
  };

  return (
    <div className="p-6">
      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1a1a1e] border border-red-900/30 rounded-[40px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            <h3 className="text-center text-xl font-black f1-font mb-4">VOCÊ TEM CERTEZA?</h3>
            <p className="text-center text-gray-400 text-sm mb-8">
              Isso apagará permanentemente seu progresso, ranking e todos os palpites da temporada 2026. <span className="text-red-500 font-bold uppercase underline">Não há volta!</span>
            </p>
            <div className="space-y-3">
              <button 
                onClick={handleFinalDeletion}
                disabled={isDeleting}
                className="w-full bg-red-600 text-white font-black py-5 rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 active:scale-95 transition-all"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={18} /> : 'SIM, APAGAR TUDO'}
              </button>
              <button 
                onClick={() => setShowConfirmModal(false)}
                disabled={isDeleting}
                className="w-full bg-white/5 text-gray-400 font-black py-5 rounded-2xl text-xs uppercase tracking-widest border border-white/5 active:scale-95 transition-all"
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#e10600] to-red-900 border-2 border-white/20 flex items-center justify-center shadow-lg relative">
            <span className="text-xl font-bold f1-font">{user.name.charAt(0).toUpperCase()}</span>
            {user.isAdmin && (
                <div className="absolute -top-1 -right-1 bg-yellow-500 p-1 rounded-full border border-black">
                    <Trophy size={8} className="text-black" />
                </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold">{user.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-400">{user.rank}º lugar</span>
              {user.isAdmin && <span className="text-[10px] bg-red-600/20 text-red-500 px-2 py-0.5 rounded-full font-black">ADMIN</span>}
            </div>
          </div>
        </div>
        <button onClick={onLogout} title="Sair do App" className="text-gray-600 hover:text-white transition-colors">
          <LogOut size={20} />
        </button>
      </div>

      <div className="bg-gradient-to-br from-[#1a1a1e] to-[#0a0a0c] rounded-[40px] p-8 mb-6 relative overflow-hidden border border-white/5 shadow-2xl">
        <div className="absolute -right-8 -bottom-8 opacity-5">
          <Flag size={200} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#e10600] text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
              <Timer size={14} /> PRÓXIMO GP
            </span>
            <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-tighter ${nextGP.status === 'OPEN' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                {nextGP.status === 'OPEN' ? 'Inscrições Abertas' : 'GP Encerrado'}
            </span>
          </div>
          
          <h2 className="text-3xl font-black f1-font tracking-tight mb-2 leading-none">{nextGP.name.toUpperCase()}</h2>
          <p className="text-gray-400 text-xs font-medium mb-8 uppercase tracking-widest">{nextGP.date} • {nextGP.location.toUpperCase()}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                <p className="text-2xl font-black f1-font text-white">{predictionsCount}</p>
                <p className="text-[8px] uppercase text-gray-500 font-bold tracking-widest">Seus Palpites</p>
            </div>
            <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                <p className="text-2xl font-black f1-font text-white">{timeLeft.d}d {timeLeft.h}h</p>
                <p className="text-[8px] uppercase text-gray-500 font-bold tracking-widest">Restantes</p>
            </div>
          </div>

          <button 
            onClick={onNavigateToPredict}
            className="w-full bg-[#e10600] text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-red-600/30 text-xs uppercase tracking-widest"
          >
            {nextGP.status === 'OPEN' ? 'PALPITAR AGORA' : 'VER MEUS PALPITES'} <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-12">
        <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 shadow-inner">
          <Zap className="text-yellow-500 mb-3" size={24} />
          <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-1">Pontuação</p>
          <p className="text-2xl font-black f1-font">{user.points || 0}</p>
        </div>
        <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 shadow-inner">
          <Trophy className="text-[#e10600] mb-3" size={24} />
          <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-1">Ranking</p>
          <p className="text-2xl font-black f1-font">{user.rank}º</p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-8 pt-8 border-t border-white/5 pb-24">
        <div className="flex items-center gap-2 mb-4 text-gray-600">
            <AlertTriangle size={14} />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Zona de Segurança</h3>
        </div>
        <button 
            onClick={() => setShowConfirmModal(true)}
            className="w-full bg-red-900/10 border border-red-900/20 text-red-500 py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
        >
            <UserMinus size={16} /> Sair e Apagar meus Dados
        </button>
        <p className="text-center text-[8px] text-gray-700 mt-3 font-bold uppercase tracking-tight">
            * Seus pontos e ranking serão deletados permanentemente.
        </p>
      </div>
    </div>
  );
};

export default Home;
