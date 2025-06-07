import { prisma } from "../prisma";
import type { TriangularResult, TriangularHistory } from "@/types";
import type { PrismaTriangularWithRelations } from "@/types/prisma";
import { mapTriangularToHistory } from "@/types/prisma";
/* import type { PrismaClient } from "@prisma/client"; */

export const triangularService = {
  async saveTriangular(result: TriangularResult) {
    return prisma.$transaction(
      async (tx) => {
        try {
          // 1. Crear el triangular y sus resultados de equipo en una sola operación
          const triangular = await tx.triangular.create({
            data: {
              champion: result.teams.first.name,
              teams: {
                create: [
                  {
                    teamName: result.teams.first.name,
                    points: result.teams.first.points,
                    wins: result.teams.first.wins,
                    normalWins: result.teams.first.normalWins,
                    draws: result.teams.first.draws,
                    position: 1,
                  },
                  {
                    teamName: result.teams.second.name,
                    points: result.teams.second.points,
                    wins: result.teams.second.wins,
                    normalWins: result.teams.second.normalWins,
                    draws: result.teams.second.draws,
                    position: 2,
                  },
                  {
                    teamName: result.teams.third.name,
                    points: result.teams.third.points,
                    wins: result.teams.third.wins,
                    normalWins: result.teams.third.normalWins,
                    draws: result.teams.third.draws,
                    position: 3,
                  },
                ],
              },
            },
          });

          // 2. Crear todos los registros de jugadores en una sola operación
          const playerTriangularData = [
            ...result.teams.first.players.map((id) => ({
              playerId: id,
              triangularId: triangular.id,
              team: result.teams.first.name,
              goals: result.scorers[id] || 0,
              wins: result.teams.first.wins,
              normalWins: result.teams.first.normalWins,
              draws: result.teams.first.draws,
              points: result.teams.first.points,
            })),
            ...result.teams.second.players.map((id) => ({
              playerId: id,
              triangularId: triangular.id,
              team: result.teams.second.name,
              goals: result.scorers[id] || 0,
              wins: result.teams.second.wins,
              normalWins: result.teams.second.normalWins,
              draws: result.teams.second.draws,
              points: result.teams.second.points,
            })),
            ...result.teams.third.players.map((id) => ({
              playerId: id,
              triangularId: triangular.id,
              team: result.teams.third.name,
              goals: result.scorers[id] || 0,
              wins: result.teams.third.wins,
              normalWins: result.teams.third.normalWins,
              draws: result.teams.third.draws,
              points: result.teams.third.points,
            })),
          ];

          await tx.playerTriangular.createMany({
            data: playerTriangularData,
          });

          // 3. Obtener todos los jugadores que participaron en el triangular
          const allPlayerIds = [
            ...result.teams.first.players,
            ...result.teams.second.players,
            ...result.teams.third.players,
          ];

          // 4. Calcular partidos jugados por cada jugador
          // En un triangular, cada equipo juega 2 partidos (contra los otros 2 equipos)
          const matchesPerPlayer = 2;

          // 5. Actualizar las estadísticas de todos los jugadores que participaron
          for (const playerId of allPlayerIds) {
            // Determinar en qué equipo jugó el jugador y sus estadísticas
            let playerTeamStats;
            if (result.teams.first.players.includes(playerId)) {
              playerTeamStats = result.teams.first;
            } else if (result.teams.second.players.includes(playerId)) {
              playerTeamStats = result.teams.second;
            } else {
              playerTeamStats = result.teams.third;
            }

            await tx.player.update({
              where: { id: playerId },
              data: {
                goals: { increment: result.scorers[playerId] || 0 },
                matches: { increment: matchesPerPlayer },
                wins: { increment: playerTeamStats.wins },
                draws: { increment: playerTeamStats.draws },
                // Las derrotas se calculan como: partidos jugados - victorias - empates
                losses: { increment: matchesPerPlayer - playerTeamStats.wins - playerTeamStats.draws },
              },
            });
          }

          return triangular;
        } catch (error) {
          console.error("Error en la transacción:", error);
          throw error;
        }
      },
      {
        timeout: 20000,
      }
    );
  },

  async getTriangularHistory(): Promise<TriangularHistory[]> {
    const triangulars = (await prisma.triangular.findMany({
      include: {
        teams: {
          orderBy: {
            position: "asc",
          },
        },
        players: {
          include: {
            player: {
              select: {
                name: true,
              },
            },
          },
          where: {
            goals: {
              gt: 0,
            },
          },
          orderBy: {
            goals: "desc",
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    })) as PrismaTriangularWithRelations[];

    return triangulars.map(mapTriangularToHistory);
  },
};
