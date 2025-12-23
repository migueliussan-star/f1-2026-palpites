
import React from 'react';
import { Home, ClipboardList, BarChart3, Trophy, PieChart, ShieldAlert } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isAdmin?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, isAdmin }) => {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-[#0a0a0c] shadow-2xl overflow-hidden relative">
      {/* Main Content */}
      <main className="flex-1 pb-28 overflow-y-auto">
        {children}
      </main>

      {/* Navigation Bar */}
      <div className="fixed bottom-6 left-6 right-6 max-w-[calc(100%-48px)] mx-auto z-50">
        <nav className="h-18 glass rounded-3xl border border-white/10 px-2 flex justify-around items-center shadow-2xl shadow-black">
            <NavButton 
            icon={<Home size={18} />} 
            label="Início" 
            active={activeTab === 'home'} 
            onClick={() => setActiveTab('home')} 
            />
            <NavButton 
            icon={<ClipboardList size={18} />} 
            label="Palpites" 
            active={activeTab === 'palpites'} 
            onClick={() => setActiveTab('palpites')} 
            />
            <NavButton 
            icon={<PieChart size={18} />} 
            label="Votos" 
            active={activeTab === 'palpitometro'} 
            onClick={() => setActiveTab('palpitometro')} 
            />
            <NavButton 
            icon={<Trophy size={18} />} 
            label="Ranking" 
            active={activeTab === 'ranking'} 
            onClick={() => setActiveTab('ranking')} 
            />
            {isAdmin && (
                <NavButton 
                icon={<ShieldAlert size={18} />} 
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
    className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 ${active ? 'text-[#e10600] bg-red-600/5 scale-110' : 'text-gray-500'}`}
  >
    {icon}
    <span className="text-[8px] font-black mt-1 uppercase tracking-tighter">{label}</span>
  </button>
);
