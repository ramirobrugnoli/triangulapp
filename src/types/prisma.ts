// types/prisma.ts
import type { Triangular, TeamResult, PlayerTriangular } from "@prisma/client";
import type { Team } from "./index";

export interface PrismaTriangularWithRelations extends Triangular {
  id: string;
  date: Date;
  teams: TeamResult[];
  champion: string;
  players: (PlayerTriangular & {
    player: {
      name: string;
    };
  })[];
}

// Types auxiliares para mejor legibilidad
export interface PrismaTeamResult extends TeamResult {
  teamName: Team;
}

export interface PrismaPlayerWithTriangular extends PlayerTriangular {
  player: {
    name: string;
  };
}

// Función helper para mapear la respuesta
import type { TriangularHistory } from "./index";

export function mapTriangularToHistory(
  triangular: PrismaTriangularWithRelations
): TriangularHistory {
  return {
    id: triangular.id,
    date: triangular.date.toISOString(),
    champion: triangular.champion as Team,
    teams: triangular.teams.map((team) => ({
      name: team.teamName as Team,
      points: team.points,
      position: team.position,
      wins: team.wins,
      normalWins: team.normalWins,
      draws: team.draws,
    })),
    scorers: triangular.players.map((p) => ({
      name: p.player.name,
      goals: p.goals,
      team: p.team as Team,
    })),
  };
}
