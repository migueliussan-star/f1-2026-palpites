import React, { useMemo } from 'react';
import { User, RaceGP } from '../types';
import { Trophy, Medal, Target, Zap, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProfileProps {
  user: User;
  calendar: RaceGP[];
}

const BADGES = {
  'PERFECT_TOP5': { icon: <Target size={24} />, name: 'Olho de Lince', desc: 'Acertou o Top 5 completo', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  'FIRST_BLOOD': { icon: <Zap size={24} />, name: 'First Blood', desc: 'Primeiro a palpitar no GP', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  'BULLSEYE': { icon: <ArrowUpRight size={24} />, name: 'Na Mosca', desc: 'Acertou o vencedor da corrida', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  'VETERAN': { icon: <Medal size={24} />, name: 'Veterano', desc: 'Participou de 5 GPs', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
};

const Profile: React.FC<ProfileProps> = ({ user, calendar }) => {
  
  const chartData = useMemo(() => {
    if (!user.pointsHistory || user.pointsHistory.length === 0) return [];
    
    return user.pointsHistory.map(ph => {
      const gp = calendar.find(c => c.id === ph.gpId);
      return {
        name: gp ? gp.location : `GP ${ph.gpId}`,
        pontos: ph.points
      };
    });
  }, [user.pointsHistory, calendar]);

  const userBadges = user.achievements || [];

  return (
    <div className="p-6 lg:p-12 pb-32">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-orange-600/10 p-3 rounded-2xl border border-orange-600/20">
          <Trophy className="text-orange-600 dark:text-orange-500" size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-black f1-font uppercase leading-none tracking-tighter text-gray-900 dark:text-white">Meu Perfil</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Estatísticas e Conquistas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: INFO BÁSICA & CONQUISTAS */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Card de Perfil */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-8 rounded-[32px] flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#e10600]/20 to-transparent"></div>
            
            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-[#0a0a0c] border-4 border-white dark:border-white/10 flex items-center justify-center overflow-hidden relative shadow-xl z-10 mb-4">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black f1-font text-gray-400 dark:text-gray-600">{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            
            <h3 className="text-2xl font-black f1-font uppercase text-gray-900 dark:text-white relative z-10">{user.name}</h3>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1 relative z-10">{user.email}</p>
            
            <div className="flex gap-4 mt-6 w-full relative z-10">
              <div className="flex-1 bg-gray-50 dark:bg-black/30 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                <span className="block text-2xl font-black f1-font text-[#e10600]">{user.points || 0}</span>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Pontos</span>
              </div>
              <div className="flex-1 bg-gray-50 dark:bg-black/30 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                <span className="block text-2xl font-black f1-font text-gray-900 dark:text-white">{user.rank || '-'}º</span>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Global</span>
              </div>
            </div>
          </div>

          {/* Conquistas */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <Medal size={16} className="text-yellow-500" /> Minhas Conquistas
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(BADGES).map(([key, badge]) => {
                const hasBadge = userBadges.includes(key);
                return (
                  <div 
                    key={key} 
                    className={`p-4 rounded-2xl border flex flex-col items-center text-center transition-all ${
                      hasBadge 
                        ? `${badge.bg} ${badge.border}` 
                        : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/5 opacity-50 grayscale'
                    }`}
                  >
                    <div className={`mb-2 ${hasBadge ? badge.color : 'text-gray-400'}`}>
                      {badge.icon}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${hasBadge ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                      {badge.name}
                    </span>
                    <span className="text-[8px] text-gray-500 font-bold leading-tight">
                      {badge.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA: GRÁFICO DE DESEMPENHO */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 lg:p-8 rounded-[32px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-500" /> Histórico de Pontos
              </h3>
            </div>

            {chartData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#6b7280" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 'bold' }}
                    />
                    <YAxis 
                      stroke="#6b7280" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 'bold' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#e10600' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pontos" 
                      stroke="#e10600" 
                      strokeWidth={4}
                      dot={{ r: 4, fill: '#e10600', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, fill: '#e10600', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-gray-400">
                <Calendar size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">Nenhum histórico disponível</p>
                <p className="text-[10px] mt-2">Participe dos GPs para ver sua evolução.</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default Profile;
