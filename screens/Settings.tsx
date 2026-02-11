
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Settings as SettingsIcon, User as UserIcon, Globe, Palette, Save, Camera, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SettingsProps {
  currentUser: User;
  onUpdateUser: (data: Partial<User>) => Promise<void>;
}

const Settings: React.FC<SettingsProps> = ({ currentUser, onUpdateUser }) => {
  const [name, setName] = useState(currentUser.name);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [theme, setTheme] = useState<'light' | 'dark'>(currentUser.theme || 'dark');
  const [language, setLanguage] = useState<'pt' | 'en'>(currentUser.language || 'pt');
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const validateImage = (url: string) => {
    if (!url) return true; // Vazio é permitido
    return /\.(jpg|jpeg|png)$/i.test(url);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'O nome não pode estar vazio.' });
      return;
    }

    if (avatarUrl && !validateImage(avatarUrl)) {
      setMessage({ type: 'error', text: 'URL da imagem inválida. Use .jpg, .jpeg ou .png' });
      return;
    }

    setIsLoading(true);
    try {
      await onUpdateUser({
        name: name.trim(),
        avatarUrl: avatarUrl.trim(),
        theme,
        language
      });
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Erro ao salvar alterações.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-12 pb-32">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
            <div className="bg-gray-600/20 p-3 rounded-2xl border border-gray-600/30">
                <SettingsIcon className="text-gray-400" size={24} />
            </div>
            <div>
                <h2 className="text-3xl font-black f1-font uppercase leading-none tracking-tighter">Configurações</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Personalize sua experiência</p>
            </div>
        </div>

        {message && (
            <div className={`fixed top-6 left-0 right-0 mx-auto w-max z-[100] px-6 py-4 rounded-2xl font-black text-xs shadow-2xl flex items-center gap-3 animate-enter border ${
                message.type === 'success' ? 'bg-green-600 text-white border-green-400' : 'bg-red-600 text-white border-red-400'
            }`}>
                {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                {message.text}
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* 1. PERFIL */}
            <div className="bg-white/5 p-6 lg:p-8 rounded-[32px] border border-white/10">
                <div className="flex items-center gap-2 mb-6 text-blue-400">
                    <UserIcon size={18} />
                    <h3 className="text-sm font-black uppercase tracking-widest">Perfil</h3>
                </div>

                <div className="space-y-6">
                    {/* Avatar Preview */}
                    <div className="flex flex-col items-center justify-center mb-6">
                        <div className="w-24 h-24 rounded-full bg-[#0a0a0c] border-4 border-white/10 flex items-center justify-center overflow-hidden relative shadow-2xl mb-3 group">
                             {avatarUrl ? (
                                 <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                             ) : (
                                 <span className="text-3xl font-black f1-font text-gray-600">{name.charAt(0).toUpperCase()}</span>
                             )}
                             <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={24} className="text-white" />
                             </div>
                        </div>
                        <p className="text-[9px] text-gray-500 uppercase font-bold">Pré-visualização</p>
                    </div>

                    {/* Name Input */}
                    <div>
                        <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Nome de Exibição</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:border-[#e10600] outline-none transition-all placeholder-gray-700"
                            placeholder="Seu nome"
                        />
                    </div>

                    {/* Avatar URL Input */}
                    <div>
                        <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">URL do Avatar</label>
                        <input 
                            type="text" 
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-xs font-mono text-gray-300 focus:border-[#e10600] outline-none transition-all placeholder-gray-700"
                            placeholder="https://exemplo.com/foto.png"
                        />
                        <p className="text-[9px] text-gray-600 mt-2 ml-1">Formatos aceitos: .png, .jpg, .jpeg</p>
                    </div>
                </div>
            </div>

            {/* 2. GERAL */}
            <div className="flex flex-col gap-6">
                <div className="bg-white/5 p-6 lg:p-8 rounded-[32px] border border-white/10 h-full">
                    <div className="flex items-center gap-2 mb-6 text-purple-400">
                        <Palette size={18} />
                        <h3 className="text-sm font-black uppercase tracking-widest">Geral</h3>
                    </div>

                    <div className="space-y-6">
                        {/* Theme Selector */}
                        <div>
                            <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">Tema do App</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setTheme('dark')}
                                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'bg-white/10 border-white text-white' : 'bg-black/20 border-white/5 text-gray-500 hover:bg-white/5'}`}
                                >
                                    <div className="w-6 h-6 rounded-full bg-[#0a0a0c] border border-gray-600"></div>
                                    <span className="text-[10px] font-black uppercase">Escuro</span>
                                </button>
                                <button 
                                    onClick={() => setTheme('light')}
                                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'bg-white text-black border-white' : 'bg-black/20 border-white/5 text-gray-500 hover:bg-white/5'}`}
                                >
                                    <div className="w-6 h-6 rounded-full bg-gray-200 border border-gray-300"></div>
                                    <span className="text-[10px] font-black uppercase">Claro</span>
                                </button>
                            </div>
                        </div>

                        {/* Language Selector */}
                        <div>
                             <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Globe size={12} /> Idioma
                             </label>
                             <div className="flex gap-2 p-1 bg-black/30 rounded-xl border border-white/5">
                                <button 
                                    onClick={() => setLanguage('pt')}
                                    className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${language === 'pt' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-600 hover:text-gray-400'}`}
                                >
                                    Português
                                </button>
                                <button 
                                    onClick={() => setLanguage('en')}
                                    className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${language === 'en' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-600 hover:text-gray-400'}`}
                                >
                                    English
                                </button>
                             </div>
                        </div>
                    </div>
                </div>

                {/* SAVE BUTTON */}
                <button 
                    onClick={handleSave}
                    disabled={isLoading}
                    className="w-full py-5 bg-[#e10600] hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-red-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Salvando...' : <><Save size={16} /> Salvar Alterações</>}
                </button>
            </div>
        </div>
    </div>
  );
};

export default Settings;
