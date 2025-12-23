
import React, { useState, useEffect } from 'react';
import { RaceGP, SessionType, Prediction, Driver } from '../types';
import { DRIVERS } from '../constants';
import { CheckCircle2, GripVertical, Save, AlertCircle, CheckCircle, Lock } from 'lucide-react';

interface PredictionsProps {
  gp: RaceGP;
  onSave: (gpId: number, session: SessionType, top5: string[]) => void;
  savedPredictions: Prediction[];
}

const Predictions: React.FC<PredictionsProps> = ({ gp, onSave, savedPredictions }) => {
  const sessions: SessionType[] = gp.isSprint 
    ? ['Qualy Sprint', 'corrida Sprint', 'Qualy corrida', 'corrida principal'] 
    : ['Qualy corrida', 'corrida principal'];
    
  const [activeSessionIdx, setActiveSessionIdx] = useState(0);
  const activeSession = sessions[activeSessionIdx];
  
  // VERIFICAÇÃO DE TRAVA: Já existe palpite salvo para esta sessão?
  const isAlreadyPredicted = savedPredictions.some(p => p.session === activeSession);
  const isSessionOpen = gp.sessionStatus[activeSession] !== false;
  
  // A edição só é permitida se a sessão estiver aberta E o usuário ainda não palpitou
  const isEditable = isSessionOpen && !isAlreadyPredicted;
  
  const currentPrediction = savedPredictions.find(p => p.session === activeSession);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>(currentPrediction?.top5 || []);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const pred = savedPredictions.find(p => p.session === activeSession);
    setSelectedDrivers(pred?.top5 || []);
  }, [activeSession, savedPredictions]);

  const toggleDriver = (id: string) => {
    if (!isEditable) return;
    if (selectedDrivers.includes(id)) {
      setSelectedDrivers(prev => prev.filter(d => d !== id));
    } else if (selectedDrivers.length < 5) {
      setSelectedDrivers(prev => [...prev, id]);
    }
  };

  const moveUp = (idx: number) => {
    if (idx === 0 || !isEditable) return;
    const newArr = [...selectedDrivers];
    [newArr[idx], newArr[idx - 1]] = [newArr[idx - 1], newArr[idx]];
    setSelectedDrivers(newArr);
  };

  const handleSave = () => {
    if (selectedDrivers.length === 5 && isEditable) {
      onSave(gp.id, activeSession, selectedDrivers);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  return (
    <div className="p-6">
      {/* Toast Success */}
      {showSuccess && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-2xl animate-bounce flex items-center gap-3 border-2 border-green-400">
          <CheckCircle size={18} /> PALPITES GRAVADOS COM SUCESSO!
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-black f1-font text-[#e10600]">{gp.name.toUpperCase()}</h2>
        <p className="text-xs text-gray-500 uppercase tracking-widest">{gp.date} • MELBOURNE</p>
      </div>
      
      {/* Session Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {sessions.map((s, idx) => {
          const isCompleted = savedPredictions.some(p => p.session === s);
          const isOpen = gp.sessionStatus[s] !== false;
          return (
            <button
              key={s}
              onClick={() => setActiveSessionIdx(idx)}
              className={`whitespace-nowrap px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                activeSession === s 
                  ? 'bg-[#e10600] text-white border-[#e10600] shadow-lg shadow-red-600/20' 
                  : 'bg-white/5 text-gray-400 border-white/5'
              }`}
            >
              {s} {isCompleted && <CheckCircle2 size={14} className="text-green-400" />}
              {!isOpen && <span className="opacity-50 text-[8px] uppercase">Fec.</span>}
            </button>
          );
        })}
      </div>

      {/* Alertas de Status */}
      {!isSessionOpen ? (
        <div className="bg-red-900/20 border border-red-900/40 p-4 rounded-2xl mb-6 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-500" />
          <p className="text-xs text-red-400 font-bold uppercase tracking-widest">Votação encerrada por Admin</p>
        </div>
      ) : isAlreadyPredicted ? (
        <div className="bg-blue-900/20 border border-blue-900/40 p-4 rounded-2xl mb-6 flex items-center gap-3">
          <Lock size={18} className="text-blue-500" />
          <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">Palpite enviado e bloqueado para edições</p>
        </div>
      ) : null}

      <div className="mb-8">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Seu TOP 5</h3>
        
        <div className="space-y-2 mb-8 min-h-[300px]">
          {[1, 2, 3, 4, 5].map((pos, idx) => {
            const driverId = selectedDrivers[idx];
            const driver = DRIVERS.find(d => d.id === driverId);
            
            return (
              <div key={pos} className="flex items-center gap-3">
                <span className="w-6 text-center font-black f1-font text-gray-500">{pos}</span>
                <div className={`flex-1 h-14 rounded-xl flex items-center px-4 gap-3 transition-all ${driver ? 'bg-white/10' : 'border border-dashed border-white/10'}`}>
                  {driver ? (
                    <>
                      <div className="w-1 bg-current h-8 rounded-full" style={{ color: driver.color }} />
                      <div className="flex-1">
                        <p className="text-sm font-bold">{driver.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase">{driver.team}</p>
                      </div>
                      {isEditable && (
                        <button onClick={() => moveUp(idx)} className="p-2 text-gray-500 hover:text-white"><GripVertical size={18} /></button>
                      )}
                      {!isEditable && isAlreadyPredicted && (
                        <CheckCircle size={16} className="text-green-500 opacity-50" />
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-gray-600 italic">Selecione abaixo</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <h3 className={`text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 ${!isEditable ? 'opacity-30' : ''}`}>
          {isAlreadyPredicted ? 'Escolhas Confirmadas' : 'Selecione os Pilotos'}
        </h3>
        
        <div className={`grid grid-cols-2 gap-2 mb-24 transition-opacity ${!isEditable ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
          {DRIVERS.map(driver => {
            const isSelected = selectedDrivers.includes(driver.id);
            return (
              <button
                key={driver.id}
                disabled={isSelected || !isEditable}
                onClick={() => toggleDriver(driver.id)}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                  isSelected 
                    ? 'border-[#e10600]/50 bg-red-500/10 opacity-50 scale-95' 
                    : !isEditable ? 'opacity-30' : 'border-white/10 bg-white/5 active:scale-95'
                }`}
              >
                <div className="absolute top-1 right-1">
                   <span className="text-[10px] opacity-20 font-bold f1-font">#{driver.number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: driver.color }} />
                  <div>
                    <p className="text-xs font-bold leading-tight truncate">{driver.name.split(' ')[1]}</p>
                    <p className="text-[8px] text-gray-500 uppercase">{driver.team}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-24 left-0 right-0 max-w-md mx-auto px-6 z-40">
        <button 
          onClick={handleSave}
          disabled={!isEditable || selectedDrivers.length < 5}
          className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black transition-all shadow-2xl ${
            isEditable && selectedDrivers.length === 5
              ? 'bg-[#e10600] text-white active:scale-95 shadow-red-600/30' 
              : isAlreadyPredicted 
                ? 'bg-green-600/20 text-green-500 border border-green-500/30 cursor-not-allowed'
                : 'bg-white/10 text-gray-600 cursor-not-allowed border border-white/5'
          }`}
        >
          {isAlreadyPredicted ? (
            <><Lock size={18} /> PALPITE ENVIADO</>
          ) : (
            <>CONFIRMAR PALPITE <Save size={20} /></>
          )}
        </button>
      </div>
    </div>
  );
};

export default Predictions;
