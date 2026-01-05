
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
    <div className="flex flex-col h-full w-full max-w-md mx-auto shadow-2xl overflow-hidden relative bg-[#0a0a0c]">
      {/* Background effects */}
      <div className="fixed top-0 left-0 w-full h-[30vh] bg-gradient-to-b from-[#e10600]/10 to-transparent pointer-events-none z-0" />

      {/* Main Content - SCROLL HAPPENS HERE */}
      {/* min-h-0 é crucial para scroll aninhado no flexbox */}
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-32 z-10 animate-enter scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
        {children}
      </main>

      {/* Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 p-4 safe-area-bottom pointer-events-none">
        <nav className="h-20 glass rounded-[32px] px-2 flex justify-between items-center relative overflow-hidden pointer-events-auto">
            {/* Glow effect behind active tab */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
            
            <NavButton 
            icon={<Home size={20} />} 
            label="Home" 
            active={activeTab === 'home'} 
            onClick={() => setActiveTab('home')} 
            />
            <NavButton 
            icon={<ClipboardList size={20} />} 
            label="Palpites" 
            active={activeTab === 'palpites'} 
            onClick={() => setActiveTab('palpites')} 
            />
            <NavButton 
            icon={<Trophy size={20} />} 
            label="Ranking" 
            active={activeTab === 'ranking'} 
            onClick={() => setActiveTab('ranking')} 
            />
             <NavButton 
            icon={<TrendingUp size={20} />} 
            label="Dominância" 
            active={activeTab === 'stats'} 
            onClick={() => setActiveTab('stats')} 
            />
             <NavButton 
            icon={<Swords size={20} />} 
            label="Grid" 
            active={activeTab === 'adversarios'} 
            onClick={() => setActiveTab('adversarios')} 
            />
            
            {isAdmin && (
                <NavButton 
                icon={<ShieldAlert size={20} />} 
                label="ADM" 
                active={activeTab === 'admin'} 
                onClick={() => setActiveTab('admin')} 
                />
            )}
        </nav>
      </div>
    </div>
  );
};

const NavButton: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
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
