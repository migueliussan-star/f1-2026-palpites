
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, RaceGP, SessionType, Prediction, Team } from './types';
import { INITIAL_CALENDAR, FALLBACK_CONSTRUCTORS } from './constants';
import Home from './screens/Home';
import Predictions from './screens/Predictions';
import Palpitometro from './screens/Palpitometro';
import Ranking from './screens/Ranking';
import Admin from './screens/Admin';
import Adversarios from './screens/Adversarios';
import Settings from './screens/Settings';
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

    // O GP termina às 23:59:59 do último dia
    const endDate = new Date(2026, monthIndex, endDay, 23, 59, 59);
    
    return { endDate };
  } catch (e) {
    console.warn("Erro ao processar data:", dateStr, e);
    return { startDate: new Date(), endDate: new Date() };
  }
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'palpites' | 'palpitometro' | 'ranking' | 'admin' | 'adversarios' | 'settings'>('home');
  const [user, setUser] = useState<User | null>(null);
  const [calendar, setCalendar] = useState<RaceGP[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [constructorsOrder, setConstructorsOrder] = useState<Team[]>(FALLBACK_CONSTRUCTORS);
  const [adminEditingGpId, setAdminEditingGpId] = useState<number | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loginError, setLoginError] = useState<string>('');
  const [isAuthButNoDb, setIsAuthButNoDb] = useState(false);

  // Deriva o usuário "vivo" (combinando Auth + Dados do DB em tempo real)
  const liveUser = useMemo(() => {
    if (!user) return null;
    const dbUser = allUsers.find(u => u.id === user.id);
    return dbUser ? { ...user, ...dbUser } : user;
  }, [user, allUsers]);

  // APLICA O TEMA AO DOM
  useEffect(() => {
    if (liveUser?.theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [liveUser?.theme]);

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

  // Fetch Constructor Standings from Ergast API (or Fallback)
  useEffect(() => {
    const fetchConstructors = async () => {
      try {
        const res = await fetch('https://ergast.com/api/f1/2026/constructorStandings.json');
        if (!res.ok) throw new Error('API not available');
        const data = await res.json();
        const standings = data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings;
        
        if (standings && standings.length > 0) {
            const apiTeams = standings.map((s: any) => {
                const name = s.Constructor.name;
                if (name.includes('Red Bull')) return 'Red Bull';
                if (name.includes('Ferrari')) return 'Ferrari';
                if (name.includes('McLaren')) return 'McLaren';
                if (name.includes('Mercedes')) return 'Mercedes';
                if (name.includes('Aston Martin')) return 'Aston Martin';
                if (name.includes('Alpine')) return 'Alpine';
                if (name.includes('Williams')) return 'Williams';
                if (name.includes('Haas')) return 'Haas';
                if (name.includes('RB') || name.includes('AlphaTauri') || name.includes('Racing Bulls')) return 'Racing Bulls';
                if (name.includes('Sauber') || name.includes('Audi')) return 'Audi';
                if (name.includes('Andretti') || name.includes('Cadillac')) return 'Cadillac';
                return null;
            }).filter((t: any) => t !== null) as Team[];

            if (apiTeams.length > 0) {
                 const combined = Array.from(new Set([...apiTeams, ...FALLBACK_CONSTRUCTORS]));
                 setConstructorsOrder(combined);
                 return;
            }
        }
        setConstructorsOrder(FALLBACK_CONSTRUCTORS);
      } catch (e) {
        setConstructorsOrder(FALLBACK_CONSTRUCTORS);
      }
    };
    fetchConstructors();
  }, []);

  // Processamento de dados de usuários
  const processUsersData = useCallback((data: any) => {
      if (data && typeof data === 'object') {
        let rawList = Object.entries(data).map(([key, value]: [string, any]) => {
            if (!value || typeof value !== 'object') return null;
            return {
                ...value,
                id: value.id || key 
            };
        }).filter(u => u && u.name);
        
        const uniqueUsersMap = new Map<string, User>();
        rawList.forEach(u => {
            if (!u) return;
            if (u.email && !u.isGuest) {
                if (!uniqueUsersMap.has(u.email)) {
                    uniqueUsersMap.set(u.email, u as User);
                } else {
                    const existing = uniqueUsersMap.get(u.email)!;
                    if ((u.points || 0) > (existing.points || 0)) {
                        uniqueUsersMap.set(u.email, u as User);
                    }
                }
            } else {
                uniqueUsersMap.set(u.id, u as User);
            }
        });
        
        const deduplicatedList = Array.from(uniqueUsersMap.values());
        const sortedList = deduplicatedList.sort((a, b) => (b.points || 0) - (a.points || 0));
        
        const processedList = sortedList.map((u, index) => {
            const currentRank = index + 1;
            let safeHistory: number[] = [];
            if (u.positionHistory && Array.isArray(u.positionHistory)) {
                safeHistory = u.positionHistory.map((val: any) => Number(val) || 0);
            } else if (u.positionHistory && typeof u.positionHistory === 'object') {
                safeHistory = Object.values(u.positionHistory).map((val: any) => Number(val) || 0);
            }

            return {
                ...u,
                rank: currentRank,
                positionHistory: safeHistory,
                previousRank: u.previousRank || currentRank
            };
        });

        setAllUsers(processedList);
      } else {
        setAllUsers([]);
      }
  }, []);

  // Listeners de Dados
  useEffect(() => {
    if (!user) {
        setAllUsers([]);
        setPredictions([]);
        return;
    }

    const calendarRef = ref(db, 'calendar');
    const usersRef = ref(db, 'users');
    const predictionsRef = ref(db, 'predictions');

    get(calendarRef).then(snap => {
        if (snap.exists()) {
             const data = snap.val();
             const calArray = Array.isArray(data) ? data.filter(Boolean) : Object.values(data).filter(Boolean);
             setCalendar(calArray);
        } else {
             setCalendar(INITIAL_CALENDAR);
        }
    }).catch(e => console.log("Calendar read skipped", e));

    get(usersRef).then(snap => snap.exists() && processUsersData(snap.val())).catch(e => console.log("Users read skipped", e));
    
    get(predictionsRef).then(snap => {
        if (snap.exists()) {
             const predList: Prediction[] = [];
             const val = snap.val();
             if (val && typeof val === 'object') {
                 Object.values(val).forEach((userPreds: any) => {
                    if (userPreds && typeof userPreds === 'object') {
                        Object.values(userPreds).forEach((p: any) => predList.push(p));
                    }
                 });
             }
             setPredictions(predList);
        }
    }).catch(e => console.log("Predictions read skipped", e));

    const unsubCalendar = onValue(calendarRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const calArray = Array.isArray(data) ? data.filter(Boolean) : Object.values(data).filter(Boolean);
        setCalendar(calArray);
      } else {
        setCalendar(INITIAL_CALENDAR);
      }
    }, (e) => console.log("Sync Calendar silenciado"));

    const unsubUsers = onValue(usersRef, (snapshot) => {
        processUsersData(snapshot.val());
    }, (error) => {
        console.error("Erro listener users:", error);
    });

    const unsubPredictions = onValue(predictionsRef, (snapshot) => {
      const data = snapshot.val();
      const predList: Prediction[] = [];
      if (data && typeof data === 'object') {
        Object.values(data).forEach((userPreds: any) => {
          if (userPreds && typeof userPreds === 'object') {
            Object.values(userPreds).forEach((p: any) => predList.push(p));
          }
        });
      }
      setPredictions(predList);
    }, (error) => {
        console.error("Erro listener predictions:", error);
    });

    return () => {
        unsubCalendar();
        unsubUsers();
        unsubPredictions();
    };
  }, [user?.id, processUsersData]);

  const loadUserProfile = useCallback(async (firebaseUser: any) => {
      setLoginError('');
      setIsAuthButNoDb(false);
      
      const userKey = firebaseUser.uid; 
      if (!userKey) {
        setLoginError("UID não identificado.");
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
            if (firebaseUser.isAnonymous) {
                 const guestUser: User = {
                    id: userKey,
                    name: 'Visitante',
                    email: '', 
                    points: 0,
                    rank: 0,
                    level: 'Bronze',
                    isAdmin: true,
                    isGuest: true,
                    previousRank: 0,
                    positionHistory: []
                 };
                 await set(userRef, guestUser);
                 setUser(guestUser);
                 return;
            }

          const usersRef = ref(db, 'users');
          const usersSnap = await get(usersRef);
          let oldUserData: any = null;
          let oldUserKey: string | null = null;
          let userCount = 0;

          if (usersSnap.exists()) {
            userCount = usersSnap.size;
            usersSnap.forEach((child) => {
                const u = child.val();
                if (u.email === firebaseUser.email && child.key !== userKey && !u.isGuest) {
                    oldUserData = u;
                    oldUserKey = child.key;
                }
            });
          }

          const shouldBeAdmin = userCount === 0;

          if (oldUserData && oldUserKey) {
             const newUserData: User = {
                 ...oldUserData,
                 id: userKey,
                 email: firebaseUser.email,
                 name: firebaseUser.displayName || oldUserData.name || 'Piloto',
                 isAdmin: oldUserData.isAdmin || shouldBeAdmin
             };
             await set(userRef, newUserData);
             if (oldUserKey) {
                 const oldPredsRef = ref(db, `predictions/${oldUserKey}`);
                 const oldPredsSnap = await get(oldPredsRef);
                 if (oldPredsSnap.exists()) {
                     await set(ref(db, `predictions/${userKey}`), oldPredsSnap.val());
                     await remove(oldPredsRef);
                 }
                 await remove(ref(db, `users/${oldUserKey}`));
             }
             setUser(newUserData);
          } else {
            const userData: User = {
                id: userKey,
                name: firebaseUser.displayName || 'Piloto',
                email: firebaseUser.email || '',
                points: 0,
                rank: 0,
                level: 'Bronze',
                isAdmin: shouldBeAdmin,
                previousRank: 0,
                positionHistory: []
            };
            await set(userRef, userData);
            setUser(userData);
          }
        }
      } catch (dbError: any) {
         console.error("Error fetching user data:", dbError);
         setLoginError("Erro de conexão com o banco de dados.");
         setIsAuthButNoDb(true);
         setUser(null);
      }
  }, []);

  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
        setIsInitialLoading((prev) => prev ? false : prev);
    }, 6000);

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
    if (!liveUser) return;
    try {
        await update(ref(db, `users/${liveUser.id}`), { isAdmin: true });
    } catch(e) {
        alert("Erro ao promover.");
    }
  };

  const handleCalculatePoints = async (currentGp: RaceGP) => {
    // 1. Verificar se TODAS as sessões estão fechadas (status === false)
    const allSessionsClosed = Object.values(currentGp.sessionStatus).every(isOpen => isOpen === false);

    const updatedCalendar = calendar.map(c => c.id === currentGp.id ? currentGp : c);
    const userPointsMap: Record<string, number> = {};

    // 2. Cálculo dos pontos
    allUsers.forEach(u => {
      let userTotalPoints = 0;
      updatedCalendar.forEach(calGp => {
          if (!calGp.results) return;
          const sessions: SessionType[] = calGp.isSprint 
            ? ['Qualy Sprint', 'corrida Sprint', 'Qualy corrida', 'corrida principal'] 
            : ['Qualy corrida', 'corrida principal'];
          
          sessions.forEach(session => {
             const officialResult = calGp.results?.[session];
             if (!officialResult) return;
             const pred = predictions.find(p => p.gpId === calGp.id && p.userId === u.id && p.session === session);
             if (pred) {
                (pred.top5 || []).forEach((driverId, idx) => {
                   if (driverId === officialResult[idx]) userTotalPoints += 5;
                   else if (officialResult.includes(driverId)) userTotalPoints += 1;
                });
             }
          });
      });
      userPointsMap[u.id] = userTotalPoints;
    });

    const realUsers = allUsers.filter(u => !u.isGuest);
    const guestUsers = allUsers.filter(u => u.isGuest);

    // Ordenação para Ranking
    const rankedUsers = realUsers.map(u => ({
        ...u,
        newPoints: userPointsMap[u.id] || 0
    })).sort((a, b) => b.newPoints - a.newPoints);

    const updates: Record<string, any> = {};

    rankedUsers.forEach((u, index) => {
        const newRank = index + 1;
        let newLevel = 'Bronze';
        if (u.newPoints >= 150) newLevel = 'Ouro';
        else if (u.newPoints >= 50) newLevel = 'Prata';
        
        // 3. Atualização do Histórico (positionHistory)
        // Só atualizamos o array de histórico se o GP estiver totalmente fechado.
        let newHistory = [...(u.positionHistory || [])];
        
        if (allSessionsClosed) {
            // Garante que o array tenha tamanho suficiente preenchendo com 0 se necessário
            // O índice do GP ID 1 é 0, GP ID 2 é 1, etc.
            while (newHistory.length < currentGp.id) {
                newHistory.push(0);
            }
            // Atualiza a posição específica deste GP
            newHistory[currentGp.id - 1] = newRank;
        }

        updates[`users/${u.id}/points`] = u.newPoints;
        updates[`users/${u.id}/rank`] = newRank;
        updates[`users/${u.id}/level`] = newLevel; 
        updates[`users/${u.id}/previousRank`] = u.rank;
        updates[`users/${u.id}/positionHistory`] = newHistory;
    });

    guestUsers.forEach(u => {
        updates[`users/${u.id}/points`] = userPointsMap[u.id] || 0;
    });

    try {
        if (currentGp.status === 'OPEN') {
            const newCalendar = updatedCalendar.map(c => c.id === currentGp.id ? { ...c, status: 'FINISHED' as const } : c);
            await set(ref(db, 'calendar'), newCalendar);
        } else {
            await set(ref(db, 'calendar'), updatedCalendar);
        }
        if (Object.keys(updates).length > 0) {
            await update(ref(db), updates);
        }
        alert("Pontos calculados com sucesso!");
        if (!allSessionsClosed) {
            alert("AVISO: O histórico de 'Tempo no Topo' NÃO foi atualizado pois existem sessões abertas neste GP.");
        }
    } catch (e) {
        console.error(e);
        alert("Erro ao salvar no banco.");
    }
  };

  const handleClearAllPredictions = async () => {
    if (!window.confirm("Zerar palpites e pontos?")) return;
    try {
        await remove(ref(db, 'predictions'));
        const updates: Record<string, any> = {};
        allUsers.forEach(u => {
            updates[`${u.id}/points`] = 0;
            updates[`${u.id}/rank`] = 0;
            updates[`${u.id}/level`] = 'Bronze'; 
            updates[`${u.id}/previousRank`] = 0;
            updates[`${u.id}/positionHistory`] = [];
        });
        if (Object.keys(updates).length > 0) await update(ref(db, 'users'), updates);
        alert("Resetado.");
    } catch (e) { console.error(e); }
  };

  const handleDeleteUser = async (targetUserId: string) => {
    if (!window.confirm("Excluir usuário?")) return;
    try {
        await remove(ref(db, `predictions/${targetUserId}`));
        await remove(ref(db, `users/${targetUserId}`));
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => { 
      signOut(auth); 
      setUser(null); 
      setActiveTab('home'); 
  };

  const handleUpdateUser = async (data: Partial<User>) => {
      if (!liveUser) return;
      try {
          await update(ref(db, `users/${liveUser.id}`), data);
          // Atualiza estado local para reflexo imediato
          setUser(prev => prev ? { ...prev, ...data } : null);
      } catch (e) {
          console.error("Erro ao atualizar usuário", e);
          throw e;
      }
  };

  const handlePredict = (gpId: number, session: SessionType, top5: string[]) => {
    if (!liveUser) return;
    const sessionKey = session.replace(/\s/g, '_');
    const newPrediction = { userId: liveUser.id, gpId, session, top5 };
    setPredictions(prev => [...prev.filter(p => !(p.userId === liveUser.id && p.gpId === gpId && p.session === session)), newPrediction]);
    set(ref(db, `predictions/${liveUser.id}/${gpId}_${sessionKey}`), newPrediction).catch(console.warn);
  };
  
  if (isInitialLoading) return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center"><div className="w-16 h-16 border-4 border-[#e10600]/20 border-t-[#e10600] rounded-full animate-spin"></div></div>;
  if (!liveUser) return <Login authError={loginError} onRetry={handleRetryProfileLoad} isAuthButNoDb={isAuthButNoDb} onLogout={handleLogout} />;

  const hasAnyAdmin = allUsers.some(u => u.isAdmin);
  const realTimeRank = liveUser.rank || (allUsers.findIndex(u => u.id === liveUser.id) + 1) || 1;
  const safeCalendar = Array.isArray(calendar) ? calendar.filter(Boolean) : [];
  const currentCalendar = safeCalendar.length > 0 ? safeCalendar : INITIAL_CALENDAR;
  
  const now = new Date();
  
  let activeGP = currentCalendar.find(gp => gp.status === 'OPEN');
  if (!activeGP) {
      activeGP = currentCalendar.find(gp => {
          const { endDate } = getGpDates(gp.date);
          return now <= endDate;
      });
  }
  if (!activeGP) activeGP = currentCalendar[currentCalendar.length - 1] || currentCalendar[0];
  
  if (!activeGP) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] text-white">
              <p>Calendário não carregado. Tente recarregar.</p>
          </div>
      );
  }
                   
  const adminGP = (calendar && Array.isArray(calendar) ? calendar : currentCalendar).find(c => c && c.id === adminEditingGpId) || activeGP;
  const activePredictions = predictions.filter(p => p && allUsers.some(u => u.id === p.userId));

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={liveUser.isAdmin}>
      {activeTab === 'home' && (
        <Home 
          user={{...liveUser, rank: realTimeRank}} 
          nextGP={activeGP} 
          predictionsCount={new Set(activePredictions.filter(p => p.gpId === activeGP?.id && p.userId === liveUser.id && (p.top5?.length || 0) > 0).map(p => p.session)).size} 
          onNavigateToPredict={() => setActiveTab('palpites')} 
          onLogout={handleLogout} 
          hasNoAdmin={!hasAnyAdmin}
          onClaimAdmin={handlePromoteSelfToAdmin}
          constructorsList={constructorsOrder}
        />
      )}
      {activeTab === 'palpites' && <Predictions gp={activeGP} onSave={handlePredict} savedPredictions={activePredictions.filter(p => p.gpId === activeGP?.id && p.userId === liveUser.id)} />}
      
      {activeTab === 'adversarios' && (
        <Adversarios 
          gp={activeGP}
          users={allUsers.filter(u => !u.isGuest)} 
          predictions={activePredictions}
          currentUser={liveUser}
        />
      )}

      {activeTab === 'palpitometro' && (
        <Palpitometro 
          gp={activeGP} 
          stats={activePredictions.filter(p => p.gpId === activeGP?.id).reduce((acc, p) => {
            if (!acc[p.session]) acc[p.session] = {};
            (p.top5 || []).forEach(dId => acc[p.session][dId] = (acc[p.session][dId] || 0) + 1);
            return acc;
          }, {} as any)} 
          totalUsers={new Set(activePredictions.filter(p => p.gpId === activeGP?.id).map(p => p.userId)).size} 
        />
      )}
      {activeTab === 'ranking' && <Ranking currentUser={liveUser} users={allUsers.filter(u => !u.isGuest)} calendar={currentCalendar} constructorsList={constructorsOrder} />}
      
      {activeTab === 'settings' && <Settings currentUser={liveUser} onUpdateUser={handleUpdateUser} />}

      {activeTab === 'admin' && liveUser.isAdmin && (
        <Admin 
          gp={adminGP} 
          calendar={currentCalendar} 
          users={allUsers}
          currentUser={liveUser}
          onUpdateCalendar={(cal) => set(ref(db, 'calendar'), cal)} 
          onSelectGp={(id) => setAdminEditingGpId(id)} 
          onCalculatePoints={handleCalculatePoints} 
          onDeleteUser={handleDeleteUser}
          onClearAllPredictions={handleClearAllPredictions}
          constructorsOrder={constructorsOrder}
        />
      )}
    </Layout>
  );
};

export default App;
