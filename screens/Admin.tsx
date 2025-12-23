
import React, { useState } from 'react';
import { RaceGP, SessionType, Driver } from '../types';
import { DRIVERS } from '../constants';
import { Settings, Lock, Unlock, Calendar as CalIcon, CheckCircle, ShieldCheck, PlayCircle, Trophy } from 'lucide-react';

interface AdminProps {
  gp: RaceGP;
  calendar: RaceGP[];
  onUpdateCalendar: (newCalendar: RaceGP[]) => void;
  onSelectGp: (id: number) => void;
  onCalculatePoints: (gp: RaceGP) => void;
}

const Admin: React.FC<AdminProps> = ({ gp, calendar, onUpdateCalendar, onSelectGp, onCalculatePoints }) => {
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeResultSession, setActiveResultSession] = useState<SessionType>('Qualy corrida');
  const [showToast, setShowToast] = useState(false);

  const checkPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '22138379') {
      setIsUnlocked(true);
    } else {
      alert('Senha incorreta!');
    }
  };

  // Fixed type inference by casting the status property to ensure it matches the RaceGP definition
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

  const sessions = gp.isSprint 
    ? ['Qualy Sprint', 'corrida Sprint', 'Qualy corrida', 'corrida principal'] as SessionType[]
    : ['Qualy corrida', 'corrida principal'] as SessionType[];

  if (!isUnlocked) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 w-full text-center">
          <ShieldCheck size={48} className="text-[#e10600] mx-auto mb-6" />
          <h2 className="text-xl font-black f1-font mb-2 tracking-tighter">ÁREA RESTRITA</h2>
          <p className="text-xs text-gray-500 mb-8 uppercase tracking-widest">Senha de Admin</p>
          <form onSubmit={checkPassword} className="space-y-4">
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-center text-white outline-none focus:border-[#e10600]"
            />
            <button type="submit" className="w-full bg-[#e10600] text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest">
              Acessar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 relative">
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white px-6 py-4 rounded-2xl font-black text-xs shadow-2xl flex items-center gap-3 border-2 border-green-400 animate-in fade-in zoom-in duration-300">
          <CheckCircle size={18} /> PONTOS CALCULADOS COM SUCESSO!
        </div>
      )}

      <div className="flex items-center gap-3 mb-8">
        <Settings className="text-[#e10600]" />
        <h2 className="text-2xl font-black f1-font tracking-tighter uppercase">Painel ADM</h2>
      </div>

      <div className="space-y-6 pb-24">
        <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
          <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3 block">Selecionar Grande Prêmio</label>
          <select 
            value={gp.id} 
            onChange={(e) => onSelectGp(Number(e.target.value))}
            className="w-full bg-[#1a1a1e] border border-white/10 rounded-2xl p-4 text-sm font-bold appearance-none outline-none focus:border-red-600"
          >
            {calendar.map(c => (
              <option key={c.id} value={c.id}>{c.name} {c.isSprint ? '(Sprint)' : ''}</option>
            ))}
          </select>
          <button 
            onClick={setActiveGP}
            className="w-full mt-4 bg-blue-600/10 text-blue-500 border border-blue-600/20 py-3 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2"
          >
            <PlayCircle size={14} /> Definir como Ativo
          </button>
        </div>

        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 shadow-xl">
          <h3 className="text-xs font-black mb-6 uppercase tracking-widest text-green-500 flex items-center gap-2">
            <CheckCircle size={14} /> Inserir Resultados
          </h3>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {sessions.map(s => (
              <button 
                key={s}
                onClick={() => setActiveResultSession(s)}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase border whitespace-nowrap ${activeResultSession === s ? 'bg-green-600 text-white border-green-600' : 'bg-white/5 text-gray-500 border-white/5'}`}
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
                  <option value="">Piloto...</option>
                  {DRIVERS.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <button 
            onClick={() => {
                onCalculatePoints(gp);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            }}
            className="w-full bg-green-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 active:scale-95 transition-all"
          >
            <Trophy size={16} /> Confirmar Resultados e Gerar Pontos
          </button>
        </div>

        <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
          <h3 className="text-xs font-black mb-6 uppercase tracking-widest text-[#e10600]">Controle de Votações</h3>
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
                  {gp.sessionStatus[session] === false ? <><Lock size={12} /> FECHADA</> : <><Unlock size={12} /> ABERTA</>}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
