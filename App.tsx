
import React, { useState, useEffect, useCallback } from 'react';
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

// Helper ROBUSTO para datas
const getGpDates = (dateStr: string) => {
  const months: { [key: string]: number } = {
    'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
    'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
  };

  try {
    if (!dateStr) return { startDate: new Date(), endDate: new Date() };
    
    const parts = dateStr.trim().split(' ');
    if (parts.length < 2) return { startDate: new Date(), endDate: new Date() };

    const daysPart = parts[0];
    const monthStr = parts[1];
    if (!monthStr) return { startDate: new Date(), endDate: new Date() };

    const monthPart = monthStr.toLowerCase().substring(0, 3);
    const monthIndex = months[monthPart] ?? 0;

    let endDay = 1;

    if (daysPart.includes('-')) {
      const dayParts = daysPart.split('-');
      endDay = parseInt(dayParts[1]) || 1;
    } else {
      endDay = parseInt(daysPart) || 1;
    }

    const endDate = new Date(2026, monthIndex, endDay, 23, 59, 59);
    
    return { endDate };
  } catch (e) {
    console.warn("Erro ao processar data:", dateStr, e);
    return { startDate: new Date(), endDate: new Date() };
  }
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'palpites' | 'palpitometro' | 'ranking' | 'stats' | 'admin' | 'adversarios'>('home');
  const [user, setUser] = useState<User | null>(null);
  const [calendar, setCalendar] = useState<RaceGP[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [adminEditingGpId, setAdminEditingGpId] = useState<number | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loginError, setLoginError] = useState<string>('');
  const [isAuthButNoDb, setIsAuthButNoDb] = useState(false);

  // Monitora estado da conexão com Firebase
  useEffect(() => {
    const connectedRef = ref(db, ".info/connected");
    const unsub = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        console.log("Firebase: Conectado");
      } else {
        console.log("Firebase: Desconectado");
      }
    });
    return () => unsub();
  }, []);

  // Função isolada para carregar perfil
  const loadUserProfile = useCallback(async (firebaseUser: any) => {
      setLoginError('');
      setIsAuthButNoDb(false);
      
      const userKey = firebaseUser.email?.replace(/\./g, '_') || '';
          
      if (!userKey) {
        setLoginError("Email não identificado na conta Google.");
        await signOut(auth);
        setUser(null);
        return;
      }

      const userRef = ref(db, `users/${userKey}`);
      
      try {
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          setUser(snapshot.val());
        } else {
          // Cria novo usuário
          const userData: User = {
            id: userKey,
            name: firebaseUser.displayName || 'Piloto',
            email: firebaseUser.email || '',
            points: 0,
            rank: 0,
            level: 'Bronze',
            isAdmin: false,
            previousRank: 0,
            positionHistory: []
          };
          await set(userRef, userData);
          setUser(userData);
        }
      } catch (dbError: any) {
         console.error("Error fetching user data from DB:", dbError);
         
         // MENSAGEM DE ERRO DETALHADA
         let errorMsg = `Erro no Banco (${dbError.code || 'Desconhecido'}): ${dbError.message}`;
         
         if (dbError?.code === 'PERMISSION_DENIED') {
             errorMsg = "Permissão negada (PERMISSION_DENIED). Verifique as Regras no Firebase Console.";
         } else if (dbError?.code === 'NETWORK_ERROR') {
             errorMsg = "Sem conexão. Verifique sua internet.";
         } else if (dbError?.code === 'CLIENT_OFFLINE') {
             errorMsg = "Cliente offline. Tentando reconectar...";
         } else if (dbError?.code === 'unavailable') {
             errorMsg = "Serviço indisponível temporariamente.";
         }
         
         setLoginError(errorMsg);
         // IMPORTANTE: NÃO DESLOGAR AQUI. 
         // Mantemos a auth válida para permitir retry.
         setIsAuthButNoDb(true);
         setUser(null);
      }
  }, []);

  useEffect(() => {
    // Timeout de segurança
    const safetyTimeout = setTimeout(() => {
        setIsInitialLoading((prev) => {
            if (prev) {
                console.warn("Loading safety timeout triggered");
                return false;
            }
            return prev;
        });
    }, 6000);

    const calendarRef = ref(db, 'calendar');
    onValue(calendarRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCalendar(data);
      } else {
        // Inicializa APENAS se não houver dados
        // set(calendarRef, INITIAL_CALENDAR).catch(e => console.warn("Erro init calendar (provavelmente permissão):", e));
        // Melhor usar o local se falhar a leitura
        setCalendar(INITIAL_CALENDAR);
      }
    }, (error) => {
        console.warn("Erro ao ler calendário:", error);
        setCalendar(INITIAL_CALENDAR); // Fallback local
    });

    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userList = (Object.values(data) as User[]).filter(u => u.id && !u.id.startsWith('guest_') && u.email);
        const sortedList = userList.sort((a, b) => (b.points || 0) - (a.points || 0));
        
        const processedList = sortedList.map((u, index) => {
            const currentRank = index + 1;
            return {
                ...u,
                rank: currentRank,
                positionHistory: u.positionHistory || [],
                previousRank: u.previousRank || currentRank
            };
        });

        setAllUsers(processedList);
      } else {
        setAllUsers([]);
      }
    }, (error) => {
        console.warn("Erro ao ler usuários:", error);
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
    }, (error) => {
         console.warn("Erro ao ler palpites:", error);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(safetyTimeout);
      
      try {
        if (firebaseUser) {
           await loadUserProfile(firebaseUser);
        } else {
          setUser(null);
          setIsAuthButNoDb(false);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        setUser(null);
      } finally {
        setIsInitialLoading(false);
      }
    });

    return () => {
        clearTimeout(safetyTimeout);
        unsubscribeAuth();
    };
  }, [loadUserProfile]);

  const handleRetryProfileLoad = async () => {
      if (auth.currentUser) {
          setIsInitialLoading(true); 
          await loadUserProfile(auth.currentUser);
          setIsInitialLoading(false);
      } else {
          setLoginError("Sessão expirou. Faça login novamente.");
          setIsAuthButNoDb(false);
      }
  };

  const handlePromoteSelfToAdmin = async () => {
    if (!user) return;
    const userRef = ref(db, `users/${user.id}`);
    await update(userRef, { isAdmin: true });
    setUser({ ...user, isAdmin: true });
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

    const sortedByNewPoints = [...allUsers].sort((a, b) => {
        const pointsA = userPointsMap[a.id] || 0;
        const pointsB = userPointsMap[b.id] || 0;
        return pointsB - pointsA;
    });

    for (let i = 0; i < sortedByNewPoints.length; i++) {
        const u = sortedByNewPoints[i];
        const newRank = i + 1;
        const newPoints = userPointsMap[u.id];
        
        const history = u.positionHistory || [];
        history.push(newRank);
        if (history.length > 5) history.shift();

        await update(ref(db, `users/${u.id}`), { 
            points: newPoints,
            rank: newRank,
            previousRank: u.rank,
            positionHistory: history
        });
    }
    
    const newCalendar = calendar.map(c => c.id === gp.id ? { ...c, status: 'FINISHED' as const } : c);
    await set(ref(db, 'calendar'), newCalendar);
  };

  const handleClearAllPredictions = async () => {
    if (!window.confirm("ATENÇÃO: Isso apagará TODOS os palpites e ZERARÁ os pontos. Confirmar?")) return;
    try {
        await remove(ref(db, 'predictions'));
        const updates: Record<string, any> = {};
        allUsers.forEach(u => {
            updates[`${u.id}/points`] = 0;
            updates[`${u.id}/rank`] = 0;
            updates[`${u.id}/previousRank`] = 0;
            updates[`${u.id}/positionHistory`] = [];
        });
        if (Object.keys(updates).length > 0) await update(ref(db, 'users'), updates);
        alert("Resetado com sucesso.");
    } catch (e) {
        console.error(e);
        alert("Erro ao resetar.");
    }
  };

  const handleDeleteUser = async (targetUserId: string) => {
    if (!window.confirm("Excluir usuário permanentemente?")) return;
    try {
        await remove(ref(db, `predictions/${targetUserId}`));
        await remove(ref(db, `users/${targetUserId}`));
        alert("Usuário removido.");
    } catch (e) { console.error(e); alert("Erro ao remover."); }
  };

  const handleLogout = () => { signOut(auth); setUser(null); setActiveTab('home'); };

  const handlePredict = (gpId: number, session: SessionType, top5: string[]) => {
    if (!user) return;
    const sessionKey = session.replace(/\s/g, '_');
    set(ref(db, `predictions/${user.id}/${gpId}_${sessionKey}`), { userId: user.id, gpId, session, top5 });
  };

  if (isInitialLoading) return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center"><div className="w-16 h-16 border-4 border-[#e10600]/20 border-t-[#e10600] rounded-full animate-spin"></div></div>;
  
  // Renderiza Login se não tiver usuário carregado
  if (!user) return <Login authError={loginError} onRetry={handleRetryProfileLoad} isAuthButNoDb={isAuthButNoDb} onLogout={handleLogout} />;

  const hasAnyAdmin = allUsers.some(u => u.isAdmin);
  const realTimeRank = allUsers.findIndex(u => u.id === user.id) + 1 || user.rank || allUsers.length;
  const currentCalendar = calendar.length > 0 ? calendar : INITIAL_CALENDAR;
  
  const now = new Date();
  let activeGP = currentCalendar.find(gp => gp.status === 'OPEN');
  if (!activeGP) {
      activeGP = currentCalendar.find(gp => {
          const { endDate } = getGpDates(gp.date);
          return now <= endDate;
      });
  }
  if (!activeGP) activeGP = currentCalendar[currentCalendar.length - 1] || currentCalendar[0];
                   
  const adminGP = calendar.find(c => c.id === adminEditingGpId) || activeGP;
  const activePredictions = predictions.filter(p => allUsers.some(u => u.id === p.userId));

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={user.isAdmin}>
      {activeTab === 'home' && (
        <Home 
          user={{...user, rank: realTimeRank}} 
          nextGP={activeGP} 
          predictionsCount={new Set(activePredictions.filter(p => p.gpId === activeGP.id && p.userId === user.id).map(p => p.session)).size} 
          onNavigateToPredict={() => setActiveTab('palpites')} 
          onLogout={handleLogout} 
          hasNoAdmin={!hasAnyAdmin}
          onClaimAdmin={handlePromoteSelfToAdmin}
        />
      )}
      {activeTab === 'palpites' && <Predictions gp={activeGP} onSave={handlePredict} savedPredictions={activePredictions.filter(p => p.gpId === activeGP.id && p.userId === user.id)} />}
      
      {activeTab === 'adversarios' && (
        <Adversarios 
          gp={activeGP}
          users={allUsers}
          predictions={activePredictions}
          currentUser={user}
        />
      )}

      {activeTab === 'palpitometro' && (
        <Palpitometro 
          gp={activeGP} 
          stats={activePredictions.filter(p => p.gpId === activeGP.id).reduce((acc, p) => {
            if (!acc[p.session]) acc[p.session] = {};
            p.top5.forEach(dId => acc[p.session][dId] = (acc[p.session][dId] || 0) + 1);
            return acc;
          }, {} as any)} 
          totalUsers={new Set(activePredictions.filter(p => p.gpId === activeGP.id).map(p => p.userId)).size} 
        />
      )}
      {activeTab === 'ranking' && <Ranking currentUser={user} users={allUsers} calendar={calendar} />}
      {activeTab === 'stats' && <Stats currentUser={user} users={allUsers} />}
      {activeTab === 'admin' && user.isAdmin && (
        <Admin 
          gp={adminGP} 
          calendar={calendar} 
          users={allUsers}
          currentUser={user}
          onUpdateCalendar={(cal) => set(ref(db, 'calendar'), cal)} 
          onSelectGp={(id) => setAdminEditingGpId(id)} 
          onCalculatePoints={handleCalculatePoints} 
          onDeleteUser={handleDeleteUser}
          onClearAllPredictions={handleClearAllPredictions}
        />
      )}
    </Layout>
  );
};

export default App;
