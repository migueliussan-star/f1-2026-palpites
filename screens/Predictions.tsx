
import React, { useState, useEffect } from 'react';
import { RaceGP, SessionType, Prediction, Driver } from '../types';
import { DRIVERS, FALLBACK_IMG } from '../constants';
import { CheckCircle2, GripVertical, Save, AlertCircle, CheckCircle, Lock, Edit3, Trash2, RotateCcw, Flag, XCircle } from 'lucide-react';

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
  // FIX: Adicionado verificação segura para top5 (Firebase pode remover a chave se array vazio)
  const isAlreadyPredicted = !!currentPrediction && (currentPrediction.top5?.length || 0) > 0;
  const isSessionOpen = gp.sessionStatus[activeSession] !== false;
  
  const [manualEditMode, setManualEditMode] = useState(false);
  const isEditable = isSessionOpen && (!isAlreadyPredicted || manualEditMode);
  
  // Estado alterado para permitir slots vazios (null)
  const [selectedDrivers, setSelectedDrivers] = useState<(string | null)[]>([null, null, null, null, null]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorShake, setErrorShake] = useState(false);

  useEffect(() => {
    const pred = savedPredictions.find(p => p.session === activeSession);
    
    // FIX: Garante que top5 seja tratado como array mesmo se undefined
    const top5 = pred?.top5 || [];

    if (top5.length > 0) {
      const newSelection = [null, null, null, null, null] as (string | null)[];
      top5.forEach((d, i) => {
        if (i < 5) newSelection[i] = d;
      });
      setSelectedDrivers(newSelection);
    } else {
      // Se não houver palpite ou for vazio, limpa tudo
      setSelectedDrivers([null, null, null, null, null]);
    }
    
    setManualEditMode(false);
  }, [activeSession, savedPredictions]);

  const toggleDriver = (id: string) => {
    if (!isEditable) return;
    
    const currentIndex = selectedDrivers.indexOf(id);
    
    if (currentIndex !== -1) {
      // REMOVER: Define o slot como null, mantendo o buraco (não sobe os de baixo)
      if (navigator.vibrate) navigator.vibrate(20);
      const newSelection = [...selectedDrivers];
      newSelection[currentIndex] = null;
      setSelectedDrivers(newSelection);
    } else {
      // ADICIONAR: Encontra o primeiro slot vazio (null)
      const emptyIndex = selectedDrivers.indexOf(null);
      
      if (emptyIndex !== -1) {
        if (navigator.vibrate) navigator.vibrate(50);
        const newSelection = [...selectedDrivers];
        newSelection[emptyIndex] = id;
        setSelectedDrivers(newSelection);
      } else {
        // Grid Cheio
        setErrorShake(true);
        if (navigator.vibrate) navigator.vibrate([30, 30, 30]);
        setTimeout(() => setErrorShake(false), 500);
      }
    }
  };

  const handleClear = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    // Limpa localmente
    setSelectedDrivers([null, null, null, null, null]);
    // PERSISTE o estado vazio no banco imediatamente para garantir que "continue sem nada"
    onSave(gp.id, activeSession, []);
  };

  const handleSave = () => {
    // Filtra os nulos para enviar apenas strings válidas
    const cleanList = selectedDrivers.filter((d): d is string => d !== null);
    
    if (cleanList.length === 5 && isEditable) {
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
      onSave(gp.id, activeSession, cleanList);
      setShowSuccess(true);
      setManualEditMode(false);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const filledCount = selectedDrivers.filter(d => d !== null).length;

  return (
    <div className="p-6 pt-10 lg:p-12">
      {/* Toast Notification */}
      {showSuccess && (
        <div className="fixed top-8 left-0 right-0 mx-auto w-max z-[100] bg-green-500 text-black px-6 py-4 rounded-2xl font-black text-xs shadow-2xl flex items-center justify-center gap-3 animate-enter">
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
          // Verifica se tem palpite VÁLIDO (com itens)
          const isCompleted = savedPredictions.some(p => p.session === s && (p.top5?.length || 0) > 0);
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

      {/* --- RESPONSIVE LAYOUT (2 Columns on Large Screens) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* LEFT COLUMN: SELECTED GRID & STATUS (Sticky on Desktop) */}
        <div className="lg:col-span-5 xl:col-span-4 order-1 lg:order-1">
            <div className="lg:sticky lg:top-8">
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
                <div className={`mb-8 transition-transform ${errorShake ? 'translate-x-[-5px] rotate-[-1deg]' : ''}`} style={{ transitionDuration: '0.1s' }}>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Seu Grid (Top 5)</h3>
                        {isEditable && filledCount > 0 && (
                            <button onClick={handleClear} className="text-[10px] text-red-400 font-black uppercase tracking-tighter flex items-center gap-1 hover:text-red-300">
                                <RotateCcw size={10} /> Limpar
                            </button>
                        )}
                    </div>
                    
                    <div className="space-y-3">
                    {[0, 1, 2, 3, 4].map((idx) => {
                        const pos = idx + 1;
                        const driverId = selectedDrivers[idx];
                        // driver pode ser undefined se driverId for null ou inválido
                        const driver = driverId ? DRIVERS.find(d => d.id === driverId) : null;
                        
                        return (
                        <div key={pos} className="flex items-center gap-3">
                            <span className="w-6 text-center font-black f1-font text-gray-600 text-lg italic">{pos}</span>
                            <div 
                                onClick={() => driver && toggleDriver(driver.id)}
                                style={driver ? { borderColor: `${driver.color}60`, boxShadow: `0 4px 20px -5px ${driver.color}20` } : {}}
                                className={`flex-1 h-14 lg:h-16 rounded-2xl flex items-center px-4 gap-4 transition-all relative overflow-hidden border group
                                ${driver ? 'glass cursor-pointer' : 'bg-white/5 border-dashed border-white/10'}
                                ${isEditable && driver ? 'active:scale-[0.98]' : ''}
                                `}
                            >
                            {driver ? (
                                <>
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 pointer-events-none" style={{ backgroundColor: driver.color }} />
                                
                                <div className="absolute right-[-10px] top-1 bottom-0 w-16 opacity-80 pointer-events-none group-hover:scale-105 transition-transform origin-bottom">
                                    <img 
                                        src={driver.image} 
                                        alt={driver.name} 
                                        className={`h-full w-full object-contain object-bottom 
                                            ${driver.id === 'lindblad' ? 'scale-[1.8] -translate-y-3' : 
                                              driver.id === 'hulkenberg' ? 'scale-[1.7] -translate-y-5' : ''}
                                        `}
                                        onError={(e) => { 
                                            e.currentTarget.onerror = null; 
                                            e.currentTarget.src = FALLBACK_IMG;
                                        }} 
                                    />
                                </div>

                                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
                                
                                <div className="flex-1 z-10 pointer-events-none">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xs font-black f1-font" style={{ color: driver.color }}>#{driver.number}</span>
                                        <p className="text-sm font-bold text-white leading-none uppercase">{driver.name}</p>
                                    </div>
                                    <p className="text-[9px] text-gray-400 uppercase font-black tracking-wider mt-1">{driver.team}</p>
                                </div>
                                
                                {isEditable && (
                                    <XCircle size={18} className="text-white/20 pointer-events-none absolute right-2 top-2" />
                                )}
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

                {/* Action Button */}
                {isEditable && (
                    <div className="mb-10 animate-enter">
                        <button 
                        onClick={handleSave}
                        disabled={filledCount < 5}
                        className={`
                            w-full py-4 rounded-xl flex items-center justify-center gap-3 font-black transition-all shadow-xl uppercase tracking-widest text-xs border
                            ${filledCount === 5
                            ? 'bg-[#e10600] text-white border-[#e10600] shadow-[#e10600]/20 active:scale-95 cursor-pointer hover:bg-red-600' 
                            : 'bg-white/5 text-gray-500 border-white/5 cursor-not-allowed opacity-50'}
                        `}
                        >
                        CONFIRMAR PALPITE <Save size={18} />
                        </button>
                        {filledCount < 5 && (
                            <p className="text-[9px] text-center text-gray-500 font-bold uppercase mt-2 tracking-wide">
                                Selecione 5 pilotos para salvar
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* RIGHT COLUMN: DRIVER LIST */}
        <div className="lg:col-span-7 xl:col-span-8 order-2 lg:order-2">
             <div className={`transition-all duration-500 pb-24 ${!isEditable ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
                <div className="flex justify-between items-center mb-4 px-1">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Pilotos Disponíveis</p>
                    {errorShake && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">Grid Completo!</p>}
                </div>
            
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {DRIVERS.map(driver => {
                    const isSelected = selectedDrivers.includes(driver.id);
                    // O índice para exibição no card do piloto (+1 para ser 1-based)
                    const selectionIndex = selectedDrivers.indexOf(driver.id) + 1;
                    
                    const activeStyle = isSelected ? {
                        borderColor: driver.color,
                        backgroundColor: `${driver.color}15`,
                        boxShadow: `inset 0 0 20px ${driver.color}10`
                    } : {};

                    return (
                    <button
                        key={driver.id}
                        disabled={!isEditable}
                        onClick={() => toggleDriver(driver.id)}
                        style={activeStyle}
                        className={`
                            relative h-28 rounded-2xl border text-left transition-all overflow-hidden group active:scale-95 cursor-pointer
                            ${isSelected 
                                ? 'ring-1' 
                                : 'glass border-white/5 hover:bg-white/10'}
                        `}
                    >
                        <div className="absolute top-0 right-0 w-full h-1 opacity-60 pointer-events-none" style={{ backgroundColor: driver.color }}></div>

                        {/* Adaptive Image Rendering */}
                        <div className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none opacity-90 transition-transform group-hover:scale-110 origin-bottom-right">
                            <img 
                                src={driver.image} 
                                alt={driver.name} 
                                className={`w-full h-full object-contain object-bottom 
                                    ${driver.id === 'lindblad' ? 'scale-[1.8] -translate-y-3' : 
                                      driver.id === 'hulkenberg' ? 'scale-[1.7] -translate-y-5' : ''}
                                `}
                                onError={(e) => { 
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = FALLBACK_IMG;
                                }}
                            />
                        </div>
                        
                        {/* Gradient overlay to make text readable */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none md:bg-gradient-to-r md:from-black/60 md:to-transparent" />

                        <div className="absolute top-3 left-3 z-10 pointer-events-none">
                            <p 
                                className="text-[10px] font-bold f1-font mb-0.5 transition-colors" 
                                style={{ color: isSelected ? driver.color : '#9ca3af' }}
                            >
                                #{driver.number}
                            </p>
                            <p className="text-xs font-bold leading-none uppercase text-white truncate max-w-[80px]">{driver.name.split(' ').pop()}</p>
                            <p className="text-[7px] text-gray-400 uppercase font-black mt-0.5">{driver.team.split(' ')[0]}</p>
                        </div>
                        
                        {isSelected ? (
                            <div 
                                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-lg scale-110 z-20"
                                    style={{ backgroundColor: driver.color, color: '#000', boxShadow: `0 4px 10px ${driver.color}40` }}
                            >
                                {selectionIndex}
                            </div>
                        ) : (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full border border-white/10 flex items-center justify-center text-white/20 group-hover:bg-white/10 group-hover:text-white/50 transition-colors z-20">
                                +
                            </div>
                        )}
                    </button>
                    );
                })}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Predictions;
