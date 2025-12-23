
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
import { db, auth, ref, set, onValue, update, get, remove, onAuthStateChanged, signOut } from './firebase';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'palpites' | 'palpitometro' | 'ranking' | 'stats' | 'admin'>('home');
  const [user, setUser] = useState<User | null>(null);
  const [calendar, setCalendar] = useState<RaceGP[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [adminEditingGpId, setAdminEditingGpId] = useState<number | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Verifica se existe algum administrador na lista de usuários
  const hasAnyAdmin = useMemo(() => allUsers.some(u => u.isAdmin), [allUsers]);

  useEffect(() => {
    // 1. Carregar Calendário
    const calendarRef = ref(db, 'calendar');
    onValue(calendarRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setCalendar(data);
      else set(calendarRef, INITIAL_CALENDAR);
    });

    // 2. Carregar Ranking (Filtra convidados e ordena)
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userList = (Object.values(data) as User[]).filter(u => {
            // Remove perfis de convidados do ranking visual
            return u.id && !u.id.startsWith('guest_') && u.email;
        });
        setAllUsers(userList.sort((a, b) => (b.points || 0) - (a.points || 0)));
      }
    });

    // 3. Carregar Predições
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

    // 4. Autenticação Google
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userKey = firebaseUser.email?.replace(/\./g, '_') || '';
        const userRef = ref(db, `users/${userKey}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          setUser(snapshot.val());
        } else {
          // Se for o primeiro usuário oficial, ou se não houver admins, ele pode se tornar um
          const userData: User = {
            id: userKey,
            name: firebaseUser.displayName || 'Piloto',
            email: firebaseUser.email || '',
            points: 0,
            rank: 0,
            level: 'Bronze',
            isAdmin: false // Inicializa como false, o botão na Home permitirá assumir se necessário
          };
          await set(userRef, userData);
          setUser(userData);
        }
      } else {
        setUser(null);
      }
      setIsInitialLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  const handlePromoteSelfToAdmin = async () => {
    if (!user) return;
    const userRef = ref(db, `users/${user.id}`);
    const updatedUser = { ...user, isAdmin: true };
    await update(userRef, { isAdmin: true });
    setUser(updatedUser);
    alert("Você agora é o Administrador do sistema!");
  };

  const handleLogout = () => {
    signOut(auth);
    setUser(null);
    setActiveTab('home');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      await remove(ref(db, `users/${user.id}`));
      await remove(ref(db, `predictions/${user.id}`));
      handleLogout();
    } catch (error) {
      console.error(error);
    }
  };

  const handlePredict = (gpId: number, session: SessionType, top5: string[]) => {
    if (!user) return;
    const sessionKey = session.replace(/\s/g, '_');
    const predictionRef = ref(db, `predictions/${user.id}/${gpId}_${sessionKey}`);
    set(predictionRef, { userId: user.id, gpId, session, top5 });
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
    sorted.forEach((u: any, idx) => updatedUsers[u.id.replace(/\./g, '_')].rank = idx + 1);
    await set(ref(db, 'users'), updatedUsers);
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-[#e10600]/20 border-t-[#e10600] rounded-full animate-spin mb-6"></div>
        <h1 className="text-4xl font-black f1-font text-[#e10600] animate-pulse">F1 2026</h1>
      </div>
    );
  }

  if (!user) return <Login />;

  const realTimeRank = allUsers.findIndex(u => u.id === user.id) + 1 || user.rank || allUsers.length;
  const userWithRealRank = { ...user, rank: realTimeRank };

  const activeGP = calendar.find(gp => gp.status === 'OPEN') || calendar[0];
  const adminGP = calendar.find(gp => gp.id === adminEditingGpId) || activeGP;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={user.isAdmin}>
      {activeTab === 'home' && (
        <Home 
          user={userWithRealRank} 
          nextGP={activeGP} 
          predictionsCount={new Set(predictions.filter(p => p.gpId === activeGP.id && p.userId === user.id).map(p => p.session)).size} 
          totalUsers={allUsers.length} 
          onNavigateToPredict={() => setActiveTab('palpites')} 
          onLogout={handleLogout} 
          onDeleteAccount={handleDeleteAccount}
          hasNoAdmin={!hasAnyAdmin}
          onClaimAdmin={handlePromoteSelfToAdmin}
        />
      )}
      {activeTab === 'palpites' && <Predictions gp={activeGP} onSave={handlePredict} savedPredictions={predictions.filter(p => p.gpId === activeGP.id && p.userId === user.id)} />}
      {activeTab === 'palpitometro' && <Palpitometro gp={activeGP} stats={communityStats[activeGP.id] || {}} totalUsers={new Set(predictions.filter(p => p.gpId === activeGP.id).map(p => p.userId)).size || 1} />}
      {activeTab === 'ranking' && <Ranking currentUser={userWithRealRank} users={allUsers} calendar={calendar} />}
      {activeTab === 'stats' && <Stats user={userWithRealRank} />}
      {activeTab === 'admin' && user.isAdmin && <Admin gp={adminGP} calendar={calendar} onUpdateCalendar={(cal) => set(ref(db, 'calendar'), cal)} onSelectGp={setAdminEditingGpId} onCalculatePoints={calculatePointsForGP} />}
    </Layout>
  );
};

export default App;
