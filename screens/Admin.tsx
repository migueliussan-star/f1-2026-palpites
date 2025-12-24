
import React, { useState, useEffect } from 'react';
import { RaceGP, SessionType } from '../types';
import { DRIVERS } from '../constants';
import { Settings, Lock, Unlock, CheckCircle, PlayCircle, Trophy, Save, Trash2, AlertTriangle } from 'lucide-react';

interface AdminProps {
  gp: RaceGP;
  calendar: RaceGP[];
  onUpdateCalendar: (newCalendar: RaceGP[]) => void;
  onSelectGp: (id: number) => void;
  onCalculatePoints: (gp: RaceGP) => Promise<void> | void;
  onResetHistory: () => void;
}

const Admin: React.FC<AdminProps> = ({ gp, calendar, onUpdateCalendar, onSelectGp, onCalculatePoints, onResetHistory }) => {
  const [activeResultSession, setActiveResultSession] = useState<SessionType>('Qualy corrida');
  const [showToast, setShowToast] = useState(false);
  const [editingDate, setEditingDate] = useState(gp.date);

  useEffect(() => {
    setEditingDate(gp.date);
  }, [gp.id, gp.date]);

  const handleUpdateDate = () => {
    const newCalendar = calendar.map(c => {
      if (c.id === gp.id) {
        return { ...c, date: editingDate };
      }
      return c;
    });
    onUpdateCalendar(newCalendar);
    alert(`Data do GP ${gp.name} atualizada para: ${editingDate}`);
  };

  const setActiveGP = () => {
    const newCalendar: RaceGP[] = calendar.map(c => ({
      ...c,
      status: (c.id === gp.id ? 'OPEN' : (c.id < gp.id ? 'FINISHED' : 'UPCOMING')) as RaceGP['status']
    }));
    onUpdateCalendar(newCalendar);
    alert(`${gp.name} agora é o GP Ativo!`);
  };

  const toggleSession = (session: string) => {
    const newCalendar = calendar.map(c => {
      if (c.id === gp.id) {
        return {
          ...c,
          sessionStatus: {
            ...c.sessionStatus,
            [session]: !c.sessionStatus[session]
          }
        };
      }
      return c;
    });
    onUpdateCalendar(newCalendar);
  };

  const updateResult = (session: SessionType, pos: number, driverId: string) => {
    const newCalendar = calendar.map(c => {
      if (c.id === gp.id) {
        const results = c.results || {};
        const sessionResult = results[session] || ['', '', '', '', ''];
        sessionResult[pos] = driverId;
        return { ...c, results: { ...results, [session]: sessionResult } };
      }
      return c;
    });
    onUpdateCalendar(newCalendar);
  };

  const sessions: SessionType[] = gp.isSprint 
    ? ['Qualy Sprint', 'corrida Sprint', 'Qualy corrida', 'corrida principal']
    : ['Qualy corrida', 'corrida principal'];

  return (
    <div className="p-6 relative">
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white px-6 py-4 rounded-2xl font-black text-xs shadow-2xl flex items-center gap-3 border-2 border-green-400 animate-in fade-in zoom-in duration-300">
          <CheckCircle size={18} /> PONTOS CALCULADOS COM SUCESSO!
        </div>
      )}

      <div className="flex items-center gap-3 mb-8">
        <div className="bg-red-600/10 p-2 rounded-xl">
            <Settings className="text-[#e10600]" size={20} />
        </div>
        <h2 className="text-2xl font-black f1-font tracking-tighter uppercase">Painel ADM</h2>
      </div>

      <div className="space-y-6 pb-24">
        <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
          <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3 block">Gerenciar Grande Prêmio</label>
          <select 
            value={gp.id} 
            onChange={(e) => onSelectGp(Number(e.target.value))}
            className="w-full bg-[#1a1a1e] border border-white/10 rounded-2xl p-4 text-sm font-bold appearance-none outline-none focus:border-red-600 mb-4"
          >
            {calendar.map(c => (
              <option key={c.id} value={c.id}>{c.name} {c.isSprint ? '(Sprint)' : ''}</option>
            ))}
          </select>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
              <div className="flex-1">
                <p className="text-[8px] uppercase text-gray-500 font-black mb-1">Data do Evento (ex: 15-17 Mar)</p>
                <input 
                  type="text" 
                  value={editingDate}
                  onChange={(e) => setEditingDate(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold outline-none border-b border-white/10 focus:border-[#e10600] pb-1"
                />
              </div>
              <button 
                onClick={handleUpdateDate}
                className="bg-[#e10600] p-3 rounded-xl text-white active:scale-95 transition-all shadow-lg shadow-red-600/20"
                title="Salvar Nova Data"
              >
                <Save size={16} />
              </button>
            </div>
          </div>

          <button 
            onClick={setActiveGP}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-600/20"
          >
            <PlayCircle size={16} /> Definir como GP Ativo
          </button>
        </div>

        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 shadow-xl">
          <h3 className="text-xs font-black mb-6 uppercase tracking-widest text-green-500 flex items-center gap-2">
            <Trophy size={14} /> Inserir Resultados Oficiais
          </h3>
          
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {sessions.map(s => (
              <button 
                key={s}
                onClick={() => setActiveResultSession(s)}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase border whitespace-nowrap transition-all ${activeResultSession === s ? 'bg-green-600 text-white border-green-600' : 'bg-white/5 text-gray-500 border-white/5'}`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="space-y-3 mb-8">
            {[0, 1, 2, 3, 4].map((idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-4 text-xs font-black f1-font text-gray-500">{idx + 1}</span>
                <select 
                  value={gp.results?.[activeResultSession]?.[idx] || ''}
                  onChange={(e) => updateResult(activeResultSession, idx, e.target.value)}
                  className="flex-1 bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-xs font-bold outline-none focus:border-green-500"
                >
                  <option value="">Selecione o piloto...</option>
                  {DRIVERS.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <button 
            onClick={async () => {
                await onCalculatePoints(gp);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            }}
            className="w-full bg-green-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 active:scale-95 transition-all"
          >
            SALVAR RESULTADOS E CALCULAR PONTOS
          </button>
        </div>

        <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
          <h3 className="text-xs font-black mb-6 uppercase tracking-widest text-[#e10600]">Travar/Liberar Votações</h3>
          <div className="space-y-3">
            {sessions.map(session => (
              <div key={session} className="flex items-center justify-between p-4 bg-[#0a0a0c] rounded-2xl border border-white/5">
                <span className="font-bold text-xs uppercase tracking-tight">{session}</span>
                <button 
                  onClick={() => toggleSession(session)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${
                    gp.sessionStatus[session] === false 
                      ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                      : 'bg-green-500/10 text-green-500 border border-green-500/20'
                  }`}
                >
                  {gp.sessionStatus[session] === false ? <><Lock size={12} /> BLOQUEADA</> : <><Unlock size={12} /> ABERTA</>}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ZONA DE PERIGO */}
        <div className="bg-red-900/10 p-6 rounded-3xl border border-red-500/20">
            <h3 className="text-xs font-black mb-4 uppercase tracking-widest text-red-500 flex items-center gap-2">
                <AlertTriangle size={14} /> Zona de Perigo
            </h3>
            <p className="text-[10px] text-gray-500 mb-4 leading-relaxed">
                Ações aqui são irreversíveis e afetam todos os usuários. Use com cautela.
            </p>
            <button 
                onClick={onResetHistory}
                className="w-full bg-red-600/10 border border-red-600/50 text-red-500 hover:bg-red-600 hover:text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
            >
                <Trash2 size={16} /> RESETAR GRÁFICO DE DOMINÂNCIA
            </button>
        </div>
      </div>
    </div>
  );
};

export default Admin;
