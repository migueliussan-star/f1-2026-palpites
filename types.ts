
export type Team = 
  | 'Alpine-Mercedes' 
  | 'Aston Martin Aramco-Honda' 
  | 'Audi' 
  | 'Cadillac-Ferrari' 
  | 'Ferrari' 
  | 'Haas-Ferrari' 
  | 'McLaren-Mercedes' 
  | 'Mercedes' 
  | 'Racing Bulls-Red Bull Ford' 
  | 'Red Bull Racing-Red Bull Ford' 
  | 'Williams-Mercedes';

export interface Driver {
  id: string;
  name: string;
  number: number;
  team: Team;
  color: string;
  country: string;
  image: string;
}

export interface Constructor {
  id: string;
  name: Team;
  position: number;
}

// Nomes exatos conforme pedido
export type SessionType = 'Qualy Sprint' | 'corrida Sprint' | 'Qualy corrida' | 'corrida principal';

export interface RaceGP {
  id: number;
  name: string;
  location: string;
  date: string;
  isSprint: boolean;
  status: 'UPCOMING' | 'OPEN' | 'CLOSED' | 'FINISHED';
  sessionStatus: Record<string, boolean>; // true = aberto
  results?: Partial<Record<SessionType, string[]>>; // Top 5 oficial
  // Mapeamento de nome da sessão (ex: "TL1") para data ISO string
  sessions?: Record<string, string>; 
}

export interface Prediction {
  userId: string;
  gpId: number;
  session: SessionType;
  top5: string[]; 
}

export interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  rank: number;
  previousRank?: number; // Rank na rodada anterior
  positionHistory?: number[]; // Histórico de posições nas últimas corridas
  level: 'Ouro' | 'Prata' | 'Bronze';
  isAdmin: boolean;
  isGuest?: boolean; // Flag para usuários visitantes
}
