
export type Team = 
  | 'McLaren' | 'Mercedes' | 'Red Bull' | 'Ferrari' | 'Racing Bulls' 
  | 'Aston Martin' | 'Haas' | 'Audi' | 'Alpine' | 'Cadillac' | 'Williams';

export interface Driver {
  id: string;
  name: string;
  number: number;
  team: Team;
  color: string;
  country: string;
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
  level: 'Ouro' | 'Prata' | 'Bronze';
  isAdmin: boolean;
}
