
import React, { useState } from 'react';
import { User, RaceGP, Prediction, SessionType } from '../types';
import { DRIVERS, FALLBACK_IMG } from '../constants';
import { Lock, Eye, ShieldAlert, Swords } from 'lucide-react';

interface AdversariosProps {
  gp: RaceGP;
  users: User[];
  predictions: Prediction[];
  currentUser: User;
}

const Adversarios: React.FC<AdversariosProps> = ({ gp, users, predictions, currentUser }) => {
  const sessions: SessionType[] = gp.isSprint 
    ? ['Qualy Sprint', 'corrida Sprint', 'Qualy corrida', 'corrida principal'] 
    : ['Qualy corrida', 'corrida principal'];

  const [activeSession, setActiveSession] = useState<SessionType>(sessions[0]);
  const isSessionOpen = gp.sessionStatus[activeSession] !== false; // Se true, está aberto. Se false, fechado (travado).

  // Ordena usuários pelo Ranking (quem tem mais pontos aparece primeiro)
  const sortedUsers = [...users].sort((a, b) => (b.points || 0) - (a.points || 0));

  return (
    <div className="p-6 lg:p-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-purple-600/20 p-2 rounded-xl">
            <Swords className="text-purple-500" size={24} />
        </div>
        <div>
            <h2 className="text-2xl font-black f1-font uppercase leading-none">Adversários</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Espionagem de Grid</p>
        </div>
      </div>

      {/* Seletor de Sessão */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {sessions.map((s) => (
          <button
            key={s}
            onClick={() => setActiveSession(s)}
            className={`whitespace-nowrap px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
              activeSession === s 
                ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/20' 
                : 'bg-white/5 text-gray-400 border-white/5'
            }`}
          >
            {s}
            {gp.sessionStatus[s] === false ? <Lock size={12} className="text-red-400"/> : <ShieldAlert size={12} className="text-green-400"/>}
          </button>
        ))}
      </div>

      {isSessionOpen ? (
        // TELA DE BLOQUEIO (ANTI-COLA)
        <div className="flex flex-col items-center justify-center py-24 px-4 bg-white/5 border border-white/5 rounded-[32px] text-center max-w-2xl mx-auto">
            <div className="bg-white/5 p-8 rounded-full mb-6 relative">
                <Lock size={64} className="text-gray-500" />
                <div className="absolute top-0 right-0 bg-red-600 rounded-full p-2 animate-pulse">
                    <ShieldAlert size={20} className="text-white" />
                </div>
            </div>
            <h3 className="text-2xl font-black f1-font uppercase mb-4">Sessão Aberta</h3>
            <p className="text-sm text-gray-400 font-medium max-w-md leading-relaxed">
                Os palpites dos adversários estão ocultos para evitar cópias. 
                <br/><br/>
                <span className="text-white font-bold">O Grid será revelado assim que o Admin fechar as apostas.</span>
            </p>
        </div>
      ) : (
        // LISTA DE ADVERSÁRIOS (SESSÃO FECHADA) - GRID RESPONSIVO
        <div className="space-y-4 pb-24">
            <div className="flex items-center gap-2 mb-4 px-2">
                <Eye size={14} className="text-green-500" />
                <span className="text-[10px] uppercase font-black text-green-500 tracking-widest">Apostas reveladas - Boa sorte!</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sortedUsers.map((user) => {
                    const userPred = predictions.find(p => p.gpId === gp.id && p.session === activeSession && p.userId === user.id);
                    const isMe = user.id === currentUser.id;

                    return (
                        <div key={user.id} className={`rounded-2xl border p-5 transition-all hover:scale-[1.01] ${isMe ? 'bg-purple-600/10 border-purple-600/50' : 'bg-white/5 border-white/5'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black f1-font ${isMe ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-400'}`}>
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${isMe ? 'text-purple-400' : 'text-gray-200'}`}>{user.name} {isMe && '(Você)'}</p>
                                        <p className="text-[9px] text-gray-500 uppercase font-black">
                                            {user.points || 0} pts
                                        </p>
                                    </div>
                                </div>
                                {!userPred && <span className="text-[8px] bg-red-500/10 text-red-500 px-2 py-1 rounded-full font-black uppercase">Não apostou</span>}
                            </div>

                            {userPred ? (
                                <div className="grid grid-cols-5 gap-2">
                                    {userPred.top5.map((driverId, idx) => {
                                        const driver = DRIVERS.find(d => d.id === driverId);
                                        return (
                                            <div key={idx} className="flex flex-col items-center gap-1.5 group">
                                                <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/5 overflow-hidden relative">
                                                    <div className="absolute top-0 right-0 w-full h-1 opacity-60 z-10" style={{ backgroundColor: driver?.color || '#333' }} />
                                                    {driver ? (
                                                        <img 
                                                            src={driver.image} 
                                                            className={`w-full h-full ${driver.isCutout !== false ? 'object-cover object-top scale-125 translate-y-2' : 'object-cover object-center scale-100'}`}
                                                            alt={driver.name} 
                                                            onError={(e) => { 
                                                                e.currentTarget.onerror = null;
                                                                e.currentTarget.src = FALLBACK_IMG;
                                                            }} 
                                                        />
                                                    ) : null}
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-center font-bold text-gray-300 py-0.5 backdrop-blur-sm truncate">
                                                        {driver?.name.split(' ').pop()?.substring(0, 3)}
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-black text-gray-500">{idx + 1}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="h-12 bg-black/20 rounded-lg flex items-center justify-center border border-white/5 border-dashed">
                                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Sem palpite registrado</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
      )}
    </div>
  );
};

export default Adversarios;
