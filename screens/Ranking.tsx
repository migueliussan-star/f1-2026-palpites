
import React, { useState } from 'react';
import { User as UserType, RaceGP } from '../types';
import { ChevronUp, ChevronDown, Minus } from 'lucide-react';

interface RankingProps {
  currentUser: UserType;
  users: UserType[];
  calendar: RaceGP[];
}

const Ranking: React.FC<RankingProps> = ({ currentUser, users, calendar }) => {
  const [activeFilter, setActiveFilter] = useState<'geral' | 'gp'>('geral');
  const [selectedGpId, setSelectedGpId] = useState<number>(calendar[0]?.id || 1);

  // Ordena os usuários reais por pontos
  const sortedUsers = [...users].sort((a, b) => (b.points || 0) - (a.points || 0));
  const leaderPoints = sortedUsers[0]?.points || 0;

  return (
    <div className="p-6 lg:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <h2 className="text-2xl font-black f1-font">RANKING</h2>
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {['geral', 'gp'].map((f) => (
                <button 
                key={f}
                onClick={() => setActiveFilter(f as any)}
                className={`px-5 py-2 rounded-full text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeFilter === f ? 'bg-[#e10600] text-white shadow-lg shadow-red-600/20' : 'bg-white/5 text-gray-500'}`}
                >
                {f === 'gp' ? 'Por GP' : f}
                </button>
            ))}
            </div>

            {activeFilter === 'gp' && (
                <div className="mt-4 animate-in slide-in-from-top duration-300">
                    <select 
                        value={selectedGpId}
                        onChange={(e) => setSelectedGpId(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold outline-none focus:border-[#e10600]"
                    >
                        {calendar.map(gp => (
                            <option key={gp.id} value={gp.id}>{gp.name}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>

        {/* Lista de Ranking */}
        <div className="bg-white/5 rounded-[32px] overflow-hidden border border-white/10 shadow-2xl mb-24">
            {sortedUsers.length === 0 ? (
            <div className="p-16 text-center text-gray-600 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                Nenhum competidor <br/> cadastrado ainda.
            </div>
            ) : (
            sortedUsers.map((item, idx) => {
                // Cálculo de Gap (Pontos atrás do próximo)
                const pointsDiff = idx === 0 ? 0 : (sortedUsers[idx-1].points || 0) - (item.points || 0);
                // Cálculo de Gap para o LÍDER
                const diffToLeader = leaderPoints - (item.points || 0);
                
                // Cálculo de Posições Ganhas (Mock se não tiver histórico real)
                const prevRank = item.previousRank || (item.points ? idx + 2 : idx + 1); 
                const rankChange = prevRank - (idx + 1);

                return (
                <div 
                    key={item.id} 
                    className={`flex items-center justify-between p-4 px-6 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${item.id === currentUser.id ? 'bg-[#e10600]/10 border-l-4 border-l-[#e10600]' : ''}`}
                >
                    <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center w-6">
                            <span className={`text-center font-black f1-font text-lg ${idx + 1 <= 3 ? 'text-yellow-500' : 'text-gray-500'}`}>
                            {idx + 1}
                            </span>
                            {/* Indicador de Mudança de Posição */}
                            <div className="flex items-center justify-center">
                                {rankChange > 0 ? (
                                    <div className="flex items-center text-green-500 text-[8px] font-bold"><ChevronUp size={10} /> {rankChange}</div>
                                ) : rankChange < 0 ? (
                                    <div className="flex items-center text-red-500 text-[8px] font-bold"><ChevronDown size={10} /> {Math.abs(rankChange)}</div>
                                ) : (
                                    <Minus size={8} className="text-gray-600" />
                                )}
                            </div>
                    </div>
                    
                    <div className="flex flex-col">
                        <span className="font-bold text-sm tracking-tight truncate max-w-[120px] md:max-w-[300px]">{item.name}</span>
                        {item.isAdmin && (
                            <span className="text-[9px] font-black uppercase tracking-tighter text-red-500">
                            Admin
                            </span>
                        )}
                    </div>
                    </div>
                    
                    <div className="text-right">
                    <p className="text-xl font-black f1-font leading-none">{item.points || 0}</p>
                    {/* GAPS */}
                    {idx > 0 ? (
                        <div className="flex flex-col items-end">
                            <p className="text-[9px] text-red-400/60 font-bold uppercase tracking-tight mt-0.5">
                                GAP -{pointsDiff}
                            </p>
                            <p className="text-[9px] text-orange-500 font-black uppercase tracking-tight leading-none mt-0.5">
                                LÍDER -{diffToLeader}
                            </p>
                        </div>
                    ) : (
                        <p className="text-[9px] text-yellow-500 font-bold uppercase tracking-tight mt-0.5">LÍDER</p>
                    )}
                    </div>
                </div>
                );
            })
            )}
        </div>
      </div>
    </div>
  );
};

export default Ranking;
