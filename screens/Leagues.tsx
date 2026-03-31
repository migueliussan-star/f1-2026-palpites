import React, { useState, useEffect, useMemo } from 'react';
import { User, League } from '../types';
import { Users, Plus, Key, Copy, Check, Trophy, Trash2, LogOut } from 'lucide-react';
import { db, ref, set, get, update, remove } from '../firebase';

interface LeaguesProps {
  currentUser: User;
  allUsers: User[];
  allLeagues: League[];
  onUpdateUser: (data: Partial<User>) => Promise<void>;
  onSelectLeague: (leagueId: string | null) => void;
  selectedLeagueId: string | null;
}

const Leagues: React.FC<LeaguesProps> = ({ currentUser, allUsers, allLeagues, onUpdateUser, onSelectLeague, selectedLeagueId }) => {
  const [activeTab, setActiveTab] = useState<'my_leagues' | 'join' | 'create'>('my_leagues');
  const [newLeagueName, setNewLeagueName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const leagues = useMemo(() => {
    const currentUserLeagues = Array.isArray(currentUser.leagues) 
      ? currentUser.leagues 
      : (currentUser.leagues ? Object.values(currentUser.leagues) as string[] : []);
    return allLeagues.filter(l => currentUserLeagues.includes(l.id));
  }, [allLeagues, currentUser.leagues]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreateLeague = async () => {
    if (!newLeagueName.trim()) {
      showMessage('error', 'O nome da liga não pode estar vazio.');
      return;
    }

    setLoading(true);
    try {
      const leagueId = `league_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const code = Math.random().toString(36).substr(2, 6).toUpperCase();
      
      const newLeague: League = {
        id: leagueId,
        name: newLeagueName.trim(),
        code,
        ownerId: currentUser.id,
        members: [currentUser.id],
        createdAt: Date.now()
      };

      await set(ref(db, `leagues/${leagueId}`), newLeague);
      
      const updatedLeagues = [...(Array.isArray(currentUser.leagues) ? currentUser.leagues : Object.values(currentUser.leagues || {}) as string[]), leagueId];
      await onUpdateUser({ 
        leagues: updatedLeagues
      });
      
      // Seleciona a liga automaticamente após criar
      onSelectLeague(leagueId);
      
      setNewLeagueName('');
      setActiveTab('my_leagues');
      showMessage('success', 'Liga criada com sucesso!');
    } catch (error) {
      console.error(error);
      showMessage('error', 'Erro ao criar liga.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLeague = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      showMessage('error', 'O código não pode estar vazio.');
      return;
    }

    if (!currentUser.id) {
      showMessage('error', 'Usuário não identificado. Tente fazer login novamente.');
      return;
    }

    setLoading(true);
    console.log("Tentando entrar na liga com código:", code);
    
    try {
      const targetLeague = allLeagues.find(l => (l.code || "").toString().trim().toUpperCase() === code);

      if (!targetLeague) {
        console.log("Liga não encontrada para o código:", code);
        showMessage('error', 'Código inválido ou liga não encontrada.');
        setLoading(false);
        return;
      }
      
      // Garantir que members é um array
      const members = Array.isArray(targetLeague.members) 
        ? targetLeague.members 
        : (targetLeague.members ? Object.values(targetLeague.members).filter(v => typeof v === 'string') as string[] : []);

      if (members.includes(currentUser.id)) {
        console.log("Usuário já participa da liga:", targetLeague.name);
        onSelectLeague(targetLeague.id);
        setJoinCode('');
        setActiveTab('my_leagues');
        showMessage('success', 'Você já participa desta liga!');
        setLoading(false);
        return;
      }

      console.log("Entrando na liga:", targetLeague.name, "ID:", targetLeague.id);

      // 1. Atualiza os membros da liga
      const updatedMembers = [...members, currentUser.id];
      await update(ref(db, `leagues/${targetLeague.id}`), { members: updatedMembers });

      // 2. Atualiza as ligas do usuário
      // Lógica robusta para ler as ligas atuais do usuário
      let currentUserLeagues: string[] = [];
      if (Array.isArray(currentUser.leagues)) {
        currentUserLeagues = currentUser.leagues;
      } else if (currentUser.leagues && typeof currentUser.leagues === 'object') {
        // Se for um objeto, pode ser { "0": "id1" } ou { "id1": true }
        const values = Object.values(currentUser.leagues);
        if (values.every(v => typeof v === 'string')) {
          currentUserLeagues = values as string[];
        } else {
          currentUserLeagues = Object.keys(currentUser.leagues);
        }
      }
        
      const updatedUserLeagues = Array.from(new Set([...currentUserLeagues, targetLeague.id]));
      
      // Usamos update no App.tsx através do onUpdateUser
      await onUpdateUser({ leagues: updatedUserLeagues });

      // 3. Seleciona a liga automaticamente após entrar
      onSelectLeague(targetLeague.id);

      setJoinCode('');
      setActiveTab('my_leagues');
      showMessage('success', `Bem-vindo à liga ${targetLeague.name}!`);
    } catch (error: any) {
      console.error("Erro detalhado ao entrar na liga:", error);
      let errorMsg = 'Erro ao processar sua entrada na liga. Tente novamente.';
      
      if (error.message?.includes('Permission denied')) {
        errorMsg = 'Sem permissão para acessar as ligas. Contate o administrador.';
      } else if (error.code === 'PERMISSION_DENIED') {
        errorMsg = 'Acesso negado pelo banco de dados. Verifique as permissões.';
      }
      
      showMessage('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveLeague = async (leagueId: string) => {
    if (!leagueId) return;
    if (!window.confirm('Tem certeza que deseja sair desta liga?')) return;

    setLoading(true);
    try {
      const league = allLeagues.find(l => l.id === leagueId);
      if (league) {
        let members: string[] = [];
        if (Array.isArray(league.members)) {
          members = league.members.filter(m => typeof m === 'string');
        } else if (league.members && typeof league.members === 'object') {
          members = Object.values(league.members).filter(m => typeof m === 'string') as string[];
        }
        
        const updatedMembers = members.filter(id => id !== currentUser.id);
        await update(ref(db, `leagues/${leagueId}`), { 
          members: updatedMembers.length > 0 ? updatedMembers : null 
        });
      }

      let currentUserLeagues: string[] = [];
      if (Array.isArray(currentUser.leagues)) {
        currentUserLeagues = currentUser.leagues.filter(l => typeof l === 'string');
      } else if (currentUser.leagues && typeof currentUser.leagues === 'object') {
        currentUserLeagues = Object.values(currentUser.leagues).filter(l => typeof l === 'string') as string[];
      }
      
      const updatedUserLeagues = currentUserLeagues.filter(id => id !== leagueId);
      await onUpdateUser({ 
        leagues: updatedUserLeagues.length > 0 ? updatedUserLeagues : null as any 
      });

      if (selectedLeagueId === leagueId) {
        onSelectLeague(null);
      }

      showMessage('success', 'Você saiu da liga.');
    } catch (error) {
      console.error(error);
      showMessage('error', 'Erro ao sair da liga.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLeague = async (leagueId: string) => {
    const league = allLeagues.find(l => l.id === leagueId);
    if (!league) return;

    const isOwner = league.ownerId === currentUser.id || currentUser.isAdmin;
    if (!isOwner) {
      showMessage('error', 'Apenas o dono da liga pode excluí-la.');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja EXCLUIR permanentemente a liga "${league.name}"? Esta ação não pode ser desfeita.`)) return;

    setLoading(true);
    try {
      // 1. Remover a liga de todos os usuários que participam dela
      const membersArray = Array.isArray(league.members) 
        ? league.members 
        : Object.values(league.members || {}) as string[];

      const updatePromises = membersArray.map(async (memberId) => {
        const member = allUsers.find(u => u.id === memberId);
        if (member) {
          let userLeagues: string[] = [];
          if (Array.isArray(member.leagues)) {
            userLeagues = member.leagues;
          } else if (member.leagues && typeof member.leagues === 'object') {
            userLeagues = Object.values(member.leagues) as string[];
          }
          const updatedLeagues = userLeagues.filter(id => id !== leagueId);
          await update(ref(db, `users/${memberId}`), { 
            leagues: updatedLeagues.length > 0 ? updatedLeagues : null 
          });
        }
      });

      await Promise.all(updatePromises);

      // 2. Remover a liga do banco de dados
      await remove(ref(db, `leagues/${leagueId}`));

      if (selectedLeagueId === leagueId) {
        onSelectLeague(null);
      }

      showMessage('success', 'Liga excluída com sucesso.');
    } catch (error) {
      console.error(error);
      showMessage('error', 'Erro ao excluir a liga.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="p-6 lg:p-12 pb-32">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-blue-600/20 p-3 rounded-2xl border border-blue-600/30 dark:bg-blue-800 dark:border-blue-700">
          <Users className="text-blue-500" size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-black f1-font uppercase leading-none tracking-tighter text-gray-900 dark:text-white">Ligas</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Jogue com seus amigos</p>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab('my_leagues')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${activeTab === 'my_leagues' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400'}`}
          >
            Minhas Ligas
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${activeTab === 'join' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400'}`}
          >
            Entrar em Liga
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${activeTab === 'create' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400'}`}
          >
            Criar Liga
          </button>
        </div>
        
        {selectedLeagueId && (
          <button
            onClick={() => handleLeaveLeague(selectedLeagueId)}
            className="px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors bg-red-600 text-white hover:bg-red-700"
          >
            Sair da Liga Atual
          </button>
        )}
      </div>

      {/* Content */}
      {activeTab === 'my_leagues' && (
        <div className="space-y-6">
          {leagues.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/5">
              <Trophy size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-bold">Você ainda não participa de nenhuma liga.</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Crie uma ou peça o código para um amigo!</p>
            </div>
          ) : (
            leagues.map(league => {
              // Garantir que members é um array para o filtro
              const membersArray = Array.isArray(league.members) 
                ? league.members 
                : Object.values(league.members || {}) as string[];

              // Sort members by points
              const leagueMembers = allUsers
                .filter(u => membersArray.includes(u.id))
                .sort((a, b) => (b.points || 0) - (a.points || 0));

              return (
                <div key={league.id} className="bg-white dark:bg-white/5 rounded-[32px] border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-gray-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black f1-font uppercase text-gray-900 dark:text-white">{league.name}</h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{league.members.length} membros</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-gray-100 dark:bg-black/30 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10">
                        <Key size={14} className="text-gray-400" />
                        <span className="font-mono font-bold text-sm tracking-widest text-gray-900 dark:text-white">{league.code}</span>
                        <button onClick={() => copyToClipboard(league.code)} className="ml-2 text-blue-500 hover:text-blue-600 transition-colors">
                          {copiedCode === league.code ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                      <button 
                        onClick={() => onSelectLeague(league.id)} 
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${selectedLeagueId === league.id ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                      >
                        {selectedLeagueId === league.id ? 'Liga Atual' : 'Acessar Liga'}
                      </button>
                      
                      {league.ownerId === currentUser.id || currentUser.isAdmin ? (
                        <button 
                          onClick={() => handleDeleteLeague(league.id)} 
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                          title="Excluir Liga"
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleLeaveLeague(league.id)} 
                          className="p-2 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-xl transition-colors"
                          title="Sair da Liga"
                        >
                          <LogOut size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-0">
                    {leagueMembers.map((member, idx) => (
                      <div key={member.id} className={`flex items-center justify-between p-4 px-6 border-b border-gray-50 dark:border-white/5 last:border-0 ${member.id === currentUser.id ? 'bg-blue-50 dark:bg-blue-500/10' : ''}`}>
                        <div className="flex items-center gap-4">
                          <span className={`w-6 text-center font-black f1-font text-lg ${idx < 3 ? 'text-yellow-500' : 'text-gray-400'}`}>{idx + 1}</span>
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center overflow-hidden">
                            {member.avatarUrl ? <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-gray-500">{member.name.charAt(0).toUpperCase()}</span>}
                          </div>
                          <span className="font-bold text-sm text-gray-900 dark:text-white">{member.name}</span>
                        </div>
                        <span className="font-black text-blue-600 dark:text-blue-400">{member.points || 0} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'join' && (
        <div className="bg-white dark:bg-white/5 p-6 lg:p-8 rounded-[32px] border border-gray-200 dark:border-white/10 shadow-sm max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-6 text-blue-500">
            <Key size={24} />
            <h3 className="text-lg font-black uppercase tracking-widest">Código de Convite</h3>
          </div>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && joinCode && handleJoinLeague()}
            placeholder="Ex: A1B2C3"
            className="w-full bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-center font-mono text-2xl font-bold text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all placeholder-gray-400 uppercase tracking-widest mb-6"
            maxLength={6}
          />
          <button
            onClick={handleJoinLeague}
            disabled={loading || !joinCode}
            className="w-full bg-blue-600 text-white font-black uppercase tracking-widest py-4 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar na Liga'}
          </button>
        </div>
      )}

      {activeTab === 'create' && (
        <div className="bg-white dark:bg-white/5 p-6 lg:p-8 rounded-[32px] border border-gray-200 dark:border-white/10 shadow-sm max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-6 text-blue-500">
            <Plus size={24} />
            <h3 className="text-lg font-black uppercase tracking-widest">Nova Liga</h3>
          </div>
          <input
            type="text"
            value={newLeagueName}
            onChange={(e) => setNewLeagueName(e.target.value)}
            placeholder="Nome da sua liga"
            className="w-full bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm font-bold text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all placeholder-gray-400 mb-6"
            maxLength={30}
          />
          <button
            onClick={handleCreateLeague}
            disabled={loading || !newLeagueName}
            className="w-full bg-blue-600 text-white font-black uppercase tracking-widest py-4 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar Liga'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Leagues;
