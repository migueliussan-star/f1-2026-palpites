
import React, { useState, useEffect } from 'react';
import { RaceGP, SessionType, Prediction, Driver } from '../types';
import { DRIVERS } from '../constants';
import { CheckCircle2, GripVertical, Save, AlertCircle, CheckCircle, Lock, Edit3, Trash2, RotateCcw, Flag } from 'lucide-react';

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
  
  const currentPrediction = savedPredictions.find(p => p.session === activeSession);
  const isAlreadyPredicted = !!currentPrediction;
  const isSessionOpen = gp.sessionStatus[activeSession] !== false;
  
  const [manualEditMode, setManualEditMode] = useState(false);
  const isEditable = isSessionOpen && (!isAlreadyPredicted || manualEditMode);
  
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>(currentPrediction?.top5 || []);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const pred = savedPredictions.find(p => p.session === activeSession);
    setSelectedDrivers(pred?.top5 || []);
    setManualEditMode(false);
  }, [activeSession, savedPredictions]);

  const toggleDriver = (id: string) => {
    if (!isEditable) return;
    if (selectedDrivers.includes(id)) {
      setSelectedDrivers(prev => prev.filter(d => d !== id));
    } else if (selectedDrivers.length < 5) {
      setSelectedDrivers(prev => [...prev, id]);
    }
  };

  const handleClear = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    setSelectedDrivers([]);
  };

  const handleSave = () => {
    if (selectedDrivers.length === 5 && isEditable) {
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
      onSave(gp.id, activeSession, selectedDrivers);
      setShowSuccess(true);
      setManualEditMode(false);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  return (
    <div className="p-6 pt-10">
      {/* Toast Notification */}
      {showSuccess && (
        <div className="fixed top-8 left-0 right-0 mx-6 z-[100] bg-green-500 text-black px-6 py-4 rounded-2xl font-black text-xs shadow-2xl flex items-center justify-center gap-3 animate-enter">
          <CheckCircle size={20} />
          <span>PALPITES REGISTRADOS!</span>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-3xl font-black f1-font text-white italic uppercase">{gp.name}</h2>
        <div className="flex items-center gap-2 text-[#e10600]">
            <Flag size={14} />
            <p className="text-xs font-bold uppercase tracking-widest">Sessão de Palpites</p>
        </div>
      </div>
      
      {/* Session Tabs */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-4 scrollbar-hide px-1">
        {sessions.map((s, idx) => {
          const isCompleted = savedPredictions.some(p => p.session === s);
          const isOpen = gp.sessionStatus[s] !== false;
          const isActive = activeSession === s;
          
          return (
            <button
              key={s}
              onClick={() => setActiveSessionIdx(idx)}
              className={`whitespace-nowrap px-5 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 transition-all border shadow-lg ${
                isActive 
                  ? 'bg-[#e10600] text-white border-[#e10600] scale-105 shadow-red-600/30' 
                  : 'glass text-gray-400 border-white/5 hover:bg-white/5'
              }`}
            >
              {s} 
              {isCompleted && <div className="bg-white text-[#e10600] rounded-full p-0.5"><CheckCircle2 size={10} /></div>}
              {!isOpen && <Lock size={10} className="opacity-50" />}
            </button>
          );
        })}
      </div>

      {/* Status Banner */}
      {!isSessionOpen ? (
        <div className="glass p-6 rounded-3xl mb-8 flex flex-col items-center justify-center text-center border-red-500/20 bg-red-900/5">
          <Lock size={32} className="text-red-500 mb-2 opacity-80" />
          <p className="text-sm font-black text-red-500 uppercase tracking-wider">Sessão Fechada</p>
        </div>
      ) : isAlreadyPredicted && !manualEditMode ? (
        <div className="glass p-1 rounded-[24px] mb-8 border-green-500/30 bg-green-500/5">
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                    <div className="bg-green-500 text-black p-2 rounded-full">
                        <CheckCircle size={18} />
                    </div>
                    <div>
                        <p className="text-xs text-green-500 font-black uppercase tracking-wider">Tudo Pronto!</p>
                        <p className="text-[9px] text-gray-400 uppercase">Palpites enviados</p>
                    </div>
                </div>
                <button 
                    onClick={() => setManualEditMode(true)}
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-white flex items-center gap-2 transition-all"
                >
                    <Edit3 size={14} /> Editar
                </button>
            </div>
        </div>
      ) : null}

      {/* Selected Drivers Display */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Seu Grid (Top 5)</h3>
            {isEditable && selectedDrivers.length > 0 && (
                <button onClick={handleClear} className="text-[10px] text-red-400 font-black uppercase tracking-tighter flex items-center gap-1 hover:text-red-300">
                    <RotateCcw size={10} /> Limpar
                </button>
            )}
        </div>
        
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((idx) => {
            const pos = idx + 1;
            const driverId = selectedDrivers[idx];
            const driver = DRIVERS.find(d => d.id === driverId);
            
            return (
              <div key={pos} className="flex items-center gap-3">
                <span className="w-6 text-center font-black f1-font text-gray-600 text-lg italic">{pos}</span>
                <div className={`flex-1 h-16 rounded-2xl flex items-center px-4 gap-4 transition-all relative overflow-hidden ${driver ? 'glass border-white/20' : 'bg-white/5 border border-dashed border-white/10'}`}>
                  {driver ? (
                    <>
                      <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: driver.color }} />
                      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black/50 to-transparent pointer-events-none" />
                      
                      <div className="flex-1 z-10">
                        <div className="flex items-baseline gap-2">
                            <span className="text-xs font-black f1-font text-white/40">#{driver.number}</span>
                            <p className="text-sm font-bold text-white leading-none uppercase">{driver.name}</p>
                        </div>
                        <p className="text-[9px] text-gray-400 uppercase font-black tracking-wider mt-1">{driver.team}</p>
                      </div>
                      <img 
                        src={`https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/${driver.name.split(' ')[0]}-${driver.name.split(' ')[1]}/${driver.name.split(' ')[0].toLowerCase()}_${driver.name.split(' ')[1].toLowerCase()}.png.transform/2col/image.png`} // Fallback visual trick - in real app use real assets
                        className="h-14 opacity-0" // Hidden in this code challenge as we don't have real images, but kept for layout logic
                        alt=""
                      />
                    </>
                  ) : (
                    <span className="text-[10px] text-gray-600 uppercase font-bold tracking-widest w-full text-center">Selecionar piloto</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drivers List */}
      <div className={`transition-all duration-500 pb-24 ${!isEditable ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 px-1">Pilotos Disponíveis</p>
        <div className="grid grid-cols-2 gap-3">
          {DRIVERS.map(driver => {
            const isSelected = selectedDrivers.includes(driver.id);
            const selectionIndex = selectedDrivers.indexOf(driver.id) + 1;
            
            return (
              <button
                key={driver.id}
                disabled={isSelected || !isEditable}
                onClick={() => toggleDriver(driver.id)}
                className={`
                    relative p-3 rounded-2xl border text-left transition-all overflow-hidden group active:scale-95
                    ${isSelected 
                        ? 'border-[#e10600]/50 bg-[#e10600]/10' 
                        : 'glass border-white/5 hover:bg-white/10'}
                `}
              >
                {/* Team Color Accent */}
                <div className="absolute top-0 right-0 w-full h-1 opacity-50" style={{ backgroundColor: driver.color }}></div>

                <div className="flex items-center justify-between relative z-10 mt-1">
                    <div>
                        <p className={`text-[10px] font-bold f1-font mb-1 ${isSelected ? 'text-[#e10600]' : 'text-gray-500'}`}>#{driver.number}</p>
                        <p className="text-xs font-bold leading-tight uppercase text-white truncate">{driver.name.split(' ').pop()}</p>
                        <p className="text-[8px] text-gray-500 uppercase font-black mt-0.5">{driver.team.split(' ')[0]}</p>
                    </div>
                    {isSelected && (
                       <div className="w-6 h-6 rounded-full bg-[#e10600] flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-red-600/40">
                           {selectionIndex}
                       </div>
                    )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Action Button for Save */}
      <div className="fixed bottom-24 left-0 right-0 max-w-md mx-auto px-6 z-40 pointer-events-none">
        <button 
          onClick={handleSave}
          disabled={!isEditable || selectedDrivers.length < 5}
          className={`
            pointer-events-auto w-full py-4 rounded-full flex items-center justify-center gap-3 font-black transition-all shadow-2xl uppercase tracking-widest text-xs border border-white/10 backdrop-blur-xl
            ${isEditable && selectedDrivers.length === 5
              ? 'bg-[#e10600] text-white shadow-[#e10600]/40 translate-y-0 opacity-100 active:scale-95' 
              : 'bg-black/80 text-gray-600 translate-y-10 opacity-0'}
          `}
        >
          CONFIRMAR PALPITE <Save size={18} />
        </button>
      </div>
    </div>
  );
};

export default Predictions;
