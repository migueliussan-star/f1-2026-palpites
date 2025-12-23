
import React, { useState, useEffect, useMemo } from 'react';
import { User, RaceGP, SessionType, Prediction } from './types';
import { INITIAL_CALENDAR } from './constants';
import Home from './screens/Home';
import Predictions from './screens/Predictions';
import Palpitometro from './screens/Palpitometro';
import Ranking from './screens/Ranking';
import Stats from './screens/Stats';
import Admin from './screens/Admin';
import Login from './screens/Login';
import { Layout } from './components/Layout';
import { db, ref, set, onValue, update, get, remove } from './firebase';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'palpites' | 'palpitometro' | 'ranking' | 'stats' | 'admin'>('home');
  const [user, setUser] = useState<User | null>(null);
  const [calendar, setCalendar] = useState<RaceGP[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [adminEditingGpId, setAdminEditingGpId] = useState<number | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    // Carregar Calendário
    const calendarRef = ref(db, 'calendar');
    onValue(calendarRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setCalendar(data);
      else set(calendarRef, INITIAL_CALENDAR);
    });

    // Carregar Usuários
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userList = Object.values(data) as User[];
        setAllUsers(userList.sort((a, b) => (b.points || 0) - (a.points || 0)));
      }
    });

    // Carregar Predições
    const predictionsRef = ref(db, 'predictions');
    onValue(predictionsRef, (snapshot) => {
      const data = snapshot.val();
      const predList: Prediction[] = [];
      if (data) {
        Object.values(data).forEach((userPreds: any) => {
          Object.values(userPreds).forEach((p: any) => predList.push(p));
        });
      }
      setPredictions(predList);
    });

    // Verificar Sessão Local
    const savedUserEmail = localStorage.getItem('f1_user_email');
    if (savedUserEmail) {
        const userKey = savedUserEmail.replace(/\./g, '_');
        get(ref(db, `users/${userKey}`)).then((snapshot) => {
            if (snapshot.exists()) {
                setUser(snapshot.val());
            } else {
                localStorage.removeItem('f1_user_email');
            }
            setIsInitialLoading(false);
        }).catch(() => setIsInitialLoading(false));
    } else {
        setIsInitialLoading(false);
    }
  }, []);

  const handleLogin = async (name: string, email: string) => {
    const userKey = email.replace(/\./g, '_');
    const userRef = ref(db, `users/${userKey}`);
    const snapshot = await get(userRef);
    let userData: User;

    if (snapshot.exists()) {
      userData = snapshot.val();
    } else {
      userData = {
        id: userKey,
        name,
        email,
        points: 0,
        rank: allUsers.length + 1,
        level: 'Bronze',
        isAdmin: allUsers.length === 0
      };
      await set(userRef, userData);
    }

    setUser(userData);
    localStorage.setItem('f1_user_email', email);
  };

  const handlePredict = (gpId: number, session: SessionType, top5: string[]) => {
    if (!user) return;
    const userKey = user.email.replace(/\./g, '_');
    const sessionKey = session.replace(/\s/g, '_');
    const predictionRef = ref(db, `predictions/${userKey}/${gpId}_${sessionKey}`);
    set(predictionRef, { userId: user.id, gpId, session, top5 });
  };

  const calculatePointsForGP = async (targetGp: RaceGP) => {
    const usersSnap = await get(ref(db, 'users'));
    if (!usersSnap.exists()) return;
    const updatedUsers = { ...usersSnap.val() };
    
    Object.keys(updatedUsers).forEach(uKey => {
      let totalPoints = 0;
      const u = updatedUsers[uKey];
      calendar.forEach((gp) => {
        if (gp.results) {
          Object.entries(gp.results).forEach(([session, val]) => {
            const officialTop5 = val as string[];
            const userPred = predictions.find(p => p.userId === u.id && p.gpId === gp.id && p.session === session);
            if (userPred) {
              userPred.top5.forEach((id, idx) => {
                if (id === officialTop5[idx]) totalPoints += 5;
                else if (officialTop5.includes(id)) totalPoints += 1;
              });
            }
          });
        }
      });
      updatedUsers[uKey].points = totalPoints;
    });

    const sorted = Object.values(updatedUsers).sort((a: any, b: any) => b.points - a.points);
    sorted.forEach((u: any, idx) => updatedUsers[u.email.replace(/\./g, '_')].rank = idx + 1);
    await set(ref(db, 'users'), updatedUsers);
  };

  const handleLogout = () => {
    localStorage.removeItem('f1_user_email');
    setUser(null);
    setActiveTab('home');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const userKey = user.email.replace(/\./g, '_');
    const currentEmail = user.email;

    // Ação Instantânea na UI
    handleLogout();

    // Limpeza no Firebase em segundo plano
    try {
      await remove(ref(db, `users/${userKey}`));
      await remove(ref(db, `predictions/${userKey}`));
      console.log("Dados removidos com sucesso para:", currentEmail);
    } catch (error) {
      console.error("Erro ao limpar dados no servidor (Firebase):", error);
    }
  };

  const communityStats = useMemo(() => {
    const stats: any = {};
    predictions.forEach(p => {
      if (!stats[p.gpId]) stats[p.gpId] = {};
      if (!stats[p.gpId][p.session]) stats[p.gpId][p.session] = {};
      p.top5.forEach(id => stats[p.gpId][p.session][id] = (stats[p.gpId][p.session][id] || 0) + 1);
    });
    return stats;
  }, [predictions]);

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center p-6">
        <h1 className="text-4xl font-black f1-font text-[#e10600] animate-pulse">F1 2026</h1>
        <div className="mt-8 w-12 h-1 border-2 border-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#e10600] animate-[loading_1.5s_infinite]" style={{width: '40%'}} />
        </div>
        <style>{`
            @keyframes loading {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(250%); }
            }
        `}</style>
      </div>
    );
  }

  if (!user) return <Login onLogin={handleLogin} />;

  const activeGP = calendar.find(gp => gp.status === 'OPEN') || calendar[0];
  const adminGP = calendar.find(gp => gp.id === adminEditingGpId) || activeGP;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={user.isAdmin}>
      {activeTab === 'home' && <Home user={user} nextGP={activeGP} predictionsCount={new Set(predictions.filter(p => p.gpId === activeGP.id && p.userId === user.id).map(p => p.session)).size} totalUsers={allUsers.length} onNavigateToPredict={() => setActiveTab('palpites')} onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} />}
      {activeTab === 'palpites' && <Predictions gp={activeGP} onSave={handlePredict} savedPredictions={predictions.filter(p => p.gpId === activeGP.id && p.userId === user.id)} />}
      {activeTab === 'palpitometro' && <Palpitometro gp={activeGP} stats={communityStats[activeGP.id] || {}} totalUsers={new Set(predictions.filter(p => p.gpId === activeGP.id).map(p => p.userId)).size || 1} />}
      {activeTab === 'ranking' && <Ranking currentUser={user} users={allUsers} calendar={calendar} />}
      {activeTab === 'stats' && <Stats user={user} />}
      {activeTab === 'admin' && user.isAdmin && <Admin gp={adminGP} calendar={calendar} onUpdateCalendar={(cal) => set(ref(db, 'calendar'), cal)} onSelectGp={setAdminEditingGpId} onCalculatePoints={calculatePointsForGP} />}
    </Layout>
  );
};

export default App;
