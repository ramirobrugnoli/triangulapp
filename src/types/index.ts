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

export type Team = 'Equipo 1' | 'Equipo 2' | 'Equipo 3';

export interface TeamScore {
  name: Team;
  points: number;
  wins: number;
  normalWins: number;
  draws: number;
}

export interface GameState {
  activeTeams: {
    teamA: Team;
    teamB: Team;
    waiting: Team;
  };
  scores: {
    teamA: number;
    teamB: number;
  };
  timer: TimerState;
  dailyScores: TeamScore[];
  isActive: boolean;
}

export interface TimerState {
  endTime: number | null;
  MATCH_DURATION: number;
}