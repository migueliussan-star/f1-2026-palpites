import React from 'react';
import { RaceGP } from '../types';
import { Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react';

interface CalendarProps {
  calendar: RaceGP[];
}

const GP_FLAGS: Record<string, string> = {
  'Austrália': '🇦🇺',
  'China': '🇨🇳',
  'Japão': '🇯🇵',
  'Bahrein': '🇧🇭',
  'Arábia Saudita': '🇸🇦',
  'Miami': '🇺🇸',
  'Canadá': '🇨🇦',
  'Mônaco': '🇲🇨',
  'Espanha': '🇪🇸',
  'Áustria': '🇦🇹',
  'Grã-Bretanha': '🇬🇧',
  'Bélgica': '🇧🇪',
  'Hungria': '🇭🇺',
  'Holanda': '🇳🇱',
  'Itália': '🇮🇹',
  'Madri': '🇪🇸',
  'Azerbaijão': '🇦🇿',
  'Singapura': '🇸🇬',
  'EUA': '🇺🇸',
  'México': '🇲🇽',
  'São Paulo': '🇧🇷',
  'Las Vegas': '🇺🇸',
  'Catar': '🇶🇦',
  'Abu Dhabi': '🇦🇪'
};

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
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <span className="text-2xl">{GP_FLAGS[gp.name] || '🏁'}</span>
                {gp.name}
              </h3>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{gp.date}</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
              <MapPin size={16} />
              <span>{gp.location}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(gp.sessions || {})
                .sort(([, dateA], [, dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
                .map(([sessionName, dateStr]) => {
                  const dateObj = new Date(dateStr);
                  const formattedDate = dateObj.toLocaleString('pt-BR', { 
                    weekday: 'short',
                    day: '2-digit', 
                    month: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }).replace('.,', ' -'); // Ajuste para alguns navegadores que colocam ponto e vírgula

                  return (
                    <div key={sessionName} className="flex flex-col justify-center bg-black/20 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">{sessionName}</span>
                      <div className="flex items-center gap-2 text-sm text-white font-mono">
                        <Clock size={14} className="text-[#e10600]" />
                        {formattedDate}
                      </div>
                    </div>
                  );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
