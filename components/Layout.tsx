
import React from 'react';
import { Home, ClipboardList, Trophy, PieChart, ShieldAlert, Swords, TrendingUp } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isAdmin?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, isAdmin }) => {
  return (
    <div className="flex h-screen w-full bg-[#0a0a0c] overflow-hidden">
      {/* Background effects */}
      <div className="fixed top-0 left-0 w-full h-[30vh] bg-gradient-to-b from-[#e10600]/10 to-transparent pointer-events-none z-0" />

      {/* --- DESKTOP SIDEBAR (Visible on md+) --- */}
      <aside className="hidden md:flex flex-col w-24 lg:w-64 h-full glass border-r border-white/5 z-50 relative">
        <div className="p-6 flex items-center justify-center lg:justify-start gap-3 mb-6">
           <div className="w-8 h-8 bg-[#e10600] rounded-full flex items-center justify-center shrink-0 shadow-[0_0_15px_#e10600]">
              <span className="font-black f1-font text-white text-[10px]">F1</span>
           </div>
           <span className="hidden lg:block font-black f1-font text-xl tracking-tighter italic">2026</span>
        </div>

        <div className="flex-1 px-4 space-y-2 overflow-y-auto">
            <NavButtonDesktop icon={<Home size={20} />} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
            <NavButtonDesktop icon={<ClipboardList size={20} />} label="Palpites" active={activeTab === 'palpites'} onClick={() => setActiveTab('palpites')} />
            <NavButtonDesktop icon={<Trophy size={20} />} label="Ranking" active={activeTab === 'ranking'} onClick={() => setActiveTab('ranking')} />
            <NavButtonDesktop icon={<TrendingUp size={20} />} label="Dominância" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
            <NavButtonDesktop icon={<Swords size={20} />} label="Grid Rival" active={activeTab === 'adversarios'} onClick={() => setActiveTab('adversarios')} />
            {isAdmin && (
                <div className="pt-4 mt-4 border-t border-white/5">
                    <NavButtonDesktop icon={<ShieldAlert size={20} />} label="Admin" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} isDanger />
                </div>
            )}
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative z-10 scroll-smooth pb-32 md:pb-0" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="max-w-7xl mx-auto w-full h-full">
            {children}
        </div>
      </main>

      {/* --- MOBILE BOTTOM BAR (Visible on sm/mobile only) --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 safe-area-bottom pointer-events-none">
        <nav className="h-20 glass rounded-[32px] px-2 flex justify-between items-center relative overflow-hidden pointer-events-auto shadow-2xl">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
            
            <NavButtonMobile icon={<Home size={20} />} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
            <NavButtonMobile icon={<ClipboardList size={20} />} label="Palpites" active={activeTab === 'palpites'} onClick={() => setActiveTab('palpites')} />
            <NavButtonMobile icon={<Trophy size={20} />} label="Ranking" active={activeTab === 'ranking'} onClick={() => setActiveTab('ranking')} />
            <NavButtonMobile icon={<TrendingUp size={20} />} label="Stats" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
            <NavButtonMobile icon={<Swords size={20} />} label="Grid" active={activeTab === 'adversarios'} onClick={() => setActiveTab('adversarios')} />
            
            {isAdmin && (
                <NavButtonMobile icon={<ShieldAlert size={20} />} label="ADM" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
            )}
        </nav>
      </div>
    </div>
  );
};

// Mobile Button (Icon + Label Animation)
const NavButtonMobile: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className="relative flex-1 flex flex-col items-center justify-center h-full transition-all duration-300 group"
  >
    <div className={`
      relative p-2.5 rounded-2xl transition-all duration-300
      ${active 
        ? 'text-white bg-[#e10600] shadow-[0_0_15px_rgba(225,6,0,0.5)] translate-y-[-4px]' 
        : 'text-gray-500 hover:text-gray-300'}
    `}>
      {icon}
    </div>
    <span className={`
      text-[8px] font-bold mt-1 uppercase tracking-wider transition-all duration-300
      ${active ? 'text-white opacity-100 translate-y-[-2px]' : 'text-gray-600 opacity-0 scale-0 h-0'}
    `}>
      {label}
    </span>
  </button>
);

// Desktop Button (Row Layout)
const NavButtonDesktop: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void, isDanger?: boolean }> = ({ icon, label, active, onClick, isDanger }) => (
    <button
        onClick={onClick}
        className={`
            w-full flex items-center justify-center lg:justify-start gap-4 p-3 rounded-xl transition-all duration-200 group
            ${active 
                ? 'bg-white/10 text-white shadow-lg border border-white/5' 
                : 'text-gray-500 hover:bg-white/5 hover:text-gray-200'}
            ${isDanger && active ? 'bg-red-500/10 text-red-500 border-red-500/20' : ''}
        `}
    >
        <div className={`transition-transform duration-200 ${active ? 'scale-110 text-[#e10600]' : ''}`}>
            {icon}
        </div>
        <span className={`hidden lg:block text-xs font-bold uppercase tracking-widest ${active ? 'text-white' : ''}`}>
            {label}
        </span>
        {active && <div className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-[#e10600] shadow-[0_0_10px_#e10600]" />}
    </button>
);
