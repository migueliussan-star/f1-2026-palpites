
import React from 'react';
import { User } from '../types';
import { TrendingUp, Award, Clock } from 'lucide-react';

interface StatsProps {
    currentUser: User;
    users: User[];
}

const Stats: React.FC<StatsProps> = ({ currentUser, users }) => {
  // Ordena os usuários por pontos para pegar o Top 5 para o gráfico
  const sortedUsers = [...users].sort((a, b) => (b.points || 0) - (a.points || 0));
  const top5Users = sortedUsers.slice(0, 5);
  const chartColors = ['#FFD700', '#C0C0C0', '#CD7F32', '#3b82f6', '#8b5cf6']; // Gold, Silver, Bronze, Blue, Purple

  // Calcula tempo de liderança para TODOS os pilotos
  const leadershipStats = users.map(u => {
      const weeksAtOne = (u.positionHistory || []).filter(p => p === 1).length;
      return {
          ...u,
          weeksAtOne
      };
  })
  .filter(u => u.weeksAtOne > 0) // Mostra apenas quem já liderou
  .sort((a, b) => b.weeksAtOne - a.weeksAtOne);

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-600/20 p-2 rounded-xl">
               <TrendingUp className="text-blue-500" size={24} />
          </div>
          <div>
               <h2 className="text-2xl font-black f1-font uppercase leading-none">Dominância</h2>
               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Estatísticas de Poder</p>
          </div>
      </div>

      {/* Gráfico de Tendência (Top 5) */}
      <div className="bg-white/5 rounded-[32px] p-6 border border-white/10 overflow-hidden relative mb-12 shadow-2xl">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Tendência Recente (Top 5)</h3>
        
        {/* Chart Container */}
        <div className="h-48 w-full relative pl-6">
            {/* SVG Chart */}
            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 150" preserveAspectRatio="none">
                {/* Grid Lines Horizontal */}
                {[1, 5, 10].map((pos, i) => {
                        const y = 10 + ((pos - 1) / 10) * 130; 
                        return (
                        <g key={i}>
                            <line x1="0" y1={y} x2="300" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
                            <text x="-15" y={y + 3} fill="#666" fontSize="8" fontWeight="bold">P{pos}</text>
                        </g>
                        );
                })}
                
                {/* Data Lines */}
                {top5Users.map((u, idx) => {
                    const history = u.positionHistory || [];
                    if (history.length === 0) return null;

                    // Normalize X: 0 to 300
                    // Normalize Y: Rank 1 = 10, Rank 11+ = 140
                    
                    const points = history.map((rank, hIdx) => {
                        const totalPoints = Math.max(history.length, 2); // Prevent div by zero if only 1 point
                        const x = (hIdx / (totalPoints - 1)) * 300;
                        
                        // Clamp rank visual to max 12 to not go off chart
                        const visualRank = Math.min(rank, 12);
                        const y = 10 + ((visualRank - 1) / 10) * 130;
                        return { x, y };
                    });

                    // Make Path
                    const pathD = points.length > 1 
                        ? points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')
                        : `M ${points[0].x} ${points[0].y} L ${points[0].x + 1} ${points[0].y}`; // Dot if only 1 point

                    return (
                        <g key={u.id}>
                            <path 
                                d={pathD} 
                                fill="none" 
                                stroke={chartColors[idx % chartColors.length]} 
                                strokeWidth="2.5" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                                className="drop-shadow-md opacity-80"
                            />
                            {points.map((p, i) => (
                                <circle 
                                    key={i} 
                                    cx={p.x} 
                                    cy={p.y} 
                                    r="3" 
                                    fill="#0a0a0c" 
                                    stroke={chartColors[idx % chartColors.length]} 
                                    strokeWidth="2" 
                                />
                            ))}
                        </g>
                    );
                })}
            </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-6 justify-center">
            {top5Users.map((u, idx) => (
                <div key={u.id} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: chartColors[idx % chartColors.length] }} />
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide truncate max-w-[80px]">{u.name}</span>
                </div>
            ))}
        </div>
      </div>

      {/* Lista de Tempo na Liderança */}
      <div className="mb-24">
         <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black f1-font uppercase flex items-center gap-2">
                <Clock className="text-yellow-500" size={20} /> Tempo no Topo
            </h3>
            <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded-lg font-bold border border-yellow-500/20">
                Liderança Acumulada
            </span>
         </div>

         <div className="space-y-3">
             {leadershipStats.length === 0 ? (
                 <div className="bg-white/5 rounded-2xl p-6 text-center border border-white/5">
                     <p className="text-gray-500 text-xs font-bold uppercase">Nenhum piloto assumiu a liderança ainda.</p>
                 </div>
             ) : (
                leadershipStats.map((u, idx) => (
                    <div key={u.id} className="flex items-center justify-between bg-white/5 border border-white/5 p-4 rounded-2xl relative overflow-hidden">
                        {/* Barra de Progresso Visual (Baseada no maximo possivel ou relativo ao lider) */}
                        <div 
                            className="absolute left-0 top-0 bottom-0 bg-yellow-500/5 z-0" 
                            style={{ width: `${(u.weeksAtOne / (leadershipStats[0]?.weeksAtOne || 1)) * 100}%` }}
                        />
                        
                        <div className="flex items-center gap-4 relative z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'bg-white/10 text-gray-400'}`}>
                                {idx + 1}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">{u.name}</p>
                                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">
                                    {u.level}
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 text-right">
                            <p className="text-xl font-black f1-font text-white leading-none">{u.weeksAtOne}</p>
                            <p className="text-[8px] font-bold text-yellow-500 uppercase tracking-wide">GPs Líder</p>
                        </div>
                    </div>
                ))
             )}
         </div>
      </div>
    </div>
  );
};

export default Stats;
