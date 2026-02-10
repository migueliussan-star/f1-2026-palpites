
import React from 'react';
import { DRIVERS, FALLBACK_IMG } from '../constants';
import { RaceGP } from '../types';
import { Users, Info } from 'lucide-react';

interface PalpitometroProps {
  gp: RaceGP;
  stats: Record<string, Record<string, number>>;
  totalUsers: number;
}

const Palpitometro: React.FC<PalpitometroProps> = ({ gp, stats, totalUsers }) => {
  const sessions = gp.isSprint 
    ? ['Qualy Sprint', 'corrida Sprint', 'Qualy corrida', 'corrida principal'] 
    : ['Qualy corrida', 'corrida principal'];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black f1-font">PALPITÔMETRO</h2>
          <p className="text-gray-400 text-xs uppercase tracking-widest">{gp.name} 2026</p>
        </div>
        <div className="bg-[#e10600]/10 text-[#e10600] px-3 py-1 rounded-full border border-[#e10600]/20 flex items-center gap-2">
          <Users size={14} />
          <span className="text-xs font-bold">{totalUsers} participantes neste GP</span>
        </div>
      </div>

      {Object.keys(stats).length === 0 ? (
        <div className="bg-white/5 rounded-3xl p-12 text-center border border-dashed border-white/10">
          <Info size={32} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-500 text-sm font-bold uppercase tracking-widest leading-relaxed">
            Nenhum palpite registrado para este GP ainda.
          </p>
        </div>
      ) : (
        <div className="space-y-8 mb-24">
          {sessions.map(session => {
            const sessionData = stats[session] || {};
            // Mostra TODOS os pilotos que receberam votos
            const rankedDrivers = Object.entries(sessionData)
              .sort(([, a], [, b]) => (b as number) - (a as number));

            if (rankedDrivers.length === 0) return null;

            return (
              <div key={session} className="bg-white/5 rounded-3xl p-6 border border-white/5">
                <h3 className="text-xs font-black f1-font text-[#e10600] mb-6 flex items-center justify-between uppercase">
                  {session}
                  <span className="text-[10px] text-gray-500 font-normal normal-case">Consenso da comunidade</span>
                </h3>

                <div className="space-y-4">
                  {rankedDrivers.map(([driverId, votes], idx) => {
                    const driver = DRIVERS.find(d => d.id === driverId);
                    const voteCount = votes as number;
                    // Percentual apenas para a largura da barra visual
                    const percent = Math.min(100, Math.round((voteCount / totalUsers) * 100));
                    
                    return (
                      <div key={driverId}>
                        <div className="flex justify-between items-end mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black f1-font text-gray-600 w-5">#{idx + 1}</span>
                            {/* Avatar Pequeno - Padrão Unificado */}
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-white/10 border border-white/10">
                                <img 
                                    src={driver?.image} 
                                    alt="" 
                                    className="w-full h-full object-contain object-bottom scale-125 translate-y-1" 
                                    onError={(e) => { 
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = FALLBACK_IMG;
                                    }} 
                                />
                            </div>
                            <p className="text-sm font-bold">{driver?.name}</p>
                          </div>
                          {/* Apenas o número de votos, sem a porcentagem por escrito */}
                          <span className="text-xs font-black text-white">
                             {voteCount} <span className="text-[8px] text-gray-500 font-normal uppercase">{voteCount === 1 ? 'voto' : 'votos'}</span>
                          </span>
                        </div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-700" 
                            style={{ width: `${percent}%`, backgroundColor: driver?.color || '#e10600' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Palpitometro;
