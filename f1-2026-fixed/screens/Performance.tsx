import React, { useMemo, useState } from 'react';
import { User, RaceGP, Prediction, SessionType } from '../types';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Award, Target, CheckCircle, XCircle, BarChart3, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { DRIVERS } from '../constants';

interface PerformanceProps {
  currentUser: User;
  users: User[];
  calendar: RaceGP[];
  predictions: Prediction[];
}

const Performance: React.FC<PerformanceProps> = ({ currentUser, users, calendar, predictions }) => {
  const [chartMode, setChartMode] = useState<'points' | 'position'>('points');
  const userPredictions = useMemo(() => predictions.filter(p => p.userId === currentUser.id), [predictions, currentUser.id]);

  const chartData = useMemo(() => {
    const finishedGPs = calendar.filter(gp => gp.results && Object.keys(gp.results).length > 0);
    let accumulated = 0;
    return finishedGPs.map(gp => {
      const sessions: SessionType[] = gp.isSprint
        ? ['Qualy Sprint', 'corrida Sprint', 'Qualy corrida', 'corrida principal']
        : ['Qualy corrida', 'corrida principal'];
      let gpPoints = 0;
      sessions.forEach(session => {
        const official = gp.results?.[session];
        if (!official) return;
        const pred = userPredictions.find(p => p.gpId === gp.id && p.session === session);
        if (!pred) return;
        (pred.top5 || []).forEach((driverId, idx) => {
          if (!driverId) return;
          if (official[idx] === driverId) gpPoints += 5;
          else if (official.includes(driverId)) gpPoints += 1;
        });
      });
      accumulated += gpPoints;
      return { name: gp.name.split(' ')[0], 'Pts no GP': gpPoints, 'Pts Acumulados': accumulated };
    });
  }, [calendar, userPredictions]);

  // Posições ao longo dos GPs
  const positionData = useMemo(() => {
    const finishedGPs = calendar.filter(gp => gp.results && Object.keys(gp.results).length > 0);
    return finishedGPs.map((gp, index) => {
      const pos = currentUser.positionHistory?.[index];
      return {
        name: gp.name.split(' ')[0],
        'Posição': pos && pos > 0 ? pos : null,
      };
    }).filter(d => d['Posição'] !== null);
  }, [calendar, currentUser.positionHistory]);

  const stats = useMemo(() => {
    let totalPredictions = 0, exactHits = 0, top5Hits = 0, misses = 0, bestGpPoints = 0, bestGpName = '';
    const finishedGPs = calendar.filter(gp => gp.results && Object.keys(gp.results).length > 0);
    finishedGPs.forEach(gp => {
      const sessions: SessionType[] = gp.isSprint
        ? ['Qualy Sprint', 'corrida Sprint', 'Qualy corrida', 'corrida principal']
        : ['Qualy corrida', 'corrida principal'];
      let gpPts = 0;
      sessions.forEach(session => {
        const official = gp.results?.[session];
        if (!official) return;
        const pred = userPredictions.find(p => p.gpId === gp.id && p.session === session);
        if (!pred) return;
        (pred.top5 || []).forEach((driverId, idx) => {
          if (!driverId) return;
          totalPredictions++;
          if (official[idx] === driverId) { exactHits++; gpPts += 5; }
          else if (official.includes(driverId)) { top5Hits++; gpPts += 1; }
          else misses++;
        });
      });
      if (gpPts > bestGpPoints) { bestGpPoints = gpPts; bestGpName = gp.name; }
    });
    const accuracy = totalPredictions > 0 ? Math.round(((exactHits + top5Hits) / totalPredictions) * 100) : 0;
    const exactRate = totalPredictions > 0 ? Math.round((exactHits / totalPredictions) * 100) : 0;
    return { totalPredictions, exactHits, top5Hits, misses, accuracy, exactRate, bestGpPoints, bestGpName };
  }, [calendar, userPredictions]);

  const userRank = useMemo(() => {
    const sorted = [...users].sort((a, b) => (b.points || 0) - (a.points || 0));
    return sorted.findIndex(u => u.id === currentUser.id) + 1;
  }, [users, currentUser.id]);

  const topDrivers = useMemo(() => {
    const dp: Record<string, { exact: number; top5: number; total: number }> = {};
    userPredictions.forEach(pred => {
      const gp = calendar.find(g => g.id === pred.gpId);
      if (!gp?.results?.[pred.session]) return;
      const official = gp.results[pred.session]!;
      (pred.top5 || []).forEach((driverId, idx) => {
        if (!driverId) return;
        if (!dp[driverId]) dp[driverId] = { exact: 0, top5: 0, total: 0 };
        if (official[idx] === driverId) { dp[driverId].exact++; dp[driverId].total += 5; }
        else if (official.includes(driverId)) { dp[driverId].top5++; dp[driverId].total += 1; }
      });
    });
    return Object.entries(dp)
      .map(([id, data]) => ({ id, ...data, driver: DRIVERS.find(d => d.id === id) }))
      .filter(d => d.total > 0).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [userPredictions, calendar]);

  const gpHistory = useMemo(() => {
    return calendar.filter(gp => gp.results && Object.keys(gp.results).length > 0).map(gp => {
      const sessions: SessionType[] = gp.isSprint
        ? ['Qualy Sprint', 'corrida Sprint', 'Qualy corrida', 'corrida principal']
        : ['Qualy corrida', 'corrida principal'];
      let pts = 0, hasPred = false;
      sessions.forEach(session => {
        const official = gp.results?.[session];
        if (!official) return;
        const pred = userPredictions.find(p => p.gpId === gp.id && p.session === session);
        if (!pred) return;
        hasPred = true;
        (pred.top5 || []).forEach((driverId, idx) => {
          if (!driverId) return;
          if (official[idx] === driverId) pts += 5;
          else if (official.includes(driverId)) pts += 1;
        });
      });
      return { gp, pts, hasPred };
    }).reverse();
  }, [calendar, userPredictions]);

  return (
    <div className="p-4 lg:p-12 pb-32">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-purple-600/20 p-3 rounded-2xl border border-purple-600/30">
            <BarChart3 className="text-purple-500" size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-black f1-font uppercase leading-none tracking-tighter text-gray-900 dark:text-white">Desempenho</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{currentUser.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-gray-200 dark:border-white/10 text-center">
            <p className="text-3xl font-black f1-font text-[#e10600]">{currentUser.points || 0}</p>
            <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mt-1">Pontos</p>
          </div>
          <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-gray-200 dark:border-white/10 text-center">
            <p className="text-3xl font-black f1-font text-yellow-500">{userRank > 0 ? `${userRank}º` : '-'}</p>
            <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mt-1">Posição</p>
          </div>
          <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-gray-200 dark:border-white/10 text-center">
            <p className="text-3xl font-black f1-font text-green-500">{stats.accuracy}%</p>
            <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mt-1">Acertos</p>
          </div>
          <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-gray-200 dark:border-white/10 text-center">
            <p className="text-3xl font-black f1-font text-orange-500">{stats.exactHits}</p>
            <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mt-1">Na Mosca</p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/5 rounded-[32px] p-6 border border-gray-200 dark:border-white/10 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500" />
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">
                {chartMode === 'points' ? 'Evolução de Pontos' : 'Evolução de Posições'}
              </h3>
            </div>
            {/* Toggle seta */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/10 rounded-xl p-1">
              <button
                onClick={() => setChartMode('points')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${chartMode === 'points' ? 'bg-white dark:bg-white/20 text-[#e10600] shadow-sm' : 'text-gray-400'}`}
              >
                <ChevronLeft size={12} /> Pts
              </button>
              <button
                onClick={() => setChartMode('position')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${chartMode === 'position' ? 'bg-white dark:bg-white/20 text-blue-500 shadow-sm' : 'text-gray-400'}`}
              >
                Pos <ChevronRight size={12} />
              </button>
            </div>
          </div>

          {chartMode === 'points' ? (
            chartData.length > 0 ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                    <defs>
                      <linearGradient id="colorPts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e10600" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#e10600" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#33333322" vertical={false} />
                    <XAxis dataKey="name" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: 12 }} />
                    <Area type="monotone" dataKey="Pts Acumulados" stroke="#e10600" strokeWidth={3} fill="url(#colorPts)" dot={{ r: 3, fill: '#e10600', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm font-bold">Sem GPs pontuados ainda.</div>
            )
          ) : (
            positionData.length > 0 ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={positionData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#33333322" vertical={false} />
                    <XAxis dataKey="name" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis reversed stroke="#666" tick={{ fill: '#888', fontSize: 10 }} tickLine={false} axisLine={false} domain={['dataMin', 'dataMax']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: 12 }}
                      formatter={(value: any) => [`${value}º lugar`, 'Posição']}
                    />
                    <Line type="monotone" dataKey="Posição" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm font-bold">Sem histórico de posições ainda.</div>
            )
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-white/5 rounded-[32px] p-6 border border-gray-200 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <Target size={18} className="text-green-500" />
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Precisão</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-green-500 flex items-center gap-1"><CheckCircle size={12} /> Na mosca (+5pts)</span>
                  <span className="text-gray-700 dark:text-gray-300">{stats.exactHits}x</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${stats.exactRate}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-blue-500 flex items-center gap-1"><CheckCircle size={12} /> No Top 5 (+1pt)</span>
                  <span className="text-gray-700 dark:text-gray-300">{stats.top5Hits}x</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.totalPredictions > 0 ? Math.round((stats.top5Hits / stats.totalPredictions) * 100) : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-red-500 flex items-center gap-1"><XCircle size={12} /> Errou</span>
                  <span className="text-gray-700 dark:text-gray-300">{stats.misses}x</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${stats.totalPredictions > 0 ? Math.round((stats.misses / stats.totalPredictions) * 100) : 0}%` }} />
                </div>
              </div>
              {stats.bestGpName && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
                  <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Melhor GP</p>
                  <p className="font-black text-gray-900 dark:text-white">{stats.bestGpName} <span className="text-yellow-500">+{stats.bestGpPoints}pts</span></p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-white/5 rounded-[32px] p-6 border border-gray-200 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <Award size={18} className="text-yellow-500" />
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Seus Pilotos</h3>
            </div>
            {topDrivers.length > 0 ? (
              <div className="space-y-3">
                {topDrivers.map((d, i) => (
                  <div key={d.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black f1-font text-gray-400 w-4">{i + 1}</span>
                      {d.driver?.image && (
                        <img src={d.driver.image} alt={d.driver.name} className="w-8 h-8 object-cover rounded-full bg-gray-100 dark:bg-white/10" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      )}
                      <div>
                        <p className="text-xs font-black text-gray-900 dark:text-white">{d.driver?.name || d.id}</p>
                        <p className="text-[10px] font-bold" style={{ color: d.driver?.color || '#888' }}>{d.driver?.team}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-blue-500">{d.total}pts</p>
                      <p className="text-[10px] text-gray-400">{d.exact}🎯 {d.top5}✓</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-gray-400 text-sm font-bold">Sem dados ainda.</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-white/5 rounded-[32px] p-6 border border-gray-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Flame size={18} className="text-orange-500" />
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Histórico por GP</h3>
          </div>
          {gpHistory.length > 0 ? (
            <div className="space-y-1">
              {gpHistory.map(({ gp, pts, hasPred }) => (
                <div key={gp.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${pts > 0 ? 'bg-green-500' : hasPred ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{gp.name}</p>
                    {gp.isSprint && <span className="text-[9px] bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-1.5 rounded font-black uppercase">Sprint</span>}
                  </div>
                  <div>
                    {hasPred
                      ? <span className={`text-sm font-black ${pts > 0 ? 'text-green-500' : 'text-red-400'}`}>{pts > 0 ? `+${pts}pts` : '0pts'}</span>
                      : <span className="text-xs text-gray-400 font-bold">Sem palpite</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-gray-400 text-sm font-bold">Nenhum GP finalizado ainda.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Performance;
