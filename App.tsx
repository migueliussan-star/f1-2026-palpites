
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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Captura o evento de instalação para permitir instalar via botão
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Carregar Calendário
    const calendarRef = ref(db, 'calendar');
    onValue(calendarRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setCalendar(data);
      else set(calendarRef, INITIAL_CALENDAR);
    });

    // Carregar Ranking
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userList = (Object.values(data) as User[]).filter(u => u.id && !u.id.startsWith('guest_') && u.email);
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

    // Autenticação
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userKey = firebaseUser.email?.replace(/\./g, '_') || '';
        const userRef = ref(db, `users/${userKey}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          setUser(snapshot.val());
        } else {
          const userData: User = {
            id: userKey,
            name: firebaseUser.displayName || 'Piloto',
            email: firebaseUser.email || '',
            points: 0,
            rank: 0,
            level: 'Bronze',
            isAdmin: false
          };
          await set(userRef, userData);
          setUser(userData);
        }
      } else {
        setUser(null);
      }
      setIsInitialLoading(false);
    });

    return () => {
        unsubscribeAuth();
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handlePromoteSelfToAdmin = async () => {
    if (!user) return;
    const userRef = ref(db, `users/${user.id}`);
    await update(userRef, { isAdmin: true });
    setUser({ ...user, isAdmin: true });
    alert("Você agora é o Administrador!");
  };

  const handleLogout = () => { signOut(auth); setUser(null); setActiveTab('home'); };

  const handlePredict = (gpId: number, session: SessionType, top5: string[]) => {
    if (!user) return;
    const sessionKey = session.replace(/\s/g, '_');
    set(ref(db, `predictions/${user.id}/${gpId}_${sessionKey}`), { userId: user.id, gpId, session, top5 });
  };

  if (isInitialLoading) return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center"><div className="w-16 h-16 border-4 border-[#e10600]/20 border-t-[#e10600] rounded-full animate-spin"></div></div>;
  if (!user) return <Login />;

  const hasAnyAdmin = allUsers.some(u => u.isAdmin);
  const realTimeRank = allUsers.findIndex(u => u.id === user.id) + 1 || user.rank || allUsers.length;
  const activeGP = calendar.find(gp => gp.status === 'OPEN') || calendar[0];

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={user.isAdmin}>
      {activeTab === 'home' && (
        <Home 
          user={{...user, rank: realTimeRank}} 
          nextGP={activeGP} 
          predictionsCount={new Set(predictions.filter(p => p.gpId === activeGP.id && p.userId === user.id).map(p => p.session)).size} 
          onNavigateToPredict={() => setActiveTab('palpites')} 
          onLogout={handleLogout} 
          onDeleteAccount={async () => {}} 
          hasNoAdmin={!hasAnyAdmin}
          onClaimAdmin={handlePromoteSelfToAdmin}
          canInstall={!!deferredPrompt}
          onInstall={handleInstallClick}
        />
      )}
      {activeTab === 'palpites' && <Predictions gp={activeGP} onSave={handlePredict} savedPredictions={predictions.filter(p => p.gpId === activeGP.id && p.userId === user.id)} />}
      {activeTab === 'palpitometro' && <Palpitometro gp={activeGP} stats={{}} totalUsers={1} />}
      {activeTab === 'ranking' && <Ranking currentUser={user} users={allUsers} calendar={calendar} />}
      {activeTab === 'admin' && user.isAdmin && <Admin gp={activeGP} calendar={calendar} onUpdateCalendar={(cal) => set(ref(db, 'calendar'), cal)} onSelectGp={() => {}} onCalculatePoints={() => {}} />}
    </Layout>
  );
};

export default App;
