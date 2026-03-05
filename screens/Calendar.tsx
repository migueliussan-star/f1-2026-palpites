import React from 'react';
import { RaceGP } from '../types';
import { Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react';

interface CalendarProps {
  calendar: RaceGP[];
}

const Calendar: React.FC<CalendarProps> = ({ calendar }) => {
  return (
    <div className="p-6 md:p-8">
      <h2 className="text-2xl font-black f1-font text-white mb-8 flex items-center gap-3 uppercase tracking-tighter">
        <CalendarIcon className="text-[#e10600]" /> Calendário 2026
      </h2>
      
      <div className="grid gap-6">
        {calendar.map((gp) => (
          <div key={gp.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-white">{gp.name}</h3>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{gp.date}</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
              <MapPin size={16} />
              <span>{gp.location}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(gp.sessions || {}).map(([sessionName, dateStr]) => (
                <div key={sessionName} className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5">
                  <span className="text-xs font-bold text-gray-300 uppercase">{sessionName}</span>
                  <div className="flex items-center gap-2 text-xs text-white font-mono">
                    <Clock size={12} />
                    {new Date(dateStr).toLocaleString('pt-BR', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
