
import React from 'react';
import { User } from '../types';
import { TrendingUp, Crown, Minus } from 'lucide-react';

interface StatsProps {
    currentUser: User;
    users: User[];
}

const Stats: React.FC<StatsProps> = ({ currentUser, users }) => {
  // Ordena os usuários por pontos
  const sortedUsers = [...users].sort((a, b) => (b.points || 0) - (a.points || 0));
  const chartUsers = sortedUsers;

  const chartColors = [
    '#FFD700', '#C0C0C0', '#CD7F32', '#3b82f6', '#8b5cf6', 
    '#ec4899', '#10b981', '#f97316', '#06b6d4', '#ef4444', 
    '#84cc16', '#6366f1', '#d946ef', '#14b8a6', 
  ];

  // Calcula tempo de liderança
  const leadershipStats = users.map(u => {
      const weeksAtOne = (u.positionHistory || []).filter(p => p === 1).length;
      return { ...u, weeksAtOne };
  }).sort((a, b) => {
      if (b.weeksAtOne !== a.weeksAtOne) return b.weeksAtOne - a.weeksAtOne;
      return (b.points || 0) - (a.points || 0);
  });

  const maxWeeks = leadershipStats[0]?.weeksAtOne || 1;

  // --- CONFIGURAÇÃO DO GRÁFICO ---
  // Define o número de linhas do gráfico baseado no total de usuários (Mínimo 2 para ter P1 e P2)
  const rowCount = Math.max(users.length, 2);

  // Calcula a posição Y (em %) para um determinado Rank
  // Deixa 10% de margem em cima e 10% em baixo para não cortar bolinhas
  const getYPercent = (rank: number) => {
    if (rowCount <= 1) return 50;
    const safeRank = Math.min(Math.max(rank, 1), rowCount); // Garante que rank esteja entre 1 e rowCount
    const availableSpace = 80; // 80% do espaço (100 - 10 - 10)
    const step = availableSpace / (rowCount - 1);
    return 10 + ((safeRank - 1) * step);
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

      {/* Gráfico de Tendência - Visual Dark Card */}
      <div className="bg-[#0f0f11] rounded-[32px] p-6 border border-white/5 shadow-2xl mb-10">
        
        {/* Container do Gráfico */}
        <div className="h-80 w-full relative flex select-none">
            
            {/* Eixo Y (Labels P1, P2...) - HTML puro para não distorcer */}
            <div className="flex flex-col w-8 shrink-0 relative h-full mr-2 z-10 pointer-events-none">
                {Array.from({ length: rowCount }, (_, i) => i + 1).map((pos) => (
                    <div 
                        key={pos} 
                        className="absolute w-full text-right flex items-center justify-end"
                        style={{ top: `${getYPercent(pos)}%`, transform: 'translateY(-50%)' }}
                    >
                        <span className="text-[10px] font-black f1-font text-gray-600">P{pos}</span>
                    </div>
                ))}
            </div>

            {/* Área de Plotagem */}
            <div className="flex-1 relative h-full overflow-visible">
                
                {/* Linhas de Grade (Grid) */}
                {Array.from({ length: rowCount }, (_, i) => i + 1).map((pos) => (
                    <div 
                        key={pos}
                        className="absolute w-full border-b border-white/5 border-dashed left-0 right-0"
                        style={{ top: `${getYPercent(pos)}%` }}
                    />
                ))}

                {/* Linhas de Dados (SVG com vector-effect para não distorcer espessura) */}
                <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {chartUsers.map((u, idx) => {
                        const history = u.positionHistory || [];
                        if (history.length === 0) return null;

                        // Cria o path usando coordenadas de porcentagem
                        const points = history.map((rank, hIdx) => {
                            const totalPoints = Math.max(history.length, 1);
                            // Se tiver só 1 ponto, desenha uma linha reta do início ao fim
                            if (totalPoints === 1) return `0,${getYPercent(rank)} 100,${getYPercent(rank)}`;
                            
                            const x = (hIdx / (totalPoints - 1)) * 100;
                            const y = getYPercent(rank);
                            return `${x},${y}`;
                        });
                        
                        // Se tiver pontos suficientes, une com L
                        let d = "";
                        if (history.length > 1) {
                            d = `M ${points.map(p => p.replace(',', ' ')).join(' L ').replace(/ /g, ',')}`; 
                            // Correção manual da string: "x,y" -> M x,y L x,y ...
                            // Re-gerando string limpa:
                            const pathCoords = history.map((rank, hIdx) => {
                                const x = (hIdx / (history.length - 1)) * 100;
                                const y = getYPercent(rank);
                                return `${x},${y}`;
                            });
                            d = `M ${pathCoords.join(' L ')}`;
                        } else {
                            // Linha reta constante se só tiver 1 dado
                            const y = getYPercent(history[0]);
                            d = `M 0,${y} L 100,${y}`;
                        }

                        const color = chartColors[idx % chartColors.length];
                        const isCurrentUser = u.id === currentUser.id;

                        return (
                            <path 
                                key={u.id}
                                d={d}
                                fill="none"
                                stroke={color}
                                strokeWidth={isCurrentUser ? 3 : 1.5}
                                strokeOpacity={isCurrentUser ? 1 : 0.4}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke" // Mágica: Mantém a linha fina mesmo se o SVG esticar
                                className="transition-all duration-300"
                            />
                        );
                    })}
                </svg>

                {/* Bolinhas (Dots) - HTML puro para garantir que sejam círculos perfeitos */}
                {chartUsers.map((u, idx) => {
                    const history = u.positionHistory || [];
                    if (history.length === 0) return null;

                    const lastRank = history[history.length - 1];
                    const y = getYPercent(lastRank);
                    const color = chartColors[idx % chartColors.length];
                    const isCurrentUser = u.id === currentUser.id;

                    return (
                        <div 
                            key={u.id}
                            className={`absolute rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg transition-all ${isCurrentUser ? 'z-20 w-3 h-3 ring-2 ring-white/20' : 'z-10 w-2 h-2 opacity-80'}`}
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

      {/* Lista de Tempo na Liderança */}
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
