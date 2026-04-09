
import React, { useState } from 'react';
import { User as UserType, RaceGP, Team, Prediction, SessionType } from '../types';
import { TEAM_COLORS } from '../constants';
import { ChevronUp, ChevronDown, Minus, BarChart3 } from 'lucide-react';

interface RankingProps {
  currentUser: UserType;
  users: UserType[];
  calendar: RaceGP[];
  constructorsList: Team[];
  predictions?: Prediction[];
  onNavigateToPerformance?: () => void;
}

const Ranking: React.FC<RankingProps> = ({ currentUser, users, calendar, constructorsList, predictions = [], onNavigateToPerformance }) => {
  const [selectedGpId, setSelectedGpId] = useState<number | 'global'>('global');

  // Ordena os usuários reais por pontos
  const sortedUsers = [...users].sort((a, b) => (b.points || 0) - (a.points || 0));
  const leaderPoints = sortedUsers[0]?.points || 0;

  // Lógica para ranking por GP
  const getGpRanking = (gpId: number) => {
    const gp = calendar.find(c => c.id === gpId);
    if (!gp || !gp.results) return [];

    const gpPointsMap: Record<string, number> = {};
    users.forEach(u => {
      gpPointsMap[u.id] = 0;
      if (u.invalidatedGPs?.includes(gpId)) return;

      const sessions: SessionType[] = gp.isSprint 
        ? ['Qualy Sprint', 'corrida Sprint', 'Qualy corrida', 'corrida principal'] 
        : ['Qualy corrida', 'corrida principal'];
      
      sessions.forEach(session => {
         const officialResult = gp.results?.[session];
         if (!officialResult) return;
         const pred = predictions.find(p => p.gpId === gpId && p.userId === u.id && p.session === session);
         if (pred) {
            (pred.top5 || []).forEach((driverId, idx) => {
               if (driverId === officialResult[idx]) gpPointsMap[u.id] += 5;
               else if (officialResult.includes(driverId)) gpPointsMap[u.id] += 1;
            });
         }
      });
    });

    return users.map(u => ({
      ...u,
      gpPoints: gpPointsMap[u.id] || 0
    })).sort((a, b) => b.gpPoints - a.gpPoints) as (UserType & { gpPoints: number })[];
  };

  const currentRanking = selectedGpId === 'global' ? sortedUsers : getGpRanking(selectedGpId);
  const currentLeaderPoints = selectedGpId === 'global' ? leaderPoints : ((currentRanking[0] as any)?.gpPoints || 0);

  return (
    <div className="p-6 lg:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-3xl font-black f1-font uppercase italic tracking-tighter text-gray-900 dark:text-white">
                    {selectedGpId === 'global' ? 'RANKING' : `RANKING: ${calendar.find(c => c.id === selectedGpId)?.name}`}
                </h2>
                <div className="h-1 w-20 bg-[#e10600] mt-2 rounded-full shadow-[0_0_10px_#e10600]"></div>
            </div>
            
            <select 
                value={selectedGpId}
                onChange={(e) => setSelectedGpId(e.target.value === 'global' ? 'global' : Number(e.target.value))}
                className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-[#e10600] focus:border-[#e10600] block p-2.5 font-bold outline-none"
            >
                <option value="global">Ranking</option>
                {calendar.filter(gp => gp.results).map(gp => (
                    <option key={gp.id} value={gp.id}>{gp.name}</option>
                ))}
            </select>
        </div>

        {/* Lista de Ranking */}
        <div className="bg-white dark:bg-white/5 rounded-[32px] overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl mb-6 transition-colors">
            {currentRanking.length === 0 ? (
            <div className="p-16 text-center text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                Nenhum competidor <br/> cadastrado ainda.
            </div>
            ) : (
            currentRanking.map((item, idx) => {
                const itemPoints = selectedGpId === 'global' ? (item.points || 0) : (item as any).gpPoints;
                const prevItemPoints = idx === 0 ? 0 : (selectedGpId === 'global' ? (currentRanking[idx-1].points || 0) : (currentRanking[idx-1] as any).gpPoints);
                
                // Cálculo de Gap (Pontos atrás do próximo)
                const pointsDiff = idx === 0 ? 0 : prevItemPoints - itemPoints;
                // Cálculo de Gap para o LÍDER
                const diffToLeader = currentLeaderPoints - itemPoints;
                
                // Cálculo de Posições Ganhas (Mock se não tiver histórico real)
                const prevRank = item.previousRank || (itemPoints ? idx + 2 : idx + 1); 
                const rankChange = selectedGpId === 'global' ? (prevRank - (idx + 1)) : 0; // Não mostra mudança de rank no GP específico por enquanto

                // --- Lógica de Equipe ---
                // Encontra o index real do usuário na lista original para manter a mesma equipe
                const originalIdx = sortedUsers.findIndex(u => u.id === item.id);
                const rankPosition = Math.max(0, originalIdx);
                const driversPerTeam = sortedUsers.length > 12 ? 2 : 1;
                const driverPosition = (rankPosition % driversPerTeam) + 1;
                const teamIndex = Math.floor(rankPosition / driversPerTeam);
                const assignedTeam = teamIndex < constructorsList.length - 1 
                  ? constructorsList[teamIndex] 
                  : constructorsList[constructorsList.length - 1] || 'Safety Car';
                const teamColor = TEAM_COLORS[assignedTeam] || '#666';

                return (
                <div 
                    key={item.id} 
                    className={`flex items-center justify-between p-4 px-6 border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors relative overflow-hidden group ${item.id === currentUser.id ? 'bg-red-50 dark:bg-[#e10600]/10' : ''}`}
                >
                    {/* Barra de Cor da Equipe à esquerda */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundImage: `linear-gradient(to bottom, ${teamColor}, transparent)` }}></div>

                    <div className="flex items-center gap-4 pl-2">
                        <div className="flex flex-col items-center w-6 shrink-0">
                                <span className={`text-center font-black f1-font text-lg ${idx + 1 <= 3 ? 'text-yellow-600 dark:text-yellow-500' : 'text-gray-400 dark:text-gray-500'}`}>
                                {idx + 1}º
                                </span>
                                {/* Indicador de Mudança de Posição */}
                                {selectedGpId === 'global' && (
                                    <div className="flex items-center justify-center">
                                        {rankChange > 0 ? (
                                            <div className="flex items-center text-green-600 dark:text-green-500 text-[8px] font-bold"><ChevronUp size={10} /> {rankChange}</div>
                                        ) : rankChange < 0 ? (
                                            <div className="flex items-center text-red-600 dark:text-red-500 text-[8px] font-bold"><ChevronDown size={10} /> {Math.abs(rankChange)}</div>
                                        ) : (
                                            <Minus size={8} className="text-gray-400 dark:text-gray-600" />
                                        )}
                                    </div>
                                )}
                        </div>

                        {/* Avatar no Ranking */}
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200 dark:border-white/5">
                             {item.avatarUrl ? (
                                <img src={item.avatarUrl} alt={item.name} className="w-full h-full object-cover" />
                             ) : (
                                <span className="text-xs font-bold text-gray-500">{item.name.charAt(0).toUpperCase()}</span>
                             )}
                        </div>
                        
                        <div className="flex flex-col">
                            <span className="font-bold text-sm tracking-tight truncate max-w-[120px] md:max-w-[300px] text-gray-900 dark:text-white flex items-center gap-2">
                                {item.name}
                                {item.isAdmin && (
                                    <span className="text-[9px] bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 px-1.5 rounded font-black uppercase tracking-tighter">
                                    ADM
                                    </span>
                                )}
                            </span>
                            
                            {/* Informações da Equipe */}
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: teamColor }}>
                                    {assignedTeam}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="text-right">
                    <p className="text-xl font-black f1-font leading-none text-gray-900 dark:text-white">{itemPoints}</p>
                    {/* GAPS */}
                    {idx > 0 ? (
                        <div className="flex flex-col items-end">
                            <p className="text-[9px] text-red-500 dark:text-red-400/60 font-bold uppercase tracking-tight mt-0.5">
                                GAP -{pointsDiff}
                            </p>
                            <p className="text-[9px] text-orange-500 font-black uppercase tracking-tight leading-none mt-0.5">
                                LÍDER -{diffToLeader}
                            </p>
                        </div>
                    ) : (
                        <p className="text-[9px] text-yellow-600 dark:text-yellow-500 font-bold uppercase tracking-tight mt-0.5">LÍDER</p>
                    )}
                    </div>
                </div>
                );
            })
            )}
        </div>
        {/* MOBILE ONLY: Botão de Desempenho */}
        {onNavigateToPerformance && (
          <div className="md:hidden mb-24">
            <button
              onClick={onNavigateToPerformance}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-between px-6 py-5 shadow-xl shadow-blue-900/30 active:scale-95 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <BarChart3 size={18} />
                </div>
                <div className="text-left">
                  <p className="font-black text-sm leading-none">Meu Desempenho</p>
                  <p className="text-[10px] text-white/70 font-medium normal-case tracking-normal mt-0.5">Ver histórico e estatísticas</p>
                </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ranking;
