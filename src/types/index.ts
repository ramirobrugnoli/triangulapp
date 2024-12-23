import {
  DragEndEvent,
  DragOverEvent as DndDragOverEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";

export interface TeamBuilderState {
  available: Player[];
  team1: Player[];
  team2: Player[];
  team3: Player[];
  [key: string]: Player[];
}
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

export type Team = "Equipo 1" | "Equipo 2" | "Equipo 3";

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
  teamBuilder: TeamBuilderState;
}

export interface TimerState {
  endTime: number | null;
  MATCH_DURATION: number;
}

export interface TeamPlayer {
  id: string;
  name: Team;
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
