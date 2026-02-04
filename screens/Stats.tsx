
import React from 'react';
import { User } from '../types';
import { TrendingUp, Clock, Crown, Minus } from 'lucide-react';

interface StatsProps {
    currentUser: User;
    users: User[];
}

const Stats: React.FC<StatsProps> = ({ currentUser, users }) => {
  // Ordena os usuários por pontos
  const sortedUsers = [...users].sort((a, b) => (b.points || 0) - (a.points || 0));
  
  // Agora usamos TODOS os usuários para o gráfico, conforme solicitado
  const chartUsers = sortedUsers;

  // Paleta de cores expandida para suportar mais usuários visualmente
  const chartColors = [
    '#FFD700', // Gold
    '#C0C0C0', // Silver
    '#CD7F32', // Bronze
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#10b981', // Emerald
    '#f97316', // Orange
    '#06b6d4', // Cyan
    '#ef4444', // Red
    '#84cc16', // Lime
    '#6366f1', // Indigo
    '#d946ef', // Fuchsia
    '#14b8a6', // Teal
  ];

  // Calcula tempo de liderança para TODOS os pilotos (sem filtro)
  const leadershipStats = users.map(u => {
      const weeksAtOne = (u.positionHistory || []).filter(p => p === 1).length;
      return {
          ...u,
          weeksAtOne
      };
  })
  .sort((a, b) => {
      // Ordena por tempo na liderança, desempata por pontos totais
      if (b.weeksAtOne !== a.weeksAtOne) return b.weeksAtOne - a.weeksAtOne;
      return (b.points || 0) - (a.points || 0);
  });

  const maxWeeks = leadershipStats[0]?.weeksAtOne || 1;

  // Configurações do Gráfico
  const TOTAL_POSITIONS = 15;
  const VIEWBOX_HEIGHT = 200; // Altura interna do SVG aumentada
  const VIEWBOX_WIDTH = 300;
  const PADDING_TOP = 20;
  const PADDING_BOTTOM = 20;
  const CHART_HEIGHT = VIEWBOX_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const getYForRank = (rank: number) => {
      // Clamp rank entre 1 e 15
      const clampedRank = Math.max(1, Math.min(rank, TOTAL_POSITIONS));
      // Interpolação linear
      return PADDING_TOP + ((clampedRank - 1) / (TOTAL_POSITIONS - 1)) * CHART_HEIGHT;
  };

  return (
    <div className="p-6 pb-32">
      <div className="flex items-center gap-4 mb-8">
          <div className="bg-blue-600/20 p-3 rounded-2xl border border-blue-600/30">
               <TrendingUp className="text-blue-500" size={24} />
          </div>
          <div>
               <h2 className="text-3xl font-black f1-font uppercase leading-none tracking-tighter">Dominância</h2>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Tendência Global ({users.length} Pilotos)</p>
          </div>
      </div>

      {/* Gráfico de Tendência (TODOS) - Visual Dark Card */}
      <div className="bg-[#0f0f11] rounded-[32px] p-6 border border-white/5 overflow-hidden relative mb-10 shadow-2xl">
        
        {/* Chart Container - Aumentado altura para acomodar 15 linhas */}
        <div className="h-80 w-full relative">
            {/* SVG Chart */}
            <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} preserveAspectRatio="none">
                {/* Grid Lines & Labels (1 to 15) */}
                {Array.from({ length: TOTAL_POSITIONS }, (_, i) => i + 1).map((pos) => {
                        const y = getYForRank(pos);
                        return (
                        <g key={pos}>
                            {/* Label */}
                            <text 
                                x="0" 
                                y={y + 3} 
                                fill="#666" 
                                fontSize="8" 
                                fontWeight="900" 
                                className="f1-font select-none"
                            >
                                P{pos}
                            </text>
                            {/* Line */}
                            <line 
                                x1="25" 
                                y1={y} 
                                x2={VIEWBOX_WIDTH} 
                                y2={y} 
                                stroke="rgba(255,255,255,0.08)" 
                                strokeWidth="1" 
                                strokeDasharray="6 6" 
                            />
                        </g>
                        );
                })}
                
                {/* Data Lines */}
                {chartUsers.map((u, idx) => {
                    const history = u.positionHistory || [];
                    if (history.length === 0) return null;
                    
                    const points = history.map((rank, hIdx) => {
                        const totalPoints = Math.max(history.length, 2); // Evita div by zero
                        // X space starts from 25 (padding for labels) to 300
                        const x = 25 + (hIdx / (totalPoints - 1)) * (VIEWBOX_WIDTH - 25);
                        const y = getYForRank(rank);
                        return { x, y };
                    });

                    const pathD = points.length > 1 
                        ? points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')
                        : `M ${points[0].x} ${points[0].y} L ${points[0].x + 1} ${points[0].y}`;

                    const lineColor = chartColors[idx % chartColors.length];
                    const isCurrentUser = u.id === currentUser.id;

                    return (
                        <g key={u.id} style={{ opacity: isCurrentUser ? 1 : 0.6 }}>
                            <path 
                                d={pathD} 
                                fill="none" 
                                stroke={lineColor} 
                                strokeWidth={isCurrentUser ? "3" : "1.5"} 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                                className="drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] transition-all duration-300"
                            />
                            {/* Dot only on last point */}
                             <circle 
                                cx={points[points.length-1].x} 
                                cy={points[points.length-1].y} 
                                r={isCurrentUser ? "4" : "2"} 
                                fill={lineColor} 
                            />
                        </g>
                    );
                })}
            </svg>
        </div>

        {/* Legend - Lista Completa */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-8 justify-center border-t border-white/5 pt-4 max-h-40 overflow-y-auto custom-scrollbar">
            {chartUsers.map((u, idx) => (
                <div key={u.id} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: chartColors[idx % chartColors.length] }} />
                    <span className={`text-[10px] font-black uppercase tracking-widest truncate max-w-[100px] ${u.id === currentUser.id ? 'text-white' : 'text-gray-500'}`}>
                        {u.name}
                    </span>
                </div>
            ))}
        </div>
      </div>

      {/* Lista de Tempo na Liderança - TODOS OS USUÁRIOS */}
      <div>
         <div className="flex items-center justify-between mb-6 px-1">
            <h3 className="text-lg font-black f1-font uppercase flex items-center gap-2 text-white">
                <Crown className="text-yellow-500" size={20} /> Tempo no Topo
            </h3>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider border border-white/10 px-2 py-1 rounded-lg">
                Lista Completa ({users.length})
            </span>
         </div>

         <div className="space-y-3">
             {leadershipStats.length === 0 ? (
                 <div className="bg-white/5 rounded-2xl p-6 text-center border border-white/5">
                     <p className="text-gray-500 text-xs font-bold uppercase">Nenhum dado disponível.</p>
                 </div>
             ) : (
                leadershipStats.map((u, idx) => {
                    const isLeader = idx === 0 && u.weeksAtOne > 0;
                    const hasLed = u.weeksAtOne > 0;

                    return (
                        <div key={u.id} className={`flex items-center justify-between p-4 rounded-2xl relative overflow-hidden transition-all ${currentUser.id === u.id ? 'bg-white/10 border border-white/20' : 'bg-[#121214] border border-white/5'}`}>
                            
                            {/* Barra de Progresso Sutil no Fundo */}
                            {hasLed && (
                                <div 
                                    className="absolute left-0 top-0 bottom-0 bg-yellow-500/5 z-0 transition-all duration-1000" 
                                    style={{ width: `${(u.weeksAtOne / maxWeeks) * 100}%` }}
                                />
                            )}
                            
                            <div className="flex items-center gap-4 relative z-10">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${isLeader ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-white/5 text-gray-500'}`}>
                                    {idx + 1}
                                </div>
                                <div className="min-w-0">
                                    <p className={`text-sm font-bold truncate ${currentUser.id === u.id ? 'text-white' : 'text-gray-300'}`}>
                                        {u.name} {currentUser.id === u.id && '(Você)'}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {hasLed && (
                                            <span className="text-[8px] text-yellow-500/80 font-bold uppercase">
                                                ★ Liderou
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 text-right shrink-0">
                                {hasLed ? (
                                    <>
                                        <p className="text-xl font-black f1-font text-white leading-none">{u.weeksAtOne}</p>
                                        <p className="text-[8px] font-bold text-yellow-500 uppercase tracking-wide">GPs Líder</p>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-end opacity-40">
                                        <Minus size={16} className="text-gray-500 mb-0.5" />
                                        <p className="text-[8px] font-bold text-gray-500 uppercase tracking-wide">Nunca Liderou</p>
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
