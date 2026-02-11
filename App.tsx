
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, RaceGP, SessionType, Prediction, Team } from './types';
import { INITIAL_CALENDAR, FALLBACK_CONSTRUCTORS } from './constants';
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

    // O GP termina às 23:59:59 do último dia
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
  const [constructorsOrder, setConstructorsOrder] = useState<Team[]>(FALLBACK_CONSTRUCTORS); // Estado para lista de construtores
  const [adminEditingGpId, setAdminEditingGpId] = useState<number | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loginError, setLoginError] = useState<string>('');
  const [isAuthButNoDb, setIsAuthButNoDb] = useState(false);
  const [timeTick, setTimeTick] = useState(0); // Estado auxiliar para forçar atualização do GP ativo

  // Deriva o usuário "vivo" (combinando Auth + Dados do DB em tempo real)
  const liveUser = useMemo(() => {
    if (!user) return null;
    const dbUser = allUsers.find(u => u.id === user.id);
    // Prioriza dados do DB (que tem pontos atualizados), mas mantém isAdmin/email do auth inicial se necessário
    return dbUser ? { ...user, ...dbUser } : user;
  }, [user, allUsers]);

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
        // Tenta buscar de 2026. Se não existir, vai cair no catch.
        // Se quisermos dados reais HOJE (antes de 2026), podemos mudar para 'current'
        const res = await fetch('https://ergast.com/api/f1/2026/constructorStandings.json');
        if (!res.ok) throw new Error('API not available');
        const data = await res.json();
        const standings = data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings;
        
        if (standings && standings.length > 0) {
            // Mapeia a resposta da API para o nosso tipo Team
            // Precisamos garantir que os nomes batam com nosso tipo Team
            const apiTeams = standings.map((s: any) => {
                const name = s.Constructor.name;
                // Normalização básica de nomes (API -> App com nomes simplificados)
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

            // Se conseguirmos mapear pelo menos alguns, usamos a API. 
            // Completamos com o fallback se faltar times.
            if (apiTeams.length > 0) {
                 const combined = Array.from(new Set([...apiTeams, ...FALLBACK_CONSTRUCTORS]));
                 setConstructorsOrder(combined);
                 return;
            }
        }
        // Se dados vazios ou inválidos, mantém fallback
        setConstructorsOrder(FALLBACK_CONSTRUCTORS);
      } catch (e) {
        console.log("Usando ordem de construtores padrão (API indisponível ou pré-temporada).");
        setConstructorsOrder(FALLBACK_CONSTRUCTORS);
      }
    };
    fetchConstructors();
  }, []);

  // Processamento de dados de usuários extraído para reutilização
  const processUsersData = useCallback((data: any) => {
      if (data) {
        // Mapeia Object.entries para garantir que temos o ID
        let rawList = Object.entries(data).map(([key, value]: [string, any]) => ({
            ...value,
            id: value.id || key 
        })).filter(u => u && u.name); // Filtra usuários válidos (visitante pode não ter e-mail)
        
        // --- DEDUPLICAÇÃO VISUAL (Para usuários com email) ---
        const uniqueUsersMap = new Map<string, User>();
        rawList.forEach(u => {
            if (u.email && !u.isGuest) {
                if (!uniqueUsersMap.has(u.email)) {
                    uniqueUsersMap.set(u.email, u);
                } else {
                    const existing = uniqueUsersMap.get(u.email)!;
                    if ((u.points || 0) > (existing.points || 0)) {
                        uniqueUsersMap.set(u.email, u);
                    }
                }
            } else {
                // Visitantes (sem email) ou marcados como guest são adicionados diretamente com ID
                uniqueUsersMap.set(u.id, u);
            }
        });
        
        const deduplicatedList = Array.from(uniqueUsersMap.values());
        const sortedList = deduplicatedList.sort((a, b) => (b.points || 0) - (a.points || 0));
        
        const processedList = sortedList.map((u, index) => {
            const currentRank = index + 1;
            return {
                ...u,
                rank: currentRank,
                positionHistory: u.positionHistory ? Object.values(u.positionHistory) : [], // Garante array mesmo se vier como objeto do Firebase
                previousRank: u.previousRank || currentRank
            };
        });

        setAllUsers(processedList);
      } else {
        setAllUsers([]);
      }
  }, []);

  // Listeners de Dados - HÍBRIDO (GET inicial + Listener)
  useEffect(() => {
    if (!user) {
        setAllUsers([]);
        setPredictions([]);
        return;
    }

    console.log("Iniciando sincronização de dados...");

    const calendarRef = ref(db, 'calendar');
    const usersRef = ref(db, 'users');
    const predictionsRef = ref(db, 'predictions');

    // 1. Fetch Inicial Rápido (garante dados sem esperar o handshake do socket)
    get(calendarRef).then(snap => {
        if (snap.exists()) {
             const data = snap.val();
             // Segurança: Garante que é array
             const calArray = Array.isArray(data) ? data : Object.values(data);
             setCalendar(calArray);
        } else {
             setCalendar(INITIAL_CALENDAR);
        }
    }).catch(e => console.log("Calendar read skipped", e));

    get(usersRef).then(snap => snap.exists() && processUsersData(snap.val())).catch(e => console.log("Users read skipped", e));
    
    get(predictionsRef).then(snap => {
        if (snap.exists()) {
             const predList: Prediction[] = [];
             Object.values(snap.val()).forEach((userPreds: any) => {
                Object.values(userPreds).forEach((p: any) => predList.push(p));
             });
             setPredictions(predList);
        }
    }).catch(e => console.log("Predictions read skipped", e));

    // 2. Listeners para Real-time Updates
    const unsubCalendar = onValue(calendarRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Segurança: Garante que é array (Firebase pode retornar objeto se array for esparso)
        const calArray = Array.isArray(data) ? data : Object.values(data);
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
      if (data) {
        Object.values(data).forEach((userPreds: any) => {
          Object.values(userPreds).forEach((p: any) => predList.push(p));
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

  // Função isolada para carregar perfil com MIGRAÇÃO DE DADOS e SUPORTE A VISITANTE
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
            // Se for login anônimo legado, cria perfil específico (código mantido para compatibilidade, mas sem entrada na UI)
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

          // --- LÓGICA DE MIGRAÇÃO (apenas para usuários reais) ---
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
             console.log("Migrando usuário antigo:", oldUserKey, "para UID:", userKey);
             
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
             alert("Conta recuperada com sucesso!");

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
         console.error("Error fetching user data from DB:", dbError);
         let errorMsg = `Erro no Banco (${dbError.code || 'Desconhecido'}): ${dbError.message}`;
         if (dbError?.code === 'PERMISSION_DENIED') {
             errorMsg = "Permissão negada. Verifique as Regras no Firebase Console.";
         } else if (dbError?.code === 'NETWORK_ERROR') {
             errorMsg = "Sem conexão. Verifique sua internet.";
         }
         setLoginError(errorMsg);
         setIsAuthButNoDb(true);
         setUser(null);
      }
  }, []);

  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
        setIsInitialLoading((prev) => {
            if (prev) return false;
            return prev;
        });
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
    if (!liveUser) return;
    try {
        const userRef = ref(db, `users/${liveUser.id}`);
        await update(userRef, { isAdmin: true });
    } catch(e) {
        alert("Erro ao promover: Verifique conexao ou permissoes.");
    }
  };

  // Lógica de Cálculo de Pontos REESCRITA (Recalcula TOTALMENTE do zero)
  // Agora calcula também o NÍVEL do usuário
  const handleCalculatePoints = async (currentGp: RaceGP) => {
    // Usa a versão mais recente do GP atual (caso tenha sido editado na UI antes do save no DB)
    const updatedCalendar = calendar.map(c => c.id === currentGp.id ? currentGp : c);
    
    const userPointsMap: Record<string, number> = {};

    // 1. Recalcula pontos de TODOS os usuários baseado em TODO o calendário
    allUsers.forEach(u => {
      let userTotalPoints = 0;

      updatedCalendar.forEach(calGp => {
          // Só calcula se tiver resultados oficiais
          if (!calGp.results) return;

          const sessions: SessionType[] = calGp.isSprint 
            ? ['Qualy Sprint', 'corrida Sprint', 'Qualy corrida', 'corrida principal'] 
            : ['Qualy corrida', 'corrida principal'];
          
          sessions.forEach(session => {
             const officialResult = calGp.results?.[session];
             if (!officialResult) return;

             // Busca palpite do usuário para essa sessão específica
             const pred = predictions.find(p => p.gpId === calGp.id && p.userId === u.id && p.session === session);
             
             if (pred) {
                // FIX: Garante que top5 exista
                (pred.top5 || []).forEach((driverId, idx) => {
                   if (driverId === officialResult[idx]) userTotalPoints += 5; // Posição Exata
                   else if (officialResult.includes(driverId)) userTotalPoints += 1; // Está no Top 5
                });
             }
          });
      });

      userPointsMap[u.id] = userTotalPoints;
    });

    // 2. Ordena para definir novo Ranking (Ignora Visitantes no ranking real, mas calcula pontos)
    // Filtramos apenas usuários NÃO convidados para a ordenação oficial
    const realUsers = allUsers.filter(u => !u.isGuest);
    const guestUsers = allUsers.filter(u => u.isGuest);

    const rankedUsers = realUsers.map(u => ({
        ...u,
        newPoints: userPointsMap[u.id] || 0
    })).sort((a, b) => b.newPoints - a.newPoints);

    // 3. Prepara o Update em Batch
    const updates: Record<string, any> = {};

    // Atualiza usuários reais
    rankedUsers.forEach((u, index) => {
        const newRank = index + 1;
        
        let newLevel = 'Bronze';
        if (u.newPoints >= 150) newLevel = 'Ouro';
        else if (u.newPoints >= 50) newLevel = 'Prata';
        
        // --- ATUALIZAÇÃO DO HISTÓRICO DE POSIÇÕES ---
        // Pega o histórico atual ou array vazio
        const currentHistory = u.positionHistory || [];
        // Adiciona a nova posição ao final do array
        const newHistory = [...currentHistory, newRank];

        updates[`users/${u.id}/points`] = u.newPoints;
        updates[`users/${u.id}/rank`] = newRank;
        updates[`users/${u.id}/level`] = newLevel; 
        updates[`users/${u.id}/previousRank`] = u.rank;
        updates[`users/${u.id}/positionHistory`] = newHistory; // Salva o novo histórico
    });

    // Atualiza Visitantes (sem ranking)
    guestUsers.forEach(u => {
        updates[`users/${u.id}/points`] = userPointsMap[u.id] || 0;
        // Não atualiza rank nem level de visitante para não interferir
    });

    try {
        // Se o GP estava ABERTO, marca como FINALIZADO no calendário
        if (currentGp.status === 'OPEN') {
            const newCalendar = updatedCalendar.map(c => c.id === currentGp.id ? { ...c, status: 'FINISHED' as const } : c);
            await set(ref(db, 'calendar'), newCalendar);
        } else {
            // Se só estamos recalculando (já estava finished), atualizamos o calendário com possíveis correções de resultados
            await set(ref(db, 'calendar'), updatedCalendar);
        }
        
        // Executa updates dos usuários
        if (Object.keys(updates).length > 0) {
            await update(ref(db), updates);
        }
        alert("Pontos, Níveis e Histórico recalculados com sucesso!");
    } catch (e) {
        console.error(e);
        alert("Erro ao salvar no banco.");
    }
  };

  const handleClearAllPredictions = async () => {
    if (!window.confirm("ATENÇÃO: Isso apagará TODOS os palpites e ZERARÁ os pontos. Confirmar?")) return;
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

  const handleLogout = () => { 
      signOut(auth); 
      setUser(null); 
      setActiveTab('home'); 
  };

  const handlePredict = (gpId: number, session: SessionType, top5: string[]) => {
    if (!liveUser) return;
    const sessionKey = session.replace(/\s/g, '_');
    // Salva localmente nas predictions para refletir na UI instantaneamente
    const newPrediction = { userId: liveUser.id, gpId, session, top5 };
    setPredictions(prev => [...prev.filter(p => !(p.userId === liveUser.id && p.gpId === gpId && p.session === session)), newPrediction]);
    
    // Tenta salvar no Firebase
    set(ref(db, `predictions/${liveUser.id}/${gpId}_${sessionKey}`), newPrediction)
      .catch(e => console.warn("Erro ao salvar palpite:", e));
  };
  
  // Callback chamado pelo Home.tsx quando o tempo do GP acaba
  const handleGpTimerFinished = useCallback(() => {
    console.log("Tempo do GP esgotou! Atualizando para o próximo...");
    setTimeTick(prev => prev + 1); // Força re-render para recalcular activeGP
  }, []);

  if (isInitialLoading) return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center"><div className="w-16 h-16 border-4 border-[#e10600]/20 border-t-[#e10600] rounded-full animate-spin"></div></div>;
  
  // Login usa props de estado para feedback
  if (!liveUser) return <Login authError={loginError} onRetry={handleRetryProfileLoad} isAuthButNoDb={isAuthButNoDb} onLogout={handleLogout} />;

  const hasAnyAdmin = allUsers.some(u => u.isAdmin);
  // Usa liveUser.rank se disponível, senão fallback para índice
  const realTimeRank = liveUser.rank || (allUsers.findIndex(u => u.id === liveUser.id) + 1) || 1;
  
  // FILTRA NULOS NO CALENDÁRIO e GARANTE que é ARRAY
  const safeCalendar = Array.isArray(calendar) ? calendar.filter(c => c !== null) : [];
  const currentCalendar = safeCalendar.length > 0 ? safeCalendar : INITIAL_CALENDAR;
  
  const now = new Date();
  
  // Lógica de Seleção do GP Ativo (Baseada em Data e Status)
  let activeGP = currentCalendar.find(gp => gp.status === 'OPEN');
  
  if (!activeGP) {
      activeGP = currentCalendar.find(gp => {
          const { endDate } = getGpDates(gp.date);
          return now <= endDate;
      });
  }
  
  if (!activeGP) activeGP = currentCalendar[currentCalendar.length - 1] || currentCalendar[0];
                   
  const adminGP = (calendar && Array.isArray(calendar) ? calendar : currentCalendar).find(c => c && c.id === adminEditingGpId) || activeGP;
  
  // Filtra previsões apenas de usuários válidos na lista (evita dados órfãos)
  const activePredictions = predictions.filter(p => allUsers.some(u => u.id === p.userId));

  // --- LOGICA DE NOTIFICAÇÕES DO SISTEMA (1 dia antes / Início de Sessão) ---
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!activeGP || !activeGP.sessions) return;

    // Tenta pedir permissão na montagem (alguns browsers bloqueiam sem interação, mas vale tentar)
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    const checkTime = () => {
        if ('Notification' in window && Notification.permission === 'granted') {
            const nowTime = new Date().getTime();

            // 1. Verifica falta de 1 dia para o início do evento (primeira sessão)
            const sessionEntries = Object.entries(activeGP!.sessions!).sort((a,b) => new Date(a[1] as string).getTime() - new Date(b[1] as string).getTime());
            if (sessionEntries.length > 0) {
                const firstSessionTime = new Date(sessionEntries[0][1] as string).getTime();
                const diff = firstSessionTime - nowTime;
                const oneDay = 24 * 60 * 60 * 1000;

                // Se faltar entre 24h e 23h50m (janela de 10 min para disparar)
                if (diff <= oneDay && diff > (oneDay - 600000)) {
                    const key = `notif_${activeGP!.id}_24h`;
                    if (!localStorage.getItem(key)) {
                        new Notification(`F1 ${activeGP!.name}`, { 
                            body: `Falta 1 dia para começar! Prepare seus palpites.`,
                            icon: '/icon.svg'
                        });
                        localStorage.setItem(key, 'true');
                    }
                }
            }

            // 2. Verifica início de sessões (que fecha palpites)
            Object.entries(activeGP!.sessions!).forEach(([name, isoDate]) => {
                const time = new Date(isoDate as string).getTime();
                // Se começou nos últimos 5 minutos
                if (nowTime >= time && (nowTime - time) < 300000) {
                    const key = `notif_${activeGP!.id}_${name}_start`;
                    if (!localStorage.getItem(key)) {
                        const isPredictionSession = name.toLowerCase().includes('qualy') || name.toLowerCase().includes('corrida') || name.toLowerCase().includes('sprint');
                        const body = isPredictionSession
                            ? `${name} começou! Palpites fechados.`
                            : `${name} começou agora!`;

                        new Notification(`🔴 ${activeGP!.name}`, { body, icon: '/icon.svg' });
                        localStorage.setItem(key, 'true');
                    }
                }
            });
        }
    };

    const timer = setInterval(checkTime, 60000); // Checa a cada minuto
    checkTime(); // Checa na montagem também

    return () => clearInterval(timer);
  }, [activeGP]);

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={liveUser.isAdmin}>
      {activeTab === 'home' && (
        <Home 
          user={{...liveUser, rank: realTimeRank}} 
          nextGP={activeGP} 
          // FIX: Contagem segura de previsões
          predictionsCount={new Set(activePredictions.filter(p => p.gpId === activeGP!.id && p.userId === liveUser.id && (p.top5?.length || 0) > 0).map(p => p.session)).size} 
          onNavigateToPredict={() => setActiveTab('palpites')} 
          onLogout={handleLogout} 
          hasNoAdmin={!hasAnyAdmin}
          onClaimAdmin={handlePromoteSelfToAdmin}
          onTimerFinished={handleGpTimerFinished}
          constructorsList={constructorsOrder}
        />
      )}
      {activeTab === 'palpites' && <Predictions gp={activeGP} onSave={handlePredict} savedPredictions={activePredictions.filter(p => p.gpId === activeGP!.id && p.userId === liveUser.id)} />}
      
      {activeTab === 'adversarios' && (
        <Adversarios 
          gp={activeGP}
          users={allUsers.filter(u => !u.isGuest)} // Filtra visitantes da lista de adversários
          predictions={activePredictions}
          currentUser={liveUser}
        />
      )}

      {activeTab === 'palpitometro' && (
        <Palpitometro 
          gp={activeGP} 
          stats={activePredictions.filter(p => p.gpId === activeGP!.id).reduce((acc, p) => {
            if (!acc[p.session]) acc[p.session] = {};
            // FIX: Ensure top5 exists before forEach
            (p.top5 || []).forEach(dId => acc[p.session][dId] = (acc[p.session][dId] || 0) + 1);
            return acc;
          }, {} as any)} 
          totalUsers={new Set(activePredictions.filter(p => p.gpId === activeGP!.id).map(p => p.userId)).size} 
        />
      )}
      {activeTab === 'ranking' && <Ranking currentUser={liveUser} users={allUsers.filter(u => !u.isGuest)} calendar={currentCalendar} constructorsList={constructorsOrder} />}
      {activeTab === 'stats' && <Stats currentUser={liveUser} users={allUsers.filter(u => !u.isGuest)} />}
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
          // NEW PROP
          constructorsOrder={constructorsOrder}
        />
      )}
    </Layout>
  );
};

export default App;
