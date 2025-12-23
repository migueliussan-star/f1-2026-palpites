
import React, { useState } from 'react';
import { LogIn } from 'lucide-react';

interface LoginProps {
  onLogin: (name: string, email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && name) {
      onLogin(name, email);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0a0c]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <div className="inline-block p-4 rounded-3xl bg-red-600/10 mb-6 border border-red-600/20">
            <h1 className="text-4xl font-black f1-font text-[#e10600]">F1 2026</h1>
          </div>
          <p className="text-gray-400 text-sm">Acesse sua conta para palpitar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Seu Nome</label>
            <input 
              type="text" 
              placeholder="Ex: Gabriel Bortoleto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-red-600 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">E-mail Google</label>
            <input 
              type="email" 
              placeholder="seuemail@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-red-600 outline-none"
            />
          </div>
          
          <button 
            type="submit"
            className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-colors"
          >
            <LogIn size={20} /> ENTRAR COM GOOGLE
          </button>
        </form>

        <p className="text-[10px] text-gray-600 mt-12 text-center uppercase tracking-widest font-bold">
          Primeiro acesso concede poderes de Admin
        </p>
      </div>
    </div>
  );
};

export default Login;
