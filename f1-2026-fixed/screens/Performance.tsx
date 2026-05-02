import React, { useMemo } from 'react';
import { User, RaceGP, Prediction } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Award, BarChart3 } from 'lucide-react';
import { DRIVERS } from '../constants';

interface PerformanceProps {
  currentUser: User;
  calendar: RaceGP[];
  predictions: Prediction[];
}

const Performance: React.FC<PerformanceProps> = ({ currentUser, calendar, predictions }) => {
  // Dados do Gráfico de Posições
  const chartData = useMemo(() => {
    if (!currentUser.positionHistory || currentUser.positionHistory.length === 0) return [];
    
    return currentUser.positionHistory.map((pos, index) => {
      const gp = calendar[index];
      return {
        name: gp ? gp.name.split(' ')[0] : `GP ${index + 1}`,
        Posição: pos,
      };
    }).filter(d => d.Posição > 0);
  }, [currentUser.positionHistory, calendar]);

  // Pilotos que mais deram pontos
  const topDrivers = useMemo(() => {
    const driverPoints: Record<string, number> = {};
    
    // Para cada palpite do usuário, precisamos ver se ele acertou e quantos pontos ganhou.
    // Como os pontos já foram calculados e não temos o detalhamento por piloto no User,
    // vamos estimar baseado nos palpites que bateram com os resultados oficiais.
    
    const userPredictions = predictions.filter(p => p.userId === currentUser.id);
    
    userPredictions.forEach(pred => {
      const gp = calendar.find(g => g.id === pred.gpId);
      if (!gp || !gp.results || !gp.results[pred.session]) return;
      
      const officialTop5 = gp.results[pred.session] || [];
      
      pred.top5.forEach((driverId, index) => {
        if (!driverId) return;
        
        let pointsEarned = 0;
        const officialIndex = officialTop5.indexOf(driverId);
        
        if (officialIndex === index) {
          pointsEarned = 5; // Na mosca
        } else if (officialIndex !== -1) {
          pointsEarned = 1; // No Top 5
        }
        
        if (pointsEarned > 0) {
          driverPoints[driverId] = (driverPoints[driverId] || 0) + pointsEarned;
        }
      });
    });

    return Object.entries(driverPoints)
      .map(([id, points]) => {
        const driver = DRIVERS.find(d => d.id === id);
        return {
          id,
          name: driver?.name || id,
          color: driver?.color || '#ccc',
          points
        };
      })
      .sort((a, b) => b.points - a.points)
      .slice(0, 5); // Top 5 pilotos
  }, [predictions, currentUser.id, calendar]);

  return (
    <div className="p-6 lg:p-12 pb-32">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-purple-600/20 p-3 rounded-2xl border border-purple-600/30 dark:bg-purple-800 dark:border-purple-700">
          <BarChart3 className="text-purple-500" size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-black f1-font uppercase leading-none tracking-tighter text-gray-900 dark:text-white">Desempenho</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Seu histórico na temporada</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Evolução */}
        <div className="lg:col-span-2 bg-white dark:bg-white/5 p-6 rounded-[32px] border border-gray-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-blue-500">
            <TrendingUp size={20} />
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Evolução no Ranking</h3>
          </div>
          
          {chartData.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" tick={{ fill: '#666', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis reversed stroke="#666" tick={{ fill: '#666', fontSize: 10 }} tickLine={false} axisLine={false} domain={['dataMin', 'dataMax']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="Posição" stroke="#e10600" strokeWidth={3} dot={{ r: 4, fill: '#e10600', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400 dark:text-gray-500 font-bold text-sm">
              Sem dados suficientes para o gráfico.
            </div>
          )}
        </div>

        {/* Pilotos que mais deram pontos */}
        <div className="bg-white dark:bg-white/5 p-6 rounded-[32px] border border-gray-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-yellow-500">
            <Award size={20} />
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Melhores Pilotos</h3>
          </div>

          {topDrivers.length > 0 ? (
            <div className="space-y-4">
              {topDrivers.map((driver, index) => (
                <div key={driver.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black f1-font text-gray-400">{index + 1}</span>
                    <div className="w-1 h-8 rounded-full" style={{ backgroundColor: driver.color }}></div>
                    <span className="font-bold text-sm text-gray-900 dark:text-white">{driver.name}</span>
                  </div>
                  <span className="font-black text-blue-600 dark:text-blue-400">{driver.points} pts</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 flex items-center justify-center text-center text-gray-400 dark:text-gray-500 font-bold text-sm">
              Você ainda não pontuou com nenhum piloto.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Performance;
