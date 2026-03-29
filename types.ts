
export type Team = 
  | 'Alpine' 
  | 'Aston Martin' 
  | 'Audi' 
  | 'Cadillac' 
  | 'Ferrari' 
  | 'Haas' 
  | 'McLaren' 
  | 'Mercedes' 
  | 'Racing Bulls' 
  | 'Red Bull' 
  | 'Williams'
  | 'Safety Car';

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
  manualOverride?: Record<string, boolean>; // override manual do admin
  results?: Partial<Record<SessionType, string[]>>; // Top 5 oficial
  // Mapeamento de nome da sessão (ex: "TL1") para data ISO string
  sessions?: Record<string, string>; 
  isWet?: boolean;
}

export interface Prediction {
  userId: string;
  gpId: number;
  session: SessionType;
  top5: string[]; 
  timestamp?: string; // Horário em que o palpite foi feito
}

export interface League {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  members: string[];
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  rank: number;
  previousRank?: number; // Rank na rodada anterior
  positionHistory?: number[]; // Histórico de posições nas últimas corridas
  pointsHistory?: { gpId: number; points: number }[]; // Histórico de pontos por corrida
  level: 'Ouro' | 'Prata' | 'Bronze';
  isAdmin: boolean;
  isGuest?: boolean; // Flag para usuários visitantes
  // Novos campos de configuração
  avatarUrl?: string;
  theme?: 'light' | 'dark';
  language?: string;
  invalidatedGPs?: number[]; // IDs dos GPs onde o palpite deste usuário foi invalidado
  leagues?: string[]; // IDs das ligas que o usuário participa
  pushEnabled?: boolean; // Se as notificações estão ativadas
}
