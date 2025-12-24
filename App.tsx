
import React, { useState, useEffect } from 'react';
import { User, RaceGP, SessionType, Prediction } from './types';
import { INITIAL_CALENDAR } from './constants';
import Home from './screens/Home';
import Predictions from './screens/Predictions';
import Palpitometro from './screens/Palpitometro';
import Ranking from './screens/Ranking';
import Admin from './screens/Admin';
import Adversarios from './screens/Adversarios';
import Stats from './screens/Stats';
import Login from './screens/Login';
import { Layout } from './components/Layout';
import { db, auth, ref, set, onValue, update, get, remove, onAuthStateChanged, signOut } from './firebase';

// Interface para o evento de instalação do PWA
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'palpites' | 'palpitometro' | 'ranking' | 'stats' | 'admin' | 'adversarios'>('home');
  const [user, setUser] = useState<User | null>(null);
  const [calendar, setCalendar] = useState<RaceGP[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [adminEditingGpId, setAdminEditingGpId] = useState<number | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Handler para capturar o prompt de instalação do PWA
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const calendarRef = ref(db, 'calendar');
    onValue(calendarRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setCalendar(data);
      else set(calendarRef, INITIAL_CALENDAR);
    });

    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userList = (Object.values(data) as User[]).filter(u => u.id && !u.id.startsWith('guest_') && u.email);
        setAllUsers(userList.sort((a, b) => (b.points || 0) - (a.points || 0)));
      }
    });

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

  const handleCalculatePoints = async (gp: RaceGP) => {
    if (!gp.results) return;
    const userPointsMap: Record<string, number> = {};
    allUsers.forEach(u => {
      let totalGpPoints = 0;
      const userPreds = predictions.filter(p => p.gpId === gp.id && p.userId === u.id);
      userPreds.forEach(pred => {
        const officialResult = gp.results?.[pred.session];
        if (officialResult) {
          pred.top5.forEach((driverId, idx) => {
            if (driverId === officialResult[idx]) totalGpPoints += 5;
            else if (officialResult.includes(driverId)) totalGpPoints += 1;
          });
        }
      });
      userPointsMap[u.id] = (u.points || 0) + totalGpPoints;
    });

    for (const [uid, pts] of Object.entries(userPointsMap)) {
      await update(ref(db, `users/${uid}`), { points: pts });
    }
    
    const newCalendar = calendar.map(c => c.id === gp.id ? { ...c, status: 'FINISHED' as const } : c);
    await set(ref(db, 'calendar'), newCalendar);
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
  
  const currentCalendar = calendar.length > 0 ? calendar : INITIAL_CALENDAR;
  const activeGP = currentCalendar.find(gp => gp.status === 'OPEN') || 
                   currentCalendar.find(gp => gp.status === 'UPCOMING') || 
                   currentCalendar[0];
                   
  const adminGP = calendar.find(c => c.id === adminEditingGpId) || activeGP;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={user.isAdmin}>
      {activeTab === 'home' && (
        <Home 
          user={{...user, rank: realTimeRank}} 
          nextGP={activeGP} 
          predictionsCount={new Set(predictions.filter(p => p.gpId === activeGP.id && p.userId === user.id).map(p => p.session)).size} 
          onNavigateToPredict={() => setActiveTab('palpites')} 
          onLogout={handleLogout} 
          onDeleteAccount={async () => {
            if (user && window.confirm("Excluir sua conta e todos os seus palpites?")) {
              await remove(ref(db, `users/${user.id}`));
              handleLogout();
            }
          }} 
          hasNoAdmin={!hasAnyAdmin}
          onClaimAdmin={handlePromoteSelfToAdmin}
          canInstall={!!deferredPrompt}
          onInstall={handleInstallClick}
        />
      )}
      {activeTab === 'palpites' && <Predictions gp={activeGP} onSave={handlePredict} savedPredictions={predictions.filter(p => p.gpId === activeGP.id && p.userId === user.id)} />}
      
      {activeTab === 'adversarios' && (
        <Adversarios 
          gp={activeGP}
          users={allUsers}
          predictions={predictions}
          currentUser={user}
        />
      )}

      {activeTab === 'palpitometro' && (
        <Palpitometro 
          gp={activeGP} 
          stats={predictions.filter(p => p.gpId === activeGP.id).reduce((acc, p) => {
            if (!acc[p.session]) acc[p.session] = {};
            p.top5.forEach(dId => acc[p.session][dId] = (acc[p.session][dId] || 0) + 1);
            return acc;
          }, {} as any)} 
          totalUsers={new Set(predictions.filter(p => p.gpId === activeGP.id).map(p => p.userId)).size} 
        />
      )}
      {activeTab === 'ranking' && <Ranking currentUser={user} users={allUsers} calendar={calendar} />}
      {activeTab === 'stats' && <Stats user={user} />}
      {activeTab === 'admin' && user.isAdmin && (
        <Admin 
          gp={adminGP} 
          calendar={calendar} 
          onUpdateCalendar={(cal) => set(ref(db, 'calendar'), cal)} 
          onSelectGp={(id) => setAdminEditingGpId(id)} 
          onCalculatePoints={handleCalculatePoints} 
        />
      )}
    </Layout>
  );
};

export default App;
