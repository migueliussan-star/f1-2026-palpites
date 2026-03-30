
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { User, RaceGP, SessionType, Prediction, Team, League } from './types';
import { INITIAL_CALENDAR, FALLBACK_CONSTRUCTORS } from './constants';
import Home from './screens/Home';
import Predictions from './screens/Predictions';
import Palpitometro from './screens/Palpitometro';
import Ranking from './screens/Ranking';
import Admin from './screens/Admin';
import Adversarios from './screens/Adversarios';
import Settings from './screens/Settings';
import Login from './screens/Login';
import Leagues from './screens/Leagues';
import Performance from './screens/Performance';
import { Layout } from './components/Layout';
import { LoadingScreen } from './components/LoadingScreen';
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
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(localStorage.getItem('selectedLeagueId'));
  const [activeTab, setActiveTab] = useState<'home' | 'palpites' | 'palpitometro' | 'ranking' | 'admin' | 'adversarios' | 'settings' | 'ligas' | 'desempenho'>(localStorage.getItem('selectedLeagueId') ? 'home' : 'ligas');
  const [user, setUser] = useState<User | null>(null);
  const [calendar, setCalendar] = useState<RaceGP[]>([]);
  const [isCalendarLoaded, setIsCalendarLoaded] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const activePredictions = useMemo(() => predictions.filter(p => p && allUsers.some(u => u.id === p.userId)), [predictions, allUsers]);
  const [constructorsOrder, setConstructorsOrder] = useState<Team[]>(FALLBACK_CONSTRUCTORS);
  const [adminEditingGpId, setAdminEditingGpId] = useState<number | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loginError, setLoginError] = useState<string>('');
  const [isAuthButNoDb, setIsAuthButNoDb] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Deriva o usuário "vivo" (combinando Auth + Dados do DB em tempo real)
  const liveUser = useMemo(() => {
    if (!user) return null;
    const dbUser = allUsers.find(u => u.id === user.id);
    return dbUser ? { ...user, ...dbUser } : user;
  }, [user, allUsers]);

  const leagueUsers = useMemo(() => {
    if (!selectedLeagueId) return allUsers;
    return allUsers.filter(u => u.leagues?.includes(selectedLeagueId));
  }, [allUsers, selectedLeagueId]);

  const leaguePredictions = useMemo(() => {
    if (!selectedLeagueId) return activePredictions;
    const userIds = new Set(leagueUsers.map(u => u.id));
    return activePredictions.filter(p => userIds.has(p.userId));
  }, [activePredictions, leagueUsers, selectedLeagueId]);

  const realTimeRank = useMemo(() => {
    if (!liveUser) return 1;
    if (!selectedLeagueId) return liveUser.rank || (allUsers.findIndex(u => u.id === liveUser.id) + 1) || 1;
    return leagueUsers.sort((a, b) => (b.points || 0) - (a.points || 0)).findIndex(u => u.id === liveUser.id) + 1;
  }, [liveUser?.rank, liveUser?.id, allUsers, leagueUsers, selectedLeagueId]);

  const isLeagueOwner = useMemo(() => {
    if (!selectedLeagueId || !liveUser) return false;
    const league = leagues.find(l => l.id === selectedLeagueId);
    return league?.ownerId === liveUser.id;
  }, [leagues, selectedLeagueId, liveUser?.id]);

  const canAccessAdmin = useMemo(() => {
    if (!liveUser) return false;
    if (liveUser.isAdmin) return true;
    if (selectedLeagueId && isLeagueOwner) return true;
    return false;
  }, [liveUser, selectedLeagueId, isLeagueOwner]);

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
        const res = await fetch('https://api.jolpi.ca/ergast/f1/2026/constructorstandings/');
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
                 // Garante que o Safety Car seja sempre o último
                 const filtered = combined.filter(t => t !== 'Safety Car');
                 setConstructorsOrder([...filtered, 'Safety Car']);
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
            
            // Garantir que positionHistory é um array
            let safeHistory: number[] = [];
            if (u.positionHistory && Array.isArray(u.positionHistory)) {
                safeHistory = u.positionHistory.map((val: any) => Number(val) || 0);
            } else if (u.positionHistory && typeof u.positionHistory === 'object') {
                safeHistory = Object.values(u.positionHistory).map((val: any) => Number(val) || 0);
            }

            // Garantir que leagues é um array
            let safeLeagues: string[] = [];
            if (u.leagues && Array.isArray(u.leagues)) {
                safeLeagues = u.leagues.filter(Boolean) as string[];
            } else if (u.leagues && typeof u.leagues === 'object') {
                safeLeagues = Object.values(u.leagues).filter(Boolean) as string[];
            }

            // Garantir que invalidatedGPs é um array
            let safeInvalidated: number[] = [];
            if (u.invalidatedGPs && Array.isArray(u.invalidatedGPs)) {
                safeInvalidated = u.invalidatedGPs.map((val: any) => Number(val)).filter(n => !isNaN(n));
            } else if (u.invalidatedGPs && typeof u.invalidatedGPs === 'object') {
                safeInvalidated = Object.values(u.invalidatedGPs).map((val: any) => Number(val)).filter(n => !isNaN(n));
            }

            return {
                ...u,
                rank: currentRank,
                positionHistory: safeHistory,
                leagues: safeLeagues,
                invalidatedGPs: safeInvalidated,
                previousRank: u.previousRank || currentRank
            };
        });

        setAllUsers(processedList);
      } else {
        setAllUsers([]);
      }
  }, []);

  // Listeners de Dados e Automação de Fechamento
  useEffect(() => {
    if (!user) {
        setAllUsers([]);
        setPredictions([]);
        return;
    }

    const calendarRef = ref(db, 'calendar');
    const usersRef = ref(db, 'users');
    const predictionsRef = ref(db, 'predictions');
    const leaguesRef = ref(db, 'leagues');

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
                        Object.values(userPreds).forEach((p: any) => {
                            let safeTop5 = p.top5;
                            if (safeTop5 && !Array.isArray(safeTop5) && typeof safeTop5 === 'object') {
                                safeTop5 = Object.values(safeTop5);
                            }
                            predList.push({ ...p, top5: safeTop5 || [] });
                        });
                    }
                 });
             }
             setPredictions(predList);
        }
    }).catch(e => console.log("Predictions read skipped", e));

    get(leaguesRef).then(snap => {
        if (snap.exists()) {
            const data = snap.val();
            const leagueList = Object.keys(data).map(id => ({ id, ...data[id] }));
            setLeagues(leagueList);
        }
    }).catch(e => console.log("Leagues read skipped", e));

    const unsubCalendar = onValue(calendarRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const calArray = Array.isArray(data) ? data.filter(Boolean) : Object.values(data).filter(Boolean);
        setCalendar(calArray);
      } else {
        setCalendar(INITIAL_CALENDAR);
      }
      setIsCalendarLoaded(true);
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

    const unsubLeagues = onValue(leaguesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const leagueList = Object.keys(data).map(id => ({ id, ...data[id] }));
            setLeagues(leagueList);
        } else {
            setLeagues([]);
        }
    }, (error) => {
        console.error("Erro listener leagues:", error);
    });

    return () => {
        unsubCalendar();
        unsubUsers();
        unsubPredictions();
        unsubLeagues();
    };
  }, [user?.id, processUsersData]);

  // Automação de fechamento de sessões (1 hora antes)
  useEffect(() => {
    if (!user?.isAdmin || !calendar || calendar.length === 0) return;

    const checkSessionTimes = () => {
      const now = new Date();
      let hasChanges = false;
      
      const updatedCalendar = calendar.map(gp => {
        if (gp.status !== 'OPEN' && gp.status !== 'UPCOMING') return gp;
        
        const sessionsToCheck: SessionType[] = gp.isSprint 
          ? ['Qualy Sprint', 'corrida Sprint', 'Qualy corrida', 'corrida principal'] 
          : ['Qualy corrida', 'corrida principal'];
          
        let gpChanged = false;
        const newSessionStatus = { ...gp.sessionStatus };
        
        sessionsToCheck.forEach(session => {
          // Se o admin fez override manual, não mexe
          if (gp.manualOverride && gp.manualOverride[session] !== undefined) {
             return;
          }
          
          // Determinar a sessão de referência para o deadline
          let referenceSessionKey: SessionType;
          let fallbackSessionKey = '';
          
          if (gp.isSprint) {
              if (session === 'Qualy Sprint' || session === 'corrida Sprint') {
                  referenceSessionKey = 'Qualy Sprint';
                  fallbackSessionKey = 'Sprint Q';
              } else {
                  referenceSessionKey = 'Qualy corrida';
                  fallbackSessionKey = 'Classificação';
              }
          } else {
              referenceSessionKey = 'Qualy corrida';
              fallbackSessionKey = 'Classificação';
          }

          const referenceIsoDate = gp.sessions?.[referenceSessionKey] || gp.sessions?.[fallbackSessionKey];
          if (referenceIsoDate) {
            const referenceDate = new Date(referenceIsoDate);
            
            // 10 minutos antes da sessão de referência
            const offset = (10 * 60 * 1000);
            const deadline = new Date(referenceDate.getTime() - offset);
            
            if (now >= deadline && newSessionStatus[session] !== false) {
              newSessionStatus[session] = false;
              gpChanged = true;
              hasChanges = true;
              console.log(`Auto-fechando sessão ${session} do GP ${gp.name} baseado na qualy ${referenceSessionKey}`);
            }
          }
        });
        
        if (gpChanged) {
          return { ...gp, sessionStatus: newSessionStatus };
        }
        return gp;
      });
      
      if (hasChanges) {
        // Apenas o admin salva no banco para evitar múltiplas escritas
        set(ref(db, 'calendar'), updatedCalendar).catch(e => console.error("Erro ao auto-fechar sessão:", e));
      }
    };

    const intervalId = setInterval(checkSessionTimes, 60000); // Verifica a cada minuto
    
    // Executa uma vez na montagem também
    checkSessionTimes();

    return () => {
        clearInterval(intervalId);
    };
  }, [calendar, user?.isAdmin]);

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
          const userData = snapshot.val();
          if (userData) {
              // Garantir que o ID esteja presente
              userData.id = userData.id || firebaseUser.uid;
              
              // Garantir que campos de array sejam arrays
              userData.leagues = userData.leagues 
                ? (Array.isArray(userData.leagues) ? userData.leagues : Object.values(userData.leagues)) 
                : [];
              
              userData.invalidatedGPs = userData.invalidatedGPs 
                ? (Array.isArray(userData.invalidatedGPs) ? userData.invalidatedGPs : Object.values(userData.invalidatedGPs)) 
                : [];

              userData.positionHistory = userData.positionHistory 
                ? (Array.isArray(userData.positionHistory) ? userData.positionHistory : Object.values(userData.positionHistory)) 
                : [];

              if (firebaseUser.email === 'iussan639@gmail.com' && !userData.isAdmin) {
                  userData.isAdmin = true;
                  await set(userRef, userData);
              }
          }
          setUser(userData);
        } else {
            if (firebaseUser.isAnonymous) {
                 const guestUser: User = {
                    id: userKey,
                    name: 'Visitante',
                    email: '', 
                    points: 0,
                    rank: 0,
                    level: 'Bronze',
                    isAdmin: false,
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

          const shouldBeAdmin = userCount === 0 || firebaseUser.email === 'iussan639@gmail.com';

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
        toast.error("Erro ao promover.");
    }
  };

  const handleCalculatePoints = async (currentGp: RaceGP) => {
    if (selectedLeagueId) {
      if (!isLeagueOwner && !liveUser?.isAdmin) {
        toast.error("Apenas o dono da liga ou administradores podem calcular pontos.");
        return;
      }
    } else {
      if (!liveUser?.isAdmin) {
        toast.error("Apenas administradores globais podem calcular pontos.");
        return;
      }
    }

    // Fixa o GP atual na tela de admin para não pular para o próximo GP ativo
    setAdminEditingGpId(currentGp.id);

    // 1. Verificar se TODAS as sessões estão fechadas (status === false)
    const allSessionsClosed = Object.values(currentGp.sessionStatus).every(isOpen => isOpen === false);

    const updatedCalendar = currentCalendar.map(c => c.id === currentGp.id ? currentGp : c);
    const userPointsMap: Record<string, number> = {};
    const userPointsHistoryMap: Record<string, { gpId: number; points: number }[]> = {};

    const targetUsers = selectedLeagueId ? leagueUsers : allUsers;

    // 2. Cálculo dos pontos
    targetUsers.forEach(u => {
      let userTotalPoints = 0;
      let consecutiveP1Driver: string | null = null;
      let consecutiveP1Count = 0;
      let pointsHistory: { gpId: number; points: number }[] = [...(u.pointsHistory || [])];
      
      updatedCalendar.forEach(calGp => {
          if (!calGp.results) return;
          if (u.invalidatedGPs?.includes(calGp.id)) return; // Ignora GPs onde o palpite foi invalidado
          
          let gpPoints = 0;
          
          // Check for "Fiel à Escuderia"
          const mainRacePred = predictions.find(p => p.gpId === calGp.id && p.userId === u.id && p.session === 'corrida principal');
          if (mainRacePred && mainRacePred.top5 && mainRacePred.top5.length > 0) {
              const p1Driver = mainRacePred.top5[0];
              if (p1Driver === consecutiveP1Driver) {
                  consecutiveP1Count++;
              } else {
                  consecutiveP1Driver = p1Driver;
                  consecutiveP1Count = 1;
              }
          } else {
              consecutiveP1Driver = null;
              consecutiveP1Count = 0;
          }
          
          const sessions: SessionType[] = calGp.isSprint 
            ? ['Qualy Sprint', 'corrida Sprint', 'Qualy corrida', 'corrida principal'] 
            : ['Qualy corrida', 'corrida principal'];
          
          sessions.forEach(session => {
             const officialResult = calGp.results?.[session];
             if (!officialResult) return;
             const pred = predictions.find(p => p.gpId === calGp.id && p.userId === u.id && p.session === session);
             if (pred) {
                (pred.top5 || []).forEach((driverId, idx) => {
                   if (driverId === officialResult[idx]) {
                       userTotalPoints += 5;
                       gpPoints += 5;
                   }
                   else if (officialResult.includes(driverId)) {
                       userTotalPoints += 1;
                       gpPoints += 1;
                   }
                });
             }
          });
          
          // Update points history for this GP
          const existingGpIndex = pointsHistory.findIndex(ph => ph.gpId === calGp.id);
          if (existingGpIndex !== -1) {
              pointsHistory[existingGpIndex].points = gpPoints;
          } else {
              pointsHistory.push({ gpId: calGp.id, points: gpPoints });
          }
      });
      
      userPointsMap[u.id] = userTotalPoints;
      userPointsHistoryMap[u.id] = pointsHistory;
    });

    const realUsers = targetUsers.filter(u => !u.isGuest);
    const guestUsers = targetUsers.filter(u => u.isGuest);

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
        updates[`users/${u.id}/pointsHistory`] = userPointsHistoryMap[u.id] || [];
    });

    guestUsers.forEach(u => {
        updates[`users/${u.id}/points`] = userPointsMap[u.id] || 0;
        updates[`users/${u.id}/pointsHistory`] = userPointsHistoryMap[u.id] || [];
    });

    try {
        const finalCalendar = currentGp.status === 'OPEN' 
            ? updatedCalendar.map(c => c.id === currentGp.id ? { ...c, status: 'FINISHED' as const } : c)
            : updatedCalendar;

        if (selectedLeagueId) {
            await set(ref(db, `leagues/${selectedLeagueId}/calendar`), finalCalendar);
        } else {
            await set(ref(db, 'calendar'), finalCalendar);
        }

        if (Object.keys(updates).length > 0) {
            await update(ref(db), updates);
        }
        toast.success("Pontos calculados com sucesso!");
        if (!allSessionsClosed) {
            toast("AVISO: O histórico de 'Tempo no Topo' NÃO foi atualizado pois existem sessões abertas neste GP.", { icon: '⚠️' });
        }
    } catch (e) {
        console.error(e);
        toast.error("Erro ao salvar no banco.");
    }
  };

  const handleClearAllPredictions = async () => {
    if (!liveUser?.isAdmin) {
      toast.error("Apenas administradores globais podem zerar o sistema.");
      return;
    }
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
            updates[`${u.id}/invalidatedGPs`] = [];
        });
        if (Object.keys(updates).length > 0) await update(ref(db, 'users'), updates);
        toast.success("Resetado.");
    } catch (e) { console.error(e); }
  };

  const handleToggleInvalidateUserGp = async (userId: string, gpId: number) => {
    if (!liveUser?.isAdmin) {
      toast.error("Apenas administradores globais podem invalidar palpites.");
      return;
    }
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    const currentInvalidated = user.invalidatedGPs || [];
    const isInvalidated = currentInvalidated.includes(gpId);
    
    let newInvalidated;
    if (isInvalidated) {
        newInvalidated = currentInvalidated.filter(id => id !== gpId);
    } else {
        newInvalidated = [...currentInvalidated, gpId];
    }
    
    try {
        await update(ref(db, `users/${userId}`), { invalidatedGPs: newInvalidated });
    } catch (e) {
        console.error("Erro ao invalidar/validar palpite:", e);
        toast.error("Erro ao atualizar status do palpite.");
    }
  };

  const handleDeleteUser = async (targetUserId: string) => {
    if (!liveUser?.isAdmin) {
      toast.error("Apenas administradores globais podem excluir usuários.");
      return;
    }
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
          setAllUsers(prev => prev.map(u => u.id === liveUser.id ? { ...u, ...data } : u));
      } catch (e) {
          console.error("Erro ao atualizar usuário", e);
          throw e;
      }
  };

  const handleToggleAdmin = async (targetUserId: string) => {
    if (!liveUser?.isAdmin) {
      toast.error("Apenas administradores globais podem gerenciar administradores.");
      return;
    }
    const targetUser = allUsers.find(u => u.id === targetUserId);
    if (!targetUser) return;
    try {
        await update(ref(db, `users/${targetUserId}`), { isAdmin: !targetUser.isAdmin });
        toast.success(`Status de admin ${!targetUser.isAdmin ? 'concedido' : 'removido'} para ${targetUser.name}`);
    } catch (e) {
        console.error("Erro ao alterar status de admin:", e);
        toast.error("Erro ao atualizar status.");
    }
  };

  const handlePredict = async (gpId: number, session: SessionType, top5: string[]) => {
    if (!liveUser) return;
    const sessionKey = session.replace(/\s/g, '_');
    const newPrediction = { userId: liveUser.id, gpId, session, top5, timestamp: new Date().toISOString() };
    setPredictions(prev => [...prev.filter(p => !(p.userId === liveUser.id && p.gpId === gpId && p.session === session)), newPrediction]);
    
    try {
        await set(ref(db, `predictions/${liveUser.id}/${gpId}_${sessionKey}`), newPrediction);
    } catch (e) {
        console.warn(e);
    }
  };
  
  const safeCalendar: RaceGP[] = Array.isArray(calendar) ? calendar.filter(Boolean) as RaceGP[] : [];
  
  const currentCalendar: RaceGP[] = useMemo(() => {
    if (selectedLeagueId) {
      const league = leagues.find(l => l.id === selectedLeagueId);
      if (league && league.calendar && league.calendar.length > 0) {
        return league.calendar;
      }
    }
    return safeCalendar.length > 0 ? safeCalendar : INITIAL_CALENDAR;
  }, [selectedLeagueId, leagues, safeCalendar]);
  
  const now = new Date();
  
  let activeGP = currentCalendar.find((gp: RaceGP) => gp.status === 'OPEN');
  if (!activeGP) {
      activeGP = currentCalendar.find((gp: RaceGP) => {
          const { endDate } = getGpDates(gp.date);
          return now <= endDate;
      });
  }
  if (!activeGP) activeGP = currentCalendar[currentCalendar.length - 1] || currentCalendar[0];
  
  const adminGP = currentCalendar.find((c: RaceGP) => c && c.id === adminEditingGpId) || activeGP;

  // Gerencia o GP selecionado na tela de admin para evitar pulos quando o status muda
  useEffect(() => {
    if (activeTab === 'admin') {
      setAdminEditingGpId(prev => prev !== null ? prev : (activeGP ? activeGP.id : null));
    } else {
      setAdminEditingGpId(null);
    }
  }, [activeTab]);

  // Lógica de Notificações
  useEffect(() => {
    if (!liveUser || !activeGP || !isCalendarLoaded) return;

    const today = new Date().toISOString().split('T')[0];
    const storedLastRemindedDate = localStorage.getItem('lastRemindedDate');
    const storedLastSeenGpId = localStorage.getItem('lastSeenGpId');
    const storedClosedSessionsStr = localStorage.getItem('closedSessions') || '[]';
    
    let closedSessions: string[] = [];
    try {
        closedSessions = JSON.parse(storedClosedSessionsStr);
    } catch(e) {}

    let justClosed = false;
    let updatedClosedSessions = [...closedSessions];

    // 1. Quando trocar de GP
    if (storedLastSeenGpId && Number(storedLastSeenGpId) !== activeGP.id) {
        toast.success(`O GP mudou para ${activeGP.name}! Faça seus palpites.`, { duration: 5000, icon: '🏁' });
        localStorage.setItem('lastSeenGpId', String(activeGP.id));
        
        // Reset closed sessions for the new GP
        updatedClosedSessions = [];
        justClosed = true;
    } else if (!storedLastSeenGpId) {
        localStorage.setItem('lastSeenGpId', String(activeGP.id));
    }

    // 2. Quando os palpites forem fechados
    const requiredSessions = activeGP.isSprint 
        ? ['Qualy Sprint', 'corrida Sprint', 'Qualy corrida', 'corrida principal'] 
        : ['Qualy corrida', 'corrida principal'];

    const sessionStatus = activeGP.sessionStatus || {};

    requiredSessions.forEach(session => {
        const sessionKey = `${activeGP.id}-${session}`;
        const isClosed = sessionStatus[session] === false;
        
        if (isClosed && !updatedClosedSessions.includes(sessionKey)) {
            toast(`Palpites para ${session} encerrados!`, { icon: '🔒', duration: 4000 });
            updatedClosedSessions.push(sessionKey);
            justClosed = true;
        }
    });

    if (justClosed) {
        localStorage.setItem('closedSessions', JSON.stringify(updatedClosedSessions));
    }

    // 3. Uma vez por dia para lembrar de palpitar (se não tiver feito todos)
    const myPredictions = activePredictions.filter(p => p.userId === liveUser.id && p.gpId === activeGP.id);
    const openSessions = requiredSessions.filter(s => sessionStatus[s] !== false);
    
    // Verifica se há alguma sessão aberta que o usuário ainda não palpitou
    const hasMissingPredictions = openSessions.some(s => !myPredictions.find(p => p.session === s));

    if (hasMissingPredictions && storedLastRemindedDate !== today) {
        setTimeout(() => {
            toast('Você tem palpites pendentes para este GP! Não esqueça de palpitar.', { icon: '⏰', duration: 6000 });
            
            // Disparar notificação do navegador se ativado
            if (liveUser.pushEnabled && 'Notification' in window && Notification.permission === 'granted') {
                new Notification(`Lembrete: GP de ${activeGP.name}`, {
                    body: 'Você ainda tem palpites pendentes para este GP. Não se esqueça de palpitar antes do fechamento das sessões!',
                    icon: '/vite.svg'
                });
            }
        }, 1500);
        localStorage.setItem('lastRemindedDate', today);
    }

  }, [liveUser?.id, activeGP?.id, activeGP?.sessionStatus, activePredictions.length, isCalendarLoaded]);

  if (isInitialLoading) return <LoadingScreen />;
  if (!liveUser) return <Login authError={loginError} onRetry={handleRetryProfileLoad} isAuthButNoDb={isAuthButNoDb} onLogout={handleLogout} />;

  const hasAnyAdmin = allUsers.some(u => u.isAdmin);
  
  if (!activeGP) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] text-white">
              <p>Calendário não carregado. Tente recarregar.</p>
          </div>
      );
  }

  return (
    <>
      <Toaster position="top-center" toastOptions={{
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '12px',
          fontWeight: 'bold',
        }
      }} />
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={canAccessAdmin} hasSelectedLeague={!!selectedLeagueId} onLogout={handleLogout}>
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
            totalUsers={leagueUsers.filter(u => !u.isGuest).length}
            currentRank={selectedLeagueId ? realTimeRank : undefined}
            rankLabel={selectedLeagueId ? 'Na Liga' : 'Global'}
          />
        )}
        {activeTab === 'palpites' && <Predictions gp={activeGP} onSave={handlePredict} savedPredictions={activePredictions.filter(p => p.gpId === activeGP?.id && p.userId === liveUser.id)} />}
        
        {activeTab === 'adversarios' && (
          <Adversarios 
            gp={activeGP}
            users={leagueUsers.filter(u => !u.isGuest)} 
            predictions={leaguePredictions}
            currentUser={liveUser}
          />
        )}

        {activeTab === 'palpitometro' && (
          <Palpitometro 
            gp={activeGP} 
            stats={leaguePredictions.filter(p => p.gpId === activeGP?.id).reduce((acc, p) => {
              if (!acc[p.session]) acc[p.session] = {};
              (p.top5 || []).forEach(dId => acc[p.session][dId] = (acc[p.session][dId] || 0) + 1);
              return acc;
            }, {} as any)} 
            totalUsers={new Set(leaguePredictions.filter(p => p.gpId === activeGP?.id).map(p => p.userId)).size} 
          />
        )}
        
        {activeTab === 'ranking' && <Ranking currentUser={liveUser} users={leagueUsers.filter(u => !u.isGuest)} calendar={currentCalendar} constructorsList={constructorsOrder} predictions={leaguePredictions} />}
        
        {activeTab === 'ligas' && <Leagues currentUser={liveUser} allUsers={allUsers.filter(u => !u.isGuest)} allLeagues={leagues} onUpdateUser={handleUpdateUser} selectedLeagueId={selectedLeagueId} onSelectLeague={(id) => {
          setSelectedLeagueId(id);
          if (id) {
            localStorage.setItem('selectedLeagueId', id);
            setActiveTab('home');
          } else {
            localStorage.removeItem('selectedLeagueId');
          }
        }} />}
        
        {activeTab === 'desempenho' && <Performance currentUser={liveUser} calendar={currentCalendar} predictions={leaguePredictions} />}
        
        {activeTab === 'settings' && (
          <Settings 
            currentUser={liveUser} 
            onUpdateUser={handleUpdateUser} 
            onNavigateToLeagues={() => setActiveTab('ligas')}
            hasSelectedLeague={!!selectedLeagueId}
            deferredPrompt={deferredPrompt}
            isInstalled={isInstalled}
          />
        )}

        {activeTab === 'admin' && canAccessAdmin && (
          <Admin 
            gp={adminGP} 
            calendar={currentCalendar} 
            users={leagueUsers}
            currentUser={liveUser}
            onUpdateCalendar={(cal) => {
              if (selectedLeagueId && (isLeagueOwner || liveUser?.isAdmin)) {
                set(ref(db, `leagues/${selectedLeagueId}/calendar`), cal);
              } else if (liveUser?.isAdmin) {
                set(ref(db, 'calendar'), cal);
              }
            }} 
            onSelectGp={(id) => setAdminEditingGpId(id)} 
            onCalculatePoints={handleCalculatePoints} 
            onDeleteUser={handleDeleteUser}
            onClearAllPredictions={handleClearAllPredictions}
            onToggleInvalidateUserGp={handleToggleInvalidateUserGp}
            onToggleAdmin={handleToggleAdmin}
            constructorsOrder={constructorsOrder}
          />
        )}
      </Layout>
    </>
  );
};

export default App;
