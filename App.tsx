
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

  useEffect(() => {
    // 1. Verificar Login de Convidado (Manual) primeiro
    const savedGuest = localStorage.getItem('f1_guest_user');
    if (savedGuest) {
      const guestData = JSON.parse(savedGuest);
      const userRef = ref(db, `users/${guestData.id}`);
      onValue(userRef, (snapshot) => {
        if (snapshot.exists()) setUser(snapshot.val());
        else setUser(guestData);
      });
      setIsInitialLoading(false);
    }

    // 2. Carregar Calendário
    const calendarRef = ref(db, 'calendar');
    onValue(calendarRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setCalendar(data);
      else set(calendarRef, INITIAL_CALENDAR);
    });

    // 3. Carregar Ranking
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userList = Object.values(data) as User[];
        setAllUsers(userList.sort((a, b) => (b.points || 0) - (a.points || 0)));
      }
    });

    // 4. Carregar Predições
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

    // 5. Autenticação Google
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        localStorage.removeItem('f1_guest_user');
        const userKey = firebaseUser.email?.replace(/\./g, '_') || '';
        const userRef = ref(db, `users/${userKey}`);
        const snapshot = await get(userRef);
        
        let userData: User;
        if (snapshot.exists()) {
          userData = snapshot.val();
        } else {
          const allUsersSnap = await get(ref(db, 'users'));
          const currentTotal = allUsersSnap.exists() ? Object.keys(allUsersSnap.val()).length : 0;
          userData = {
            id: userKey,
            name: firebaseUser.displayName || 'Piloto',
            email: firebaseUser.email || '',
            points: 0,
            rank: currentTotal + 1,
            level: 'Bronze',
            isAdmin: currentTotal === 0
          };
          await set(userRef, userData);
        }
        setUser(userData);
      } else if (!savedGuest) {
        setUser(null);
      }
      setIsInitialLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('f1_guest_user');
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
        <h1 className="text-4xl font-black f1-font text-[#e10600] animate-pulse">F1 2026</h1>
        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-4">Aquecendo Motores...</p>
      </div>
    );
  }

  if (!user) return <Login />;

  // Posição calculada em tempo real para a Home
  const realTimeRank = allUsers.findIndex(u => u.id === user.id) + 1 || user.rank || allUsers.length;
  const userWithRealRank = { ...user, rank: realTimeRank };

  const activeGP = calendar.find(gp => gp.status === 'OPEN') || calendar[0];
  const adminGP = calendar.find(gp => gp.id === adminEditingGpId) || activeGP;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={user.isAdmin}>
      {activeTab === 'home' && <Home user={userWithRealRank} nextGP={activeGP} predictionsCount={new Set(predictions.filter(p => p.gpId === activeGP.id && p.userId === user.id).map(p => p.session)).size} totalUsers={allUsers.length} onNavigateToPredict={() => setActiveTab('palpites')} onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} />}
      {activeTab === 'palpites' && <Predictions gp={activeGP} onSave={handlePredict} savedPredictions={predictions.filter(p => p.gpId === activeGP.id && p.userId === user.id)} />}
      {activeTab === 'palpitometro' && <Palpitometro gp={activeGP} stats={communityStats[activeGP.id] || {}} totalUsers={new Set(predictions.filter(p => p.gpId === activeGP.id).map(p => p.userId)).size || 1} />}
      {activeTab === 'ranking' && <Ranking currentUser={userWithRealRank} users={allUsers} calendar={calendar} />}
      {activeTab === 'stats' && <Stats user={userWithRealRank} />}
      {activeTab === 'admin' && user.isAdmin && <Admin gp={adminGP} calendar={calendar} onUpdateCalendar={(cal) => set(ref(db, 'calendar'), cal)} onSelectGp={setAdminEditingGpId} onCalculatePoints={calculatePointsForGP} />}
    </Layout>
  );
};

export default App;
