
import React, { useState } from 'react';
import { User as UserType, RaceGP } from '../types';
import { ChevronUp, ChevronDown, Minus, TrendingUp } from 'lucide-react';

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

  // Preparar dados para o gráfico (Top 5)
  const top5Users = sortedUsers.slice(0, 5);
  const chartColors = ['#FFD700', '#C0C0C0', '#CD7F32', '#3b82f6', '#8b5cf6']; // Gold, Silver, Bronze, Blue, Purple

  return (
    <div className="p-6">
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
      <div className="bg-white/5 rounded-[32px] overflow-hidden border border-white/10 shadow-2xl mb-12">
        {sortedUsers.length === 0 ? (
          <div className="p-16 text-center text-gray-600 text-[10px] font-black uppercase tracking-widest leading-relaxed">
            Nenhum competidor <br/> cadastrado ainda.
          </div>
        ) : (
          sortedUsers.map((item, idx) => {
            // Cálculo de Gap (Pontos atrás do próximo)
            const pointsDiff = idx === 0 ? 0 : (sortedUsers[idx-1].points || 0) - (item.points || 0);
            
            // Cálculo de Posições Ganhas (Mock se não tiver histórico real)
            const prevRank = item.previousRank || (item.points ? idx + 2 : idx + 1); 
            const rankChange = prevRank - (idx + 1);

            return (
              <div 
                key={item.id} 
                className={`flex items-center justify-between p-4 px-6 border-b border-white/5 last:border-0 ${item.id === currentUser.id ? 'bg-[#e10600]/10 border-l-4 border-l-[#e10600]' : ''}`}
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
                    <span className="font-bold text-sm tracking-tight truncate max-w-[120px]">{item.name}</span>
                    <span className={`text-[9px] font-black uppercase tracking-tighter ${item.isAdmin ? 'text-red-500' : 'text-gray-500'}`}>
                      {item.isAdmin ? 'Admin' : `Nível ${item.level}`}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xl font-black f1-font leading-none">{item.points || 0}</p>
                  {/* GAP para o próximo */}
                  {idx > 0 && (
                      <p className="text-[9px] text-red-400/80 font-bold uppercase tracking-tight mt-0.5">
                        GAP -{pointsDiff}
                      </p>
                  )}
                  {idx === 0 && <p className="text-[9px] text-yellow-500 font-bold uppercase tracking-tight mt-0.5">LÍDER</p>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Performance Chart Area */}
      <div className="mb-24">
         <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-600/20 p-2 rounded-xl">
                <TrendingUp className="text-blue-500" size={20} />
            </div>
            <div>
                <h3 className="text-lg font-black f1-font uppercase leading-none">Dominância</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Top 5 - Tendência Recente</p>
            </div>
         </div>

         <div className="bg-white/5 rounded-[32px] p-6 border border-white/10 overflow-hidden relative">
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
      </div>
    </div>
  );
};

export default Ranking;
