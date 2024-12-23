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