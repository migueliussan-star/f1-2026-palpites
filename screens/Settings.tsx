
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { Settings as SettingsIcon, User as UserIcon, Palette, Save, AlertCircle, CheckCircle2, Upload, Bell, Users, Download, Info, Smartphone, Share } from 'lucide-react';

interface SettingsProps {
  currentUser: User;
  onUpdateUser: (data: Partial<User>) => Promise<void>;
  onNavigateToLeagues?: () => void;
  hasSelectedLeague?: boolean;
  deferredPrompt?: any;
  isInstalled?: boolean;
}

const Settings: React.FC<SettingsProps> = ({ currentUser, onUpdateUser, onNavigateToLeagues, hasSelectedLeague, deferredPrompt, isInstalled }) => {
  const [name, setName] = useState(currentUser.name);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [theme, setTheme] = useState<'light' | 'dark'>(currentUser.theme || 'dark');
  const [pushEnabled, setPushEnabled] = useState(currentUser.pushEnabled || false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      setMessage({ type: 'error', text: 'Seu navegador não suporta notificações.' });
      return;
    }

    if (Notification.permission === 'granted') {
      setPushEnabled(true);
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushEnabled(true);
        new Notification('Notificações Ativadas!', {
          body: 'Você receberá lembretes antes do fechamento dos palpites.',
          icon: '/vite.svg'
        });
      } else {
        setMessage({ type: 'error', text: 'Permissão para notificações negada.' });
        setPushEnabled(false);
      }
    } else {
      setMessage({ type: 'error', text: 'Notificações estão bloqueadas no seu navegador.' });
      setPushEnabled(false);
    }
  };

  const togglePush = () => {
    if (!pushEnabled) {
      requestNotificationPermission();
    } else {
      setPushEnabled(false);
    }
  };

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
        pushEnabled
      });
      setMessage({ type: 'success', text: 'Configurações salvas e aplicadas!' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Erro ao salvar alterações no servidor.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isInIframe = window.self !== window.top;

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
                                 <span className="text-4xl font-black f1-font text-gray-400 dark:text-gray-600">{(name ?? "?").charAt(0).toUpperCase()}</span>
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

                        {/* Notifications Toggle */}
                        <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="block text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                                        <Bell size={14} /> Notificações
                                    </label>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">Lembretes antes do fechamento</p>
                                </div>
                                <button 
                                    onClick={togglePush}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${pushEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${pushEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
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
                    {isLoading ? 'Salvando...' : <><Save size={16} /> Salvar e Aplicar</>}
                </button>

                {/* PWA INSTALLATION SECTION */}
                <div className="bg-white p-6 lg:p-8 rounded-[32px] border border-gray-200 shadow-sm dark:bg-white/5 dark:border-white/10 dark:shadow-none transition-colors mt-6">
                    <div className="flex items-center gap-2 mb-6 text-orange-500 dark:text-orange-400">
                        <Smartphone size={18} />
                        <h3 className="text-sm font-black uppercase tracking-widest">Instalação</h3>
                    </div>

                    {isInstalled ? (
                        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                            <CheckCircle2 className="text-green-500" size={20} />
                            <div>
                                <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase">App Instalado!</p>
                                <p className="text-[10px] text-green-600/70 dark:text-green-400/70">Você já está usando a versão de aplicativo.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {isInIframe && (
                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
                                    <p className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase mb-1">Dica de Instalação</p>
                                    <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                                        Para instalar o app, você deve abri-lo em uma <span className="font-bold underline">nova aba</span> do navegador.
                                    </p>
                                </div>
                            )}
                            {deferredPrompt && (
                                <button 
                                    onClick={handleInstallPWA}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all"
                                >
                                    <Download size={16} /> Instalar Aplicativo
                                </button>
                            )}

                            {isIOS ? (
                                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-3">
                                    <div className="flex items-center gap-2 text-blue-500">
                                        <Info size={14} />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Como instalar no iPhone</p>
                                    </div>
                                    <ol className="text-[11px] text-gray-600 dark:text-gray-400 space-y-2 list-decimal list-inside font-medium">
                                        <li>Toque no botão <span className="inline-flex items-center bg-gray-200 dark:bg-white/10 p-1 rounded"><Share size={12} /></span> (Compartilhar)</li>
                                        <li>Role para baixo e toque em <span className="font-bold text-gray-900 dark:text-white">"Adicionar à Tela de Início"</span></li>
                                        <li>Toque em <span className="font-bold text-gray-900 dark:text-white">"Adicionar"</span> no canto superior</li>
                                    </ol>
                                </div>
                            ) : !deferredPrompt && (
                                <div className="p-4 bg-gray-500/5 border border-gray-500/10 rounded-xl space-y-3">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Info size={14} />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Como instalar no Android/PC</p>
                                    </div>
                                    <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium">
                                        Abra o menu do navegador (três pontos <span className="font-bold">⋮</span>) e selecione <span className="font-bold text-gray-900 dark:text-white">"Instalar Aplicativo"</span> ou <span className="font-bold text-gray-900 dark:text-white">"Adicionar à tela inicial"</span>.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* MOBILE ONLY: LEAGUES NAVIGATION */}
                {onNavigateToLeagues && (
                    <div className="md:hidden mt-2">
                        <button 
                            onClick={onNavigateToLeagues}
                            className="w-full bg-gradient-to-r from-[#e10600] to-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-between px-6 py-5 shadow-xl shadow-red-900/30 active:scale-95 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-xl">
                                    <Users size={18} />
                                </div>
                                <div className="text-left">
                                    <p className="font-black text-sm leading-none">Minhas Ligas</p>
                                    <p className="text-[10px] text-white/70 font-medium normal-case tracking-normal mt-0.5">Gerenciar e trocar de liga</p>
                                </div>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default Settings;
