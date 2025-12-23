
import React from 'react';
import { User } from '../types';
import { TrendingUp, Award, Clock, Target } from 'lucide-react';

const Stats: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-black f1-font mb-8 uppercase tracking-tight">Estatísticas</h2>

      <div className="grid grid-cols-1 gap-4 mb-8">
        <StatCard 
          icon={<Award className="text-yellow-500" />} 
          label="Melhor Rodada" 
          value="78 pts" 
          sub="Miami GP"
        />
        <StatCard 
          icon={<Target className="text-[#e10600]" />} 
          label="Acurácia Posição" 
          value="42%" 
          sub="Posições exatas acertadas"
        />
        <StatCard 
          icon={<Clock className="text-blue-500" />} 
          label="Tempo Líder" 
          value="8 GPs" 
          sub="Total de semanas no topo"
        />
      </div>

      <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold flex items-center gap-2"><TrendingUp size={18} className="text-green-500" /> Evolução de Ranking</h3>
          <span className="text-[10px] text-gray-500 font-bold uppercase">Últimos 10 GPs</span>
        </div>
        
        {/* Mock Chart Placeholder */}
        <div className="h-40 w-full flex items-end justify-between gap-1 px-2">
          {[8, 6, 5, 7, 4, 3, 2, 2, 3, 2].map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className={`w-full rounded-t-lg transition-all duration-1000 ${v === 2 ? 'bg-[#e10600]' : 'bg-white/10'}`} 
                style={{ height: `${(10 - v) * 10}%` }}
              />
              <span className="text-[8px] font-bold text-gray-600">GP{i+1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string, sub: string }> = ({ icon, label, value, sub }) => (
  <div className="bg-white/5 p-5 rounded-3xl border border-white/5 flex items-center gap-5">
    <div className="bg-white/5 p-3 rounded-2xl">
      {icon}
    </div>
    <div>
      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-xl font-black f1-font">{value}</p>
        <p className="text-[10px] text-gray-400 font-medium italic">{sub}</p>
      </div>
    </div>
  </div>
);

export default Stats;
