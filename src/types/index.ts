export type Team = "Equipo 1" | "Equipo 2" | "Equipo 3";

// Interfaces para Stats y Players
export interface PlayerStats {
  matches: number;
  goals: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
}

export interface Player {
  id: string;
  name: string;
  stats: PlayerStats;
}

export interface TeamMember {
  id: string;
  name: string;
}

// Interfaces para el Game State
export interface TeamScore {
  name: Team;
  points: number;
  wins: number;
  normalWins: number;
  draws: number;
}

export interface TimerState {
  endTime: number | null;
  MATCH_DURATION: number;
}

export interface GameTeam {
  name: Team;
  members: TeamMember[];
}

export interface TeamBuilderState {
  available: Player[];
  team1: Player[];
  team2: Player[];
  team3: Player[];
  [key: string]: Player[];
}

export interface GameState {
  scores: {
    teamA: number;
    teamB: number;
  };
  timer: TimerState;
  dailyScores: TeamScore[];
  isActive: boolean;
  teamBuilder: TeamBuilderState;
  activeTeams: {
    teamA: GameTeam;
    teamB: GameTeam;
    waiting: GameTeam;
  };
  currentGoals: GoalsTracking;
  lastWinner: string;
  selectedPlayers: Player[];
}

// Interfaces para la API y Backend
export interface TriangularResult {
  id?: string;
  date: string;
  teams: {
    first: TeamResult;
    second: TeamResult;
    third: TeamResult;
  };
  scorers: {
    [playerId: string]: number; // Cambiado de number a string para aceptar UUIDs/CUIDs
  };
}

export interface TeamResult {
  name: Team;
  players: string[];
  points: number;
  wins: number;
  normalWins: number;
  draws: number;
}

export interface TriangularHistory {
  id: string;
  date: string;
  champion: Team;
  teams: {
    name: Team;
    points: number;
    position: number;
    wins: number;
    normalWins: number;
    draws: number;
  }[];
  scorers: {
    name: string;
    goals: number;
    team: Team;
  }[];
}

// Interfaces para UI Components
export interface GoalScorerModalProps {
  isOpen: boolean;
  team: "A" | "B";
  players: TeamMember[];
  onClose: () => void;
  onSelect: (playerId: string) => void;
}

export interface DragOverEvent {
  active: {
    id: string;
    data: { current: { sortable: { containerId: string } } };
  };
  over: {
    id: string;
    data?: { current?: { sortable?: { containerId: string } } };
  } | null;
}

export interface DragEndEvent {
  active: {
    id: string;
    data: { current: { sortable: { containerId: string } } };
  };
  over: {
    id: string;
    data?: { current?: { sortable?: { containerId: string } } };
  } | null;
}

export interface GoalsTracking {
  [playerId: string]: number;
}

// Nueva interfaz para Player Triangular
export interface PlayerTriangularStats {
  goals: number;
  wins: number;
  normalWins: number;
  draws: number;
  points: number;
  team: Team;
}

// Nueva interfaz para respuesta de Players API
export interface PlayerResponse {
  id: string;
  name: string;
  stats: PlayerStats;
  triangulars?: {
    triangularId: string;
    stats: PlayerTriangularStats;
  }[];
}
