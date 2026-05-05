import React, { useMemo, useState } from 'react';
import { User, RaceGP, Prediction, SessionType } from '../types';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Award, Target, CheckCircle, XCircle, BarChart3, Flame, User as UserIcon, Users, Swords } from 'lucide-react';
import { DRIVERS } from '../constants';

interface PerformanceProps {
  currentUser: User;
  users: User[];
  calendar: RaceGP[];
  predictions: Prediction[];
}

type ViewMode = 'individual' | 'geral' | 'versus';
type ChartType = 'points' | 'position';

function calcUserPoints(userId: string, calendar: RaceGP[], predictions: Prediction[]) {
  const userPreds = predictions.filter(p => p.userId === userId);
  const finishedGPs = calendar.filter(gp => gp.results && Object.keys(gp.results).length > 0);
  let accumulated = 0;
  const gpData = finishedGPs.map(gp => {
    const sessions: SessionType[] = gp.isSprint
      ? ['Qualy Sprint', 'corrida Sprint', 'Qualy corrida', 'corrida principal']
      : ['Qualy corrida', 'corrida principal'];
    let gpPts = 0;
    let exactHits = 0, top5Hits = 0, misses = 0, hasPred = false;
    sessions.forEach(session => {
      const official = gp.results?.[session];
      if (!official) return;
      const pred = userPreds.find(p => p.gpId === gp.id && p.session === session);
      if (!pred) return;
      hasPred = true;
      (pred.top5 || []).forEach((driverId, idx) => {
        if (!driverId) return;
        if (official[idx] === driverId) { exactHits++; gpPts += 5; }
        else if (official.includes(driverId)) { top5Hits++; gpPts += 1; }
        else misses++;
      });
    });
    accumulated += gpPts;
    return { gpName: gp.name.split(' ')[0], gpPts, accumulated, exactHits, top5Hits, misses, hasPred, gp };
  });
  return gpData;
}

// Calcula posição de cada usuário em cada GP com base nos pontos acumulados
function calcPositionHistory(userId: string, users: User[], calendar: RaceGP[], predictions: Prediction[]) {
  const finishedGPs = calendar.filter(gp => gp.results && Object.keys(gp.results).length > 0);
  // Pre-calc accumulated points per user per GP index
  const allAccumulated: Record<string, number[]> = {};
  users.forEach(u => {
    const data = calcUserPoints(u.id, calendar, predictions);
    allAccumulated[u.id] = data.map(d => d.accumulated);
  });
  return finishedGPs.map((gp, i) => {
    const pointsAtThisGP = users.map(u => ({ id: u.id, pts: allAccumulated[u.id]?.[i] ?? 0 }));
    pointsAtThisGP.sort((a, b) => b.pts - a.pts);
    const pos = pointsAtThisGP.findIndex(u => u.id === userId) + 1;
    return { name: gp.name.split(' ')[0], 'Posição': pos > 0 ? pos : null };
  });
}

function calcStats(gpData: ReturnType<typeof calcUserPoints>) {
  let exactHits = 0, top5Hits = 0, misses = 0, totalPredictions = 0, bestGpPoints = 0, bestGpName = '';
  gpData.forEach(d => {
    exactHits += d.exactHits; top5Hits += d.top5Hits; misses += d.misses;
    totalPredictions += d.exactHits + d.top5Hits + d.misses;
    if (d.gpPts > bestGpPoints) { bestGpPoints = d.gpPts; bestGpName = d.gp.name; }
  });
  const accuracy = totalPredictions > 0 ? Math.round(((exactHits + top5Hits) / totalPredictions) * 100) : 0;
  const exactRate = totalPredictions > 0 ? Math.round((exactHits / totalPredictions) * 100) : 0;
  return { exactHits, top5Hits, misses, totalPredictions, accuracy, exactRate, bestGpPoints, bestGpName };
}

const Performance: React.FC<PerformanceProps> = ({ currentUser, users, calendar, predictions }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('individual');
  const [chartType, setChartType] = useState<ChartType>('points');
  const [vsUser1, setVsUser1] = useState<string>(currentUser.id);
  const [vsUser2, setVsUser2] = useState<string>('');

  const userPredictions = useMemo(() => predictions.filter(p => p.userId === currentUser.id), [predictions, currentUser.id]);

  const myGpData = useMemo(() => calcUserPoints(currentUser.id, calendar, predictions), [currentUser.id, calendar, predictions]);
  const myStats = useMemo(() => calcStats(myGpData), [myGpData]);

  const userRank = useMemo(() => {
    const sorted = [...users].sort((a, b) => (b.points || 0) - (a.points || 0));
    return sorted.findIndex(u => u.id === currentUser.id) + 1;
  }, [users, currentUser.id]);

  // Posição individual por GP
  const myPositionData = useMemo(() => calcPositionHistory(currentUser.id, users, calendar, predictions), [currentUser.id, users, calendar, predictions]);

  // Posição vs por GP
  const vsUser1PositionData = useMemo(() => vsUser1 ? calcPositionHistory(vsUser1, users, calendar, predictions) : [], [vsUser1, users, calendar, predictions]);
  const vsUser2PositionData = useMemo(() => vsUser2 ? calcPositionHistory(vsUser2, users, calendar, predictions) : [], [vsUser2, users, calendar, predictions]);

  const geralUsers = useMemo(() => [...users].sort((a, b) => (b.points || 0) - (a.points || 0)), [users]);

  // Geral posição por GP para todos os usuários
  const geralPositionData = useMemo(() => {
    const finishedGPs = calendar.filter(gp => gp.results && Object.keys(gp.results).length > 0);
    const allAccumulated: Record<string, number[]> = {};
    geralUsers.forEach(u => {
      const data = calcUserPoints(u.id, calendar, predictions);
      allAccumulated[u.id] = data.map(d => d.accumulated);
    });
    return finishedGPs.map((gp, i) => {
      const obj: any = { name: gp.name.split(' ')[0] };
      const pointsAtGP = geralUsers.map(u => ({ id: u.id, pts: allAccumulated[u.id]?.[i] ?? 0 }));
      pointsAtGP.sort((a, b) => b.pts - a.pts);
      geralUsers.forEach(u => {
        const pos = pointsAtGP.findIndex(x => x.id === u.id) + 1;
        obj[u.name] = pos > 0 ? pos : null;
      });
      return obj;
    });
  }, [calendar, geralUsers, predictions]);

  // Geral: todos os usuários acumulados
  const geralChartData = useMemo(() => {
    const finishedGPs = calendar.filter(gp => gp.results && Object.keys(gp.results).length > 0);
    const sortedUsers = [...users].sort((a, b) => (b.points || 0) - (a.points || 0));
    return finishedGPs.map(gp => {
      const obj: any = { name: gp.name.split(' ')[0] };
      sortedUsers.forEach(u => {
        const data = calcUserPoints(u.id, calendar, predictions);
        const gpEntry = data.find(d => d.gp.id === gp.id);
        obj[u.name] = gpEntry?.accumulated ?? 0;
      });
      return obj;
    });
  }, [calendar, users, predictions]);

  const BASE_COLORS = ['#e10600','#3b82f6','#22c55e','#f97316','#a855f7','#eab308','#ec4899','#14b8a6','#8b5cf6','#f43f5e','#0ea5e9','#84cc16','#f97316','#06b6d4','#d946ef','#64748b','#a16207','#be123c','#065f46','#1e3a8a'];
  const getColor = (i: number) => BASE_COLORS[i % BASE_COLORS.length];

  // Versus
  const vsUser1Data = useMemo(() => vsUser1 ? calcUserPoints(vsUser1, calendar, predictions) : [], [vsUser1, calendar, predictions]);
  const vsUser2Data = useMemo(() => vsUser2 ? calcUserPoints(vsUser2, calendar, predictions) : [], [vsUser2, calendar, predictions]);
  const vsChartData = useMemo(() => {
    const finishedGPs = calendar.filter(gp => gp.results && Object.keys(gp.results).length > 0);
    const u1 = users.find(u => u.id === vsUser1);
    const u2 = users.find(u => u.id === vsUser2);
    return finishedGPs.map(gp => {
      const d1 = vsUser1Data.find(d => d.gp.id === gp.id);
      const d2 = vsUser2Data.find(d => d.gp.id === gp.id);
      return {
        name: gp.name.split(' ')[0],
        [u1?.name || 'Jogador 1']: d1?.accumulated ?? 0,
        [u2?.name || 'Jogador 2']: d2?.accumulated ?? 0,
      };
    });
  }, [vsUser1Data, vsUser2Data, calendar, users, vsUser1, vsUser2]);

  const vsUser1Obj = users.find(u => u.id === vsUser1);
  const vsUser2Obj = users.find(u => u.id === vsUser2);

  // Posição 1v1 combinada por GP
  const vsPositionChartData = useMemo(() => {
    const finishedGPs = calendar.filter(gp => gp.results && Object.keys(gp.results).length > 0);
    return finishedGPs.map((gp, i) => {
      const obj: any = { name: gp.name.split(' ')[0] };
      if (vsUser1Obj) obj[vsUser1Obj.name] = vsUser1PositionData[i]?.['Posição'] ?? null;
      if (vsUser2Obj) obj[vsUser2Obj.name] = vsUser2PositionData[i]?.['Posição'] ?? null;
      return obj;
    });
  }, [calendar, vsUser1Obj, vsUser2Obj, vsUser1PositionData, vsUser2PositionData]);
  const vsUser1Stats = useMemo(() => calcStats(vsUser1Data), [vsUser1Data]);
  const vsUser2Stats = useMemo(() => calcStats(vsUser2Data), [vsUser2Data]);

  // Top pilotos
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

  const gpHistory = useMemo(() => myGpData.map(d => ({ gp: d.gp, pts: d.gpPts, hasPred: d.hasPred })).reverse(), [myGpData]);

  const tooltipStyle = { backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: 12 };
  const axisStyle = { fill: '#888', fontSize: 10 };

  // Chart toggle button component
  const ChartToggle = () => (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/10 rounded-xl p-1">
      <button onClick={() => setChartType('points')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${chartType === 'points' ? 'bg-white dark:bg-white/20 text-[#e10600] shadow-sm' : 'text-gray-400'}`}>
        Pts
      </button>
      <button onClick={() => setChartType('position')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${chartType === 'position' ? 'bg-white dark:bg-white/20 text-blue-500 shadow-sm' : 'text-gray-400'}`}>
        Pos
      </button>
    </div>
  );

  return (
    <div className="p-4 lg:p-12 pb-32">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-600/20 p-3 rounded-2xl border border-purple-600/30">
            <BarChart3 className="text-purple-500" size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-black f1-font uppercase leading-none tracking-tighter text-gray-900 dark:text-white">Desempenho</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{currentUser.name}</p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-8 bg-gray-100 dark:bg-white/5 p-1.5 rounded-2xl">
          <button onClick={() => setViewMode('individual')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all ${viewMode === 'individual' ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400'}`}>
            <UserIcon size={13} /> Individual
          </button>
          <button onClick={() => setViewMode('geral')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all ${viewMode === 'geral' ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400'}`}>
            <Users size={13} /> Geral
          </button>
          <button onClick={() => setViewMode('versus')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all ${viewMode === 'versus' ? 'bg-white dark:bg-white/15 text-[#e10600] shadow-sm' : 'text-gray-400'}`}>
            <Swords size={13} /> 1 vs 1
          </button>
        </div>

        {/* ===== INDIVIDUAL ===== */}
        {viewMode === 'individual' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-gray-200 dark:border-white/10 text-center">
                <p className="text-3xl font-black f1-font text-[#e10600]">{currentUser.points || 0}</p>
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mt-1">Pontos</p>
              </div>
              <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-gray-200 dark:border-white/10 text-center">
                <p className="text-3xl font-black f1-font text-yellow-500">{userRank > 0 ? `${userRank}º` : '-'}</p>
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mt-1">Posição</p>
              </div>
              <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-gray-200 dark:border-white/10 text-center">
                <p className="text-3xl font-black f1-font text-green-500">{myStats.accuracy}%</p>
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mt-1">Acertos</p>
              </div>
              <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-gray-200 dark:border-white/10 text-center">
                <p className="text-3xl font-black f1-font text-orange-500">{myStats.exactHits}</p>
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mt-1">Na Mosca</p>
              </div>
            </div>

            {/* Gráfico Individual */}
            <div className="bg-white dark:bg-white/5 rounded-[32px] p-6 border border-gray-200 dark:border-white/10 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">
                    {chartType === 'points' ? 'Evolução de Pontos' : 'Evolução de Posições'}
                  </h3>
                </div>
                <ChartToggle />
              </div>
              {chartType === 'points' ? (
                myGpData.length > 0 ? (
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={myGpData.map(d => ({ name: d.gpName, 'Pts Acumulados': d.accumulated }))} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                        <defs>
                          <linearGradient id="colorPts" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#e10600" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#e10600" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#33333322" vertical={false} />
                        <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} />
                        <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Area type="monotone" dataKey="Pts Acumulados" stroke="#e10600" strokeWidth={3} fill="url(#colorPts)" dot={{ r: 3, fill: '#e10600', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm font-bold">Sem GPs pontuados ainda.</div>
              ) : (
                myPositionData.length > 0 ? (
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={myPositionData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#33333322" vertical={false} />
                        <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} />
                        <YAxis reversed allowDecimals={false} tick={axisStyle} tickLine={false} axisLine={false} domain={[1, users.length]} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}º lugar`, 'Posição']} />
                        <Line type="monotone" dataKey="Posição" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm font-bold">Sem GPs pontuados ainda.</div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Precisão */}
              <div className="bg-white dark:bg-white/5 rounded-[32px] p-6 border border-gray-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-2 mb-5"><Target size={18} className="text-green-500" /><h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Precisão</h3></div>
                <div className="space-y-4">
                  {[
                    { label: 'Na mosca (+5pts)', value: myStats.exactHits, rate: myStats.exactRate, color: 'bg-green-500', textColor: 'text-green-500', icon: <CheckCircle size={12} /> },
                    { label: 'No Top 5 (+1pt)', value: myStats.top5Hits, rate: myStats.totalPredictions > 0 ? Math.round((myStats.top5Hits / myStats.totalPredictions) * 100) : 0, color: 'bg-blue-500', textColor: 'text-blue-500', icon: <CheckCircle size={12} /> },
                    { label: 'Errou', value: myStats.misses, rate: myStats.totalPredictions > 0 ? Math.round((myStats.misses / myStats.totalPredictions) * 100) : 0, color: 'bg-red-500', textColor: 'text-red-500', icon: <XCircle size={12} /> },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className={`${item.textColor} flex items-center gap-1`}>{item.icon} {item.label}</span>
                        <span className="text-gray-700 dark:text-gray-300">{item.value}x</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.rate}%` }} />
                      </div>
                    </div>
                  ))}
                  {myStats.bestGpName && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
                      <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Melhor GP</p>
                      <p className="font-black text-gray-900 dark:text-white">{myStats.bestGpName} <span className="text-yellow-500">+{myStats.bestGpPoints}pts</span></p>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Pilotos */}
              <div className="bg-white dark:bg-white/5 rounded-[32px] p-6 border border-gray-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-2 mb-5"><Award size={18} className="text-yellow-500" /><h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Seus Pilotos</h3></div>
                {topDrivers.length > 0 ? (
                  <div className="space-y-3">
                    {topDrivers.map((d, i) => (
                      <div key={d.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black f1-font text-gray-400 w-4">{i + 1}</span>
                          {d.driver?.image && <img src={d.driver.image} alt={d.driver.name} className="w-8 h-8 object-cover rounded-full bg-gray-100" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
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
                ) : <div className="py-10 text-center text-gray-400 text-sm font-bold">Sem dados ainda.</div>}
              </div>
            </div>

            {/* Histórico */}
            <div className="bg-white dark:bg-white/5 rounded-[32px] p-6 border border-gray-200 dark:border-white/10 shadow-sm">
              <div className="flex items-center gap-2 mb-5"><Flame size={18} className="text-orange-500" /><h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Histórico por GP</h3></div>
              {gpHistory.length > 0 ? (
                <div className="space-y-1">
                  {gpHistory.map(({ gp, pts, hasPred }) => (
                    <div key={gp.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${pts > 0 ? 'bg-green-500' : hasPred ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{gp.name}</p>
                        {gp.isSprint && <span className="text-[9px] bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-1.5 rounded font-black uppercase">Sprint</span>}
                      </div>
                      {hasPred ? <span className={`text-sm font-black ${pts > 0 ? 'text-green-500' : 'text-red-400'}`}>{pts > 0 ? `+${pts}pts` : '0pts'}</span>
                        : <span className="text-xs text-gray-400 font-bold">Sem palpite</span>}
                    </div>
                  ))}
                </div>
              ) : <div className="py-10 text-center text-gray-400 text-sm font-bold">Nenhum GP finalizado ainda.</div>}
            </div>
          </>
        )}

        {/* ===== GERAL ===== */}
        {viewMode === 'geral' && (
          <div className="bg-white dark:bg-white/5 rounded-[32px] p-6 border border-gray-200 dark:border-white/10 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-500" />
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">
                  {chartType === 'points' ? 'Pontos — Top 5 da Liga' : 'Posições — Top 5 da Liga'}
                </h3>
              </div>
              <ChartToggle />
            </div>

            {chartType === 'points' ? (
              geralChartData.length > 0 ? (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={geralChartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#33333322" vertical={false} />
                      <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} />
                      <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      {geralUsers.map((u, i) => (
                        <Line key={u.id} type="monotone" dataKey={u.name} stroke={getColor(i)} strokeWidth={u.id === currentUser.id ? 3 : 2} dot={false} activeDot={{ r: 4 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 mt-4 justify-center">
                    {geralUsers.map((u, i) => (
                      <div key={u.id} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColor(i) }} />
                        <span className={`text-[10px] font-black ${u.id === currentUser.id ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{u.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm font-bold">Sem GPs pontuados ainda.</div>
            ) : (
              geralPositionData.length > 0 ? (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={geralPositionData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#33333322" vertical={false} />
                      <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} />
                      <YAxis reversed allowDecimals={false} tick={axisStyle} tickLine={false} axisLine={false} domain={[1, users.length]} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: any, name: any) => [`${v}º`, name]} />
                      {geralUsers.map((u, i) => (
                        <Line key={u.id} type="monotone" dataKey={u.name} stroke={getColor(i)} strokeWidth={u.id === currentUser.id ? 3 : 2} dot={false} activeDot={{ r: 4 }} connectNulls />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 mt-4 justify-center">
                    {geralUsers.map((u, i) => (
                      <div key={u.id} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColor(i) }} />
                        <span className={`text-[10px] font-black ${u.id === currentUser.id ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{u.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm font-bold">Sem GPs pontuados ainda.</div>
            )}
          </div>
        )}

        {/* ===== VERSUS ===== */}
        {viewMode === 'versus' && (
          <>
            {/* Seleção */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-2">Jogador 1</p>
                <select value={vsUser1} onChange={e => setVsUser1(e.target.value)} className="w-full bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e10600]">
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-2">Jogador 2</p>
                <select value={vsUser2} onChange={e => setVsUser2(e.target.value)} className="w-full bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Selecione...</option>
                  {users.filter(u => u.id !== vsUser1).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>

            {vsUser2 ? (
              <>
                {/* Placar */}
                <div className="flex items-center justify-center gap-6 mb-6 bg-white dark:bg-white/5 rounded-[32px] p-6 border border-gray-200 dark:border-white/10">
                  <div className="text-center flex-1">
                    <div className={`w-14 h-14 rounded-full overflow-hidden mx-auto mb-2 border-4 ${(vsUser1Obj?.points || 0) >= (vsUser2Obj?.points || 0) ? 'border-[#e10600]' : 'border-gray-200 dark:border-white/10'}`}>
                      {vsUser1Obj?.avatarUrl ? <img src={vsUser1Obj.avatarUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-gray-100 dark:bg-white/10 flex items-center justify-center font-black text-lg text-gray-500">{(vsUser1Obj?.name ?? '?').charAt(0)}</div>}
                    </div>
                    <p className="text-xs font-black text-gray-900 dark:text-white truncate">{vsUser1Obj?.name}</p>
                    <p className="text-3xl font-black f1-font text-[#e10600] mt-1">{vsUser1Obj?.points || 0}</p>
                    <p className="text-[10px] text-gray-400 font-bold">pontos</p>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-2xl font-black f1-font text-gray-300 dark:text-gray-600">VS</p>
                  </div>
                  <div className="text-center flex-1">
                    <div className={`w-14 h-14 rounded-full overflow-hidden mx-auto mb-2 border-4 ${(vsUser2Obj?.points || 0) > (vsUser1Obj?.points || 0) ? 'border-blue-500' : 'border-gray-200 dark:border-white/10'}`}>
                      {vsUser2Obj?.avatarUrl ? <img src={vsUser2Obj.avatarUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-gray-100 dark:bg-white/10 flex items-center justify-center font-black text-lg text-gray-500">{(vsUser2Obj?.name ?? '?').charAt(0)}</div>}
                    </div>
                    <p className="text-xs font-black text-gray-900 dark:text-white truncate">{vsUser2Obj?.name}</p>
                    <p className="text-3xl font-black f1-font text-blue-500 mt-1">{vsUser2Obj?.points || 0}</p>
                    <p className="text-[10px] text-gray-400 font-bold">pontos</p>
                  </div>
                </div>

                {/* Gráfico Versus */}
                <div className="bg-white dark:bg-white/5 rounded-[32px] p-6 border border-gray-200 dark:border-white/10 shadow-sm mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={18} className="text-blue-500" />
                      <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">
                        {chartType === 'points' ? 'Pontos Acumulados' : 'Evolução de Posições'}
                      </h3>
                    </div>
                    <ChartToggle />
                  </div>
                  {chartType === 'points' ? (
                    vsChartData.length > 0 ? (
                      <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={vsChartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#33333322" vertical={false} />
                            <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} />
                            <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Line type="monotone" dataKey={vsUser1Obj?.name} stroke="#e10600" strokeWidth={3} dot={{ r: 3, fill: '#e10600', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 5 }} connectNulls />
                            <Line type="monotone" dataKey={vsUser2Obj?.name} stroke="#3b82f6" strokeWidth={3} dot={{ r: 3, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 5 }} connectNulls />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm font-bold">Sem GPs pontuados ainda.</div>
                  ) : (
                    vsPositionChartData.length > 0 ? (
                      <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={vsPositionChartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#33333322" vertical={false} />
                            <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} />
                            <YAxis reversed allowDecimals={false} tick={axisStyle} tickLine={false} axisLine={false} domain={[1, users.length]} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(v: any, name: any) => [`${v}º lugar`, name]} />
                            <Line type="monotone" dataKey={vsUser1Obj?.name} stroke="#e10600" strokeWidth={3} dot={{ r: 3, fill: '#e10600', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 5 }} connectNulls />
                            <Line type="monotone" dataKey={vsUser2Obj?.name} stroke="#3b82f6" strokeWidth={3} dot={{ r: 3, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 5 }} connectNulls />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm font-bold">Sem GPs pontuados ainda.</div>
                  )}
                </div>

                {/* Stats comparativas */}
                <div className="bg-white dark:bg-white/5 rounded-[32px] p-6 border border-gray-200 dark:border-white/10 shadow-sm">
                  <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-5">Comparativo</p>
                  {[
                    { label: 'Na Mosca', v1: vsUser1Stats.exactHits, v2: vsUser2Stats.exactHits },
                    { label: 'No Top 5', v1: vsUser1Stats.top5Hits, v2: vsUser2Stats.top5Hits },
                    { label: '% Acerto', v1: vsUser1Stats.accuracy, v2: vsUser2Stats.accuracy, suffix: '%' },
                    { label: 'Melhor GP', v1: vsUser1Stats.bestGpPoints, v2: vsUser2Stats.bestGpPoints, suffix: 'pts' },
                  ].map(row => {
                    const max = Math.max(row.v1, row.v2);
                    return (
                      <div key={row.label} className="flex items-center gap-3 mb-4 last:mb-0">
                        <span className={`text-sm font-black w-12 text-right ${row.v1 >= row.v2 ? 'text-[#e10600]' : 'text-gray-400'}`}>{row.v1}{row.suffix || 'x'}</span>
                        <div className="flex-1">
                          <div className="flex h-2 gap-1">
                            <div className="flex-1 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden flex justify-end">
                              <div className="h-full bg-[#e10600] rounded-full transition-all" style={{ width: max > 0 ? `${(row.v1 / max) * 100}%` : '0%' }} />
                            </div>
                            <div className="flex-1 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: max > 0 ? `${(row.v2 / max) * 100}%` : '0%' }} />
                            </div>
                          </div>
                          <p className="text-[10px] text-center text-gray-400 font-bold mt-1">{row.label}</p>
                        </div>
                        <span className={`text-sm font-black w-12 ${row.v2 > row.v1 ? 'text-blue-500' : 'text-gray-400'}`}>{row.v2}{row.suffix || 'x'}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-white/5 rounded-[32px] p-16 border border-gray-200 dark:border-white/10 text-center">
                <Swords size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-sm font-black text-gray-400">Selecione dois jogadores para comparar</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Performance;
