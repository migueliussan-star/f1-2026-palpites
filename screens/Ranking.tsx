
import React, { useState } from 'react';
import { User as UserType, RaceGP } from '../types';

interface RankingProps {
  currentUser: UserType;
  users: UserType[];
  calendar: RaceGP[];
}

const Ranking: React.FC<RankingProps> = ({ currentUser, users, calendar }) => {
  const [activeFilter, setActiveFilter] = useState<'geral' | 'gp'>('geral');
  const [selectedGpId, setSelectedGpId] = useState<number>(calendar[0]?.id || 1);

  // Ordena os usuários reais por pontos (Ranking Real do "Banco de Dados")
  const sortedUsers = [...users].sort((a, b) => (b.points || 0) - (a.points || 0));

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

      <div className="bg-white/5 rounded-[32px] overflow-hidden border border-white/10 shadow-2xl mb-24">
        {sortedUsers.length === 0 ? (
          <div className="p-16 text-center text-gray-600 text-[10px] font-black uppercase tracking-widest leading-relaxed">
            Nenhum competidor <br/> cadastrado ainda.
          </div>
        ) : (
          sortedUsers.map((item, idx) => (
            <div 
              key={item.id} 
              className={`flex items-center justify-between p-6 border-b border-white/5 last:border-0 ${item.id === currentUser.id ? 'bg-[#e10600]/10 border-l-4 border-l-[#e10600]' : ''}`}
            >
              <div className="flex items-center gap-4">
                <span className={`w-8 text-center font-black f1-font text-lg ${idx + 1 <= 3 ? 'text-yellow-500' : 'text-gray-500'}`}>
                  {idx + 1}
                </span>
                <div className="flex flex-col">
                  <span className="font-bold text-sm tracking-tight">{item.name}</span>
                  <span className={`text-[9px] font-black uppercase tracking-tighter ${item.isAdmin ? 'text-red-500' : 'text-gray-500'}`}>
                    {item.isAdmin ? 'Administrador' : 'Participante'}
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-xl font-black f1-font leading-none">{item.points || 0}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">PTS</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Ranking;
