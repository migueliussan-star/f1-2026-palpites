
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { Settings as SettingsIcon, User as UserIcon, Globe, Palette, Save, Camera, AlertCircle, CheckCircle2, Upload } from 'lucide-react';

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
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Função para converter arquivo em Base64 comprimido
  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_SIZE = 400; // Reduz tamanho para salvar no DB sem custo de Storage

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                // Converte para JPEG com qualidade 0.7 para economizar espaço
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = event.target?.result as string;
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          if (!file.type.startsWith('image/')) {
              setMessage({ type: 'error', text: 'Por favor, selecione um arquivo de imagem válido.' });
              return;
          }
          if (file.size > 5 * 1024 * 1024) { // 5MB
             setMessage({ type: 'error', text: 'A imagem deve ter no máximo 5MB.' });
             return;
          }

          try {
              setIsLoading(true);
              const base64 = await processImage(file);
              setAvatarUrl(base64);
              setMessage({ type: 'success', text: 'Imagem carregada! Clique em Salvar para confirmar.' });
          } catch (e) {
              setMessage({ type: 'error', text: 'Erro ao processar imagem.' });
          } finally {
              setIsLoading(false);
          }
      }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'O nome não pode estar vazio.' });
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
      setMessage({ type: 'success', text: 'Configurações salvas e aplicadas!' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Erro ao salvar alterações no servidor.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-12 pb-32">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
            <div className="bg-gray-600/20 p-3 rounded-2xl border border-gray-600/30 dark:bg-gray-800 dark:border-gray-700">
                <SettingsIcon className="text-gray-400" size={24} />
            </div>
            <div>
                <h2 className="text-3xl font-black f1-font uppercase leading-none tracking-tighter text-gray-900 dark:text-white">Configurações</h2>
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
            <div className="bg-white p-6 lg:p-8 rounded-[32px] border border-gray-200 shadow-sm dark:bg-white/5 dark:border-white/10 dark:shadow-none transition-colors">
                <div className="flex items-center gap-2 mb-6 text-blue-500 dark:text-blue-400">
                    <UserIcon size={18} />
                    <h3 className="text-sm font-black uppercase tracking-widest">Perfil</h3>
                </div>

                <div className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center justify-center mb-6">
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-32 h-32 rounded-full bg-gray-100 dark:bg-[#0a0a0c] border-4 border-white dark:border-white/10 flex items-center justify-center overflow-hidden relative shadow-xl mb-3 group cursor-pointer hover:scale-105 transition-transform"
                        >
                             {avatarUrl ? (
                                 <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                             ) : (
                                 <span className="text-4xl font-black f1-font text-gray-400 dark:text-gray-600">{name.charAt(0).toUpperCase()}</span>
                             )}
                             
                             {/* Overlay Hover */}
                             <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload size={24} className="text-white mb-1" />
                                <span className="text-[8px] text-white font-bold uppercase">Alterar</span>
                             </div>
                        </div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold text-center">
                            Toque na imagem para alterar<br/>(Max 5MB)
                        </p>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept="image/png, image/jpeg, image/jpg"
                            className="hidden" 
                        />
                    </div>

                    {/* Name Input */}
                    <div>
                        <label className="block text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-2">Nome de Exibição</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm font-bold text-gray-900 dark:text-white focus:border-[#e10600] outline-none transition-all placeholder-gray-400"
                            placeholder="Seu nome"
                        />
                    </div>
                </div>
            </div>

            {/* 2. GERAL */}
            <div className="flex flex-col gap-6">
                <div className="bg-white p-6 lg:p-8 rounded-[32px] border border-gray-200 shadow-sm dark:bg-white/5 dark:border-white/10 dark:shadow-none transition-colors h-full">
                    <div className="flex items-center gap-2 mb-6 text-purple-500 dark:text-purple-400">
                        <Palette size={18} />
                        <h3 className="text-sm font-black uppercase tracking-widest">Geral</h3>
                    </div>

                    <div className="space-y-6">
                        {/* Theme Selector */}
                        <div>
                            <label className="block text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-3">Tema do App</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setTheme('dark')}
                                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                        theme === 'dark' 
                                            ? 'bg-gray-900 border-gray-700 text-white dark:bg-white/10 dark:border-white' 
                                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 dark:bg-black/20 dark:border-white/5 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <div className="w-6 h-6 rounded-full bg-[#0a0a0c] border border-gray-600"></div>
                                    <span className="text-[10px] font-black uppercase">Escuro</span>
                                </button>
                                <button 
                                    onClick={() => setTheme('light')}
                                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                        theme === 'light' 
                                            ? 'bg-white text-black border-gray-300 shadow-sm' 
                                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 dark:bg-black/20 dark:border-white/5 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <div className="w-6 h-6 rounded-full bg-gray-200 border border-gray-300"></div>
                                    <span className="text-[10px] font-black uppercase">Claro</span>
                                </button>
                            </div>
                        </div>

                        {/* Language Selector */}
                        <div>
                             <label className="block text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Globe size={12} /> Idioma
                             </label>
                             <div className="flex gap-2 p-1 bg-gray-100 dark:bg-black/30 rounded-xl border border-gray-200 dark:border-white/5">
                                <button 
                                    onClick={() => setLanguage('pt')}
                                    className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${
                                        language === 'pt' 
                                            ? 'bg-white text-black shadow dark:bg-white/10 dark:text-white' 
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-600 dark:hover:text-gray-400'
                                    }`}
                                >
                                    Português
                                </button>
                                <button 
                                    onClick={() => setLanguage('en')}
                                    className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${
                                        language === 'en' 
                                            ? 'bg-white text-black shadow dark:bg-white/10 dark:text-white' 
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-600 dark:hover:text-gray-400'
                                    }`}
                                >
                                    English
                                </button>
                             </div>
                             <p className="text-[9px] text-gray-400 mt-2 ml-1 italic">
                                *A tradução completa será aplicada em atualizações futuras.
                             </p>
                        </div>
                    </div>
                </div>

                {/* SAVE BUTTON */}
                <button 
                    onClick={handleSave}
                    disabled={isLoading}
                    className="w-full py-5 bg-[#e10600] hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-red-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Salvando...' : <><Save size={16} /> Salvar e Aplicar</>}
                </button>
            </div>
        </div>
    </div>
  );
};

export default Settings;
