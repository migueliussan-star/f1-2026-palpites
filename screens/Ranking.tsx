
import React, { useState } from 'react';
import { User as UserType, RaceGP } from '../types';
import { ChevronUp, ChevronDown, Minus, TrendingUp, Clock } from 'lucide-react';

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
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Top 5 - Últimas Corridas</p>
            </div>
         </div>

         <div className="bg-white/5 rounded-[32px] p-6 border border-white/10 overflow-hidden relative">
            {/* Chart Container */}
            <div className="h-48 w-full relative">
                {/* SVG Chart */}
                <svg className="w-full h-full" viewBox="0 0 300 150" preserveAspectRatio="none">
                    {/* Grid Lines */}
                    {[1, 2, 3, 4, 5].map(i => {
                         const y = 20 + (i - 1) * 30; // Scale 1-5 roughly to 150px height
                         return (
                            <line key={i} x1="0" y1={y} x2="300" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                         );
                    })}
                    
                    {/* Data Lines */}
                    {top5Users.map((u, idx) => {
                        const history = u.positionHistory || [];
                        if (history.length < 2) return null; // Need at least 2 points for a line
                        
                        // Create path string
                        const points = history.map((rank, hIdx) => {
                            const x = (hIdx / (history.length - 1)) * 300;
                            // Map rank 1 to top (y=20), rank 10 to bottom (y=140)
                            // Formula: y = 20 + (rank - 1) * (120 / 9) roughly
                            const y = 20 + Math.min(rank - 1, 10) * 15;
                            return `${x},${y}`;
                        }).join(' ');

                        return (
                            <g key={u.id}>
                                <polyline 
                                    points={points} 
                                    fill="none" 
                                    stroke={chartColors[idx % chartColors.length]} 
                                    strokeWidth="3" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                    className="drop-shadow-lg"
                                />
                                {/* Dots for points */}
                                {history.map((rank, hIdx) => {
                                     const x = (hIdx / (history.length - 1)) * 300;
                                     const y = 20 + Math.min(rank - 1, 10) * 15;
                                     return (
                                         <circle key={hIdx} cx={x} cy={y} r="3" fill="#0a0a0c" stroke={chartColors[idx % chartColors.length]} strokeWidth="2" />
                                     )
                                })}
                            </g>
                        );
                    })}
                </svg>

                {/* Y Axis Labels (Positions) */}
                <div className="absolute top-0 left-0 h-full flex flex-col justify-between text-[8px] font-bold text-gray-600 pointer-events-none pb-2">
                    <span>P1</span>
                    <span>P3</span>
                    <span>P5</span>
                    <span>P8+</span>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-6 justify-center">
                {top5Users.map((u, idx) => (
                    <div key={u.id} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: chartColors[idx % chartColors.length] }} />
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{u.name.split(' ').pop()}</span>
                    </div>
                ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default Ranking;
