import React, { useState, useEffect } from 'react';
import { LOADING_TIPS } from '../constants';

export const LoadingScreen: React.FC = () => {
  const [tip, setTip] = useState(LOADING_TIPS[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTip(LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center p-6">
      <div className="w-16 h-16 border-4 border-[#e10600]/20 border-t-[#e10600] rounded-full animate-spin mb-8"></div>
      <p className="text-white font-black uppercase tracking-widest text-sm mb-4">Carregando dados...</p>
      <div className="max-w-xs text-center">
        <p className="text-gray-400 text-xs font-bold italic">"{tip}"</p>
      </div>
    </div>
  );
};
