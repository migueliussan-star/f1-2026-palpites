
import React from 'react';
import { User } from '../types';
import { TrendingUp, Crown, Minus } from 'lucide-react';

interface StatsProps {
    currentUser: User;
    users: User[];
}

const Stats: React.FC<StatsProps> = ({ currentUser, users }) => {
  const sortedUsers = [...users].sort((a, b) => (b.points || 0) - (a.points || 0));
  const chartUsers = sortedUsers;

  const chartColors = [
    '#FFD700', '#E0E0E0', '#CD7F32', '#3b82f6', '#8b5cf6', 
    '#ec4899', '#10b981', '#f97316', '#06b6d4', '#ef4444', 
    '#84cc16', '#6366f1', '#d946ef', '#14b8a6', 
  ];

  const leadershipStats = users.map(u => {
      const weeksAtOne = (u.positionHistory || []).filter(p => p === 1).length;
      return { ...u, weeksAtOne };
  }).sort((a, b) => {
      if (b.weeksAtOne !== a.weeksAtOne) return b.weeksAtOne - a.weeksAtOne;
      return (b.points || 0) - (a.points || 0);
  });

  const maxWeeks = leadershipStats[0]?.weeksAtOne || 1;

  const rowCount = Math.max(users.length, 2);
  
  // Melhorando a escala para poucos usuários
  const getYPercent = (rank: number) => {
    if (rowCount <= 1) return 50;
    const safeRank = Math.min(Math.max(rank, 1), rowCount); 
    
    // Margens maiores para centralizar mais
    const margin = 20; 
    const availableSpace = 100 - (margin * 2); 
    const step = availableSpace / (rowCount - 1);
    
    return margin + ((safeRank - 1) * step);
  };

  return (
    <div className="p-6 pb-32">
      <div className="flex items-center gap-4 mb-8">
          <div className="bg-blue-100 dark:bg-blue-600/20 p-3 rounded-2xl border border-blue-200 dark:border-blue-600/30">
               <TrendingUp className="text-blue-600 dark:text-blue-500" size={24} />
          </div>
          <div>
               <h2 className="text-3xl font-black f1-font uppercase leading-none tracking-tighter text-gray-900 dark:text-white">Dominância</h2>
               <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">Tendência Global ({users.length} Pilotos)</p>
          </div>
      </div>

      {/* Gráfico de Tendência */}
      <div className="bg-white dark:bg-[#0f0f11] rounded-[32px] p-6 border border-gray-200 dark:border-white/5 shadow-2xl mb-10 transition-colors">
        
        <div className="h-80 w-full relative flex select-none">
            
            {/* Eixo Y */}
            <div className="flex flex-col w-8 shrink-0 relative h-full mr-2 z-10 pointer-events-none">
                {Array.from({ length: rowCount }, (_, i) => i + 1).map((pos) => (
                    <div 
                        key={pos} 
                        className="absolute w-full text-right flex items-center justify-end"
                        style={{ top: `${getYPercent(pos)}%`, transform: 'translateY(-50%)' }}
                    >
                        <span className="text-[10px] font-black f1-font text-gray-400 dark:text-gray-600">P{pos}</span>
                    </div>
                ))}
            </div>

            {/* Área de Plotagem */}
            <div className="flex-1 relative h-full overflow-visible">
                
                {/* Grid Lines */}
                {Array.from({ length: rowCount }, (_, i) => i + 1).map((pos) => (
                    <div 
                        key={pos}
                        className="absolute w-full border-b border-gray-100 dark:border-white/5 border-dashed left-0 right-0"
                        style={{ top: `${getYPercent(pos)}%` }}
                    />
                ))}

                {/* Linhas de Dados */}
                <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {chartUsers.map((u, idx) => {
                        let history = u.positionHistory || [];
                        
                        // Fallback se não tiver histórico: usa o rank atual como ponto único
                        if (history.length === 0 && u.rank) {
                            history = [u.rank];
                        }
                        
                        if (history.length === 0) return null;

                        // Pontos para o SVG Path
                        let d = "";
                        
                        if (history.length > 1) {
                            const pathCoords = history.map((rank, hIdx) => {
                                const x = (hIdx / (history.length - 1)) * 100;
                                const y = getYPercent(rank);
                                return `${x},${y}`;
                            });
                            d = `M ${pathCoords.join(' L ')}`;
                        } else {
                            // Se só tem 1 ponto, desenha uma linha reta do início ao fim no nível desse rank
                            const y = getYPercent(history[0]);
                            d = `M 0,${y} L 100,${y}`;
                        }

                        const color = chartColors[idx % chartColors.length];
                        const isCurrentUser = u.id === currentUser.id;

                        // Aumentei a opacidade e largura para garantir visibilidade
                        return (
                            <path 
                                key={u.id}
                                d={d}
                                fill="none"
                                stroke={color}
                                strokeWidth={isCurrentUser ? 4 : 2.5}
                                strokeOpacity={isCurrentUser ? 1 : 0.6}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke" 
                                className="transition-all duration-300"
                            />
                        );
                    })}
                </svg>

                {/* Bolinhas (Dots) */}
                {chartUsers.map((u, idx) => {
                    let history = u.positionHistory || [];
                    if (history.length === 0 && u.rank) {
                        history = [u.rank];
                    }
                    if (history.length === 0) return null;

                    const lastRank = history[history.length - 1];
                    const y = getYPercent(lastRank);
                    const color = chartColors[idx % chartColors.length];
                    const isCurrentUser = u.id === currentUser.id;

                    return (
                        <div 
                            key={u.id}
                            className={`absolute rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg transition-all ${isCurrentUser ? 'z-20 w-4 h-4 ring-4 ring-gray-900/10 dark:ring-white/10' : 'z-10 w-2.5 h-2.5 opacity-90'}`}
                            style={{ 
                                left: '100%', 
                                top: `${y}%`,
                                backgroundColor: color
                            }}
                        />
                    );
                })}

            </div>
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-8 justify-center border-t border-gray-100 dark:border-white/5 pt-4 max-h-40 overflow-y-auto custom-scrollbar">
            {chartUsers.map((u, idx) => (
                <div key={u.id} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: chartColors[idx % chartColors.length] }} />
                    <span className={`text-[10px] font-black uppercase tracking-widest truncate max-w-[100px] ${u.id === currentUser.id ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                        {u.name}
                    </span>
                </div>
            ))}
        </div>
      </div>

      {/* Lista de Tempo na Liderança */}
      <div>
         <div className="flex items-center justify-between mb-6 px-1">
            <h3 className="text-lg font-black f1-font uppercase flex items-center gap-2 text-gray-900 dark:text-white">
                <Crown className="text-yellow-500" size={20} /> Tempo no Topo
            </h3>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider border border-gray-200 dark:border-white/10 px-2 py-1 rounded-lg">
                Lista Completa ({users.length})
            </span>
         </div>

         <div className="space-y-3">
             {leadershipStats.length === 0 ? (
                 <div className="bg-white dark:bg-white/5 rounded-2xl p-6 text-center border border-gray-200 dark:border-white/5">
                     <p className="text-gray-500 text-xs font-bold uppercase">Nenhum dado disponível.</p>
                 </div>
             ) : (
                leadershipStats.map((u, idx) => {
                    const hasLed = u.weeksAtOne > 0;
                    const rankOrder = idx + 1;

                    return (
                        <div key={u.id} className={`flex items-center justify-between p-4 rounded-2xl relative overflow-hidden transition-all border ${currentUser.id === u.id ? 'bg-gray-100 dark:bg-white/10 border-gray-300 dark:border-white/20' : 'bg-white dark:bg-[#121214] border-gray-200 dark:border-white/5'}`}>
                            
                            {hasLed && (
                                <div 
                                    className="absolute left-0 top-0 bottom-0 bg-yellow-100/50 dark:bg-yellow-500/5 z-0 transition-all duration-1000" 
                                    style={{ width: `${(u.weeksAtOne / maxWeeks) * 100}%` }}
                                />
                            )}
                            
                            <div className="flex items-center gap-4 relative z-10">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${rankOrder === 1 && hasLed ? 'bg-yellow-500 text-black shadow-lg' : 'bg-gray-100 dark:bg-white/5 text-gray-500'}`}>
                                    {rankOrder}
                                </div>
                                
                                {/* Avatar */}
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200 dark:border-white/5">
                                     {u.avatarUrl ? (
                                        <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                                     ) : (
                                        <span className="text-[9px] font-bold text-gray-400">{u.name.charAt(0).toUpperCase()}</span>
                                     )}
                                </div>

                                <div className="min-w-0">
                                    <p className={`text-sm font-bold truncate ${currentUser.id === u.id ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {u.name} {currentUser.id === u.id && '(Você)'}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">
                                            {u.points || 0} pts
                                        </p>
                                        {hasLed && (
                                            <span className="text-[8px] text-yellow-600 dark:text-yellow-500/80 font-bold uppercase ml-2">
                                                ★ Liderou
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 text-right shrink-0">
                                {hasLed ? (
                                    <>
                                        <p className="text-xl font-black f1-font text-gray-900 dark:text-white leading-none">{u.weeksAtOne}</p>
                                        <p className="text-[8px] font-bold text-yellow-600 dark:text-yellow-500 uppercase tracking-wide">GPs Líder</p>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-end opacity-40">
                                        <Minus size={16} className="text-gray-400 dark:text-gray-500 mb-0.5" />
                                        <p className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Nunca Liderou</p>
                                    </div>
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

export default Stats;
