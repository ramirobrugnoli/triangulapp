import { prisma } from "../prisma";
import type { TriangularResult, TriangularHistory, Team } from "@/types";
import type { PrismaTriangularWithRelations } from "@/types/prisma";
import { mapTriangularToHistory } from "@/types/prisma";
/* import type { PrismaClient } from "@prisma/client"; */

export const triangularService = {
  async recalculateAllPlayerStats() {
    return prisma.$transaction(
      async (tx) => {
        try {
          // 1. Obtener todos los triangulares con sus participaciones de jugadores
          const triangulars = await tx.triangular.findMany({
            include: {
              players: {
                include: {
                  player: true,
                },
              },
            },
          });

          // 2. Reiniciar estadísticas de todos los jugadores
          await tx.player.updateMany({
            data: {
              matches: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goals: 0,
            },
          });

          // 3. Agrupar participaciones por jugador
          const playerStats: Record<string, {
            matches: number;
            wins: number;
            draws: number;
            losses: number;
            goals: number;
          }> = {};

          for (const triangular of triangulars) {
            for (const participation of triangular.players) {
              const playerId = participation.playerId;
              
              if (!playerStats[playerId]) {
                playerStats[playerId] = {
                  matches: 0,
                  wins: 0,
                  draws: 0,
                  losses: 0,
                  goals: 0,
                };
              }

              // En cada triangular, cada jugador juega 2 partidos
              playerStats[playerId].matches += 2;
              playerStats[playerId].wins += participation.wins;
              playerStats[playerId].draws += participation.draws;
              playerStats[playerId].losses += (2 - participation.wins - participation.draws);
              playerStats[playerId].goals += participation.goals;
            }
          }

          // 4. Actualizar estadísticas de cada jugador
          for (const [playerId, stats] of Object.entries(playerStats)) {
            await tx.player.update({
              where: { id: playerId },
              data: {
                matches: stats.matches,
                wins: stats.wins,
                draws: stats.draws,
                losses: stats.losses,
                goals: stats.goals,
              },
            });
          }

          return {
            triangularsProcessed: triangulars.length,
            playersUpdated: Object.keys(playerStats).length,
          };
        } catch (error) {
          console.error("Error recalculando estadísticas:", error);
          throw error;
        }
      },
      {
        timeout: 30000,
      }
    );
  },

  async saveTriangular(result: TriangularResult) {
    return prisma.$transaction(
      async (tx) => {
        try {
          // 1. Get the active season (the season without finishSeasonDate)
          const activeSeason = await tx.season.findFirst({
            where: {
              finishSeasonDate: null
            },
            select: {
              id: true
            }
          });

          if (!activeSeason) {
            throw new Error("No active season found. Please create a season first.");
          }

          // 2. Crear el triangular y sus resultados de equipo en una sola operación
          const triangular = await tx.triangular.create({
            data: {
              champion: result.teams.find(t => t.position === 1)?.name ?? result.teams[0].name,
              date: result.date ? new Date(result.date) : new Date(),
              seasonId: activeSeason.id,
              teams: {
                create: result.teams.map(team => ({
                  teamName: team.name,
                  points: team.points,
                  wins: team.wins + team.normalWins, // Consolidar victorias en wins
                  normalWins: 0, // Mantener campo para compatibilidad
                  draws: team.draws,
                  position: team.position,
                })),
              },
            },
          });

          // 2. Crear todos los registros de jugadores en una sola operación
          const playerTriangularData = result.teams.flatMap(team =>
            team.players.map((id) => ({
              playerId: id,
              triangularId: triangular.id,
              team: team.name,
              goals: result.scorers[id] || 0,
              wins: team.wins + team.normalWins, // Consolidar victorias
              normalWins: 0, // Mantener campo para compatibilidad
              draws: team.draws,
              points: team.points,
            }))
          );

          await tx.playerTriangular.createMany({
            data: playerTriangularData,
          });

          // 3. Obtener todos los jugadores que participaron en el triangular
          const allPlayerIds = result.teams.flatMap(team => team.players);

          // 4. Calcular partidos jugados por cada jugador
          // En un triangular, cada equipo juega 2 partidos (contra los otros 2 equipos)
          const matchesPerPlayer = 2;

          // 5. Actualizar las estadísticas de todos los jugadores que participaron
          for (const playerId of allPlayerIds) {
            // Determinar en qué equipo jugó el jugador y sus estadísticas
            const playerTeamStats = result.teams.find(team => team.players.includes(playerId));
            if (!playerTeamStats) continue;

            await tx.player.update({
              where: { id: playerId },
              data: {
                goals: { increment: result.scorers[playerId] || 0 },
                matches: { increment: matchesPerPlayer },
                wins: { increment: playerTeamStats.wins + playerTeamStats.normalWins }, // Consolidar victorias
                draws: { increment: playerTeamStats.draws },
                // Las derrotas se calculan como: partidos jugados - victorias - empates
                losses: { increment: matchesPerPlayer - (playerTeamStats.wins + playerTeamStats.normalWins) - playerTeamStats.draws },
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

  async getTriangularHistory(seasonId?: string, allSeasons = false): Promise<TriangularHistory[]> {
    const whereClause = allSeasons ? {} : seasonId ? { seasonId } : { season: { finishSeasonDate: null } };
    
    const triangulars = (await prisma.triangular.findMany({
      where: whereClause,
      include: {
        season: {
          select: {
            id: true,
            name: true,
          },
        },
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

  async getTriangularById(id: string) {
    const triangular = (await prisma.triangular.findUnique({
      where: { id },
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
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            goals: "desc",
          },
        },
      },
    })) as PrismaTriangularWithRelations | null;

    if (!triangular) return null;
    return mapTriangularToHistory(triangular);
  },

  async updateTriangular(id: string, updateData: { champion?: string; date?: string; teams?: { [team in Team]: { id: string; name: string }[] }; scorers?: { [playerId: string]: { goals: number; team: Team } } }) {
    // Actualizar datos básicos
    await prisma.triangular.update({
      where: { id },
      data: {
        ...(updateData.champion && { champion: updateData.champion }),
        ...(updateData.date && { date: new Date(updateData.date) }),
      },
      include: {
        teams: { orderBy: { position: "asc" } },
        players: { include: { player: { select: { id: true, name: true } } } },
      },
    });
    // Si hay equipos o scorers para actualizar
    if (updateData.teams || updateData.scorers) {
      // Actualizar equipos de los jugadores
      if (updateData.teams) {
        for (const [team, players] of Object.entries(updateData.teams)) {
          for (const player of players) {
            await prisma.playerTriangular.updateMany({
              where: { triangularId: id, playerId: player.id },
              data: { team: team as Team },
            });
          }
        }
      }
      // Actualizar scorers
      if (updateData.scorers) {
        for (const [playerId, scorerData] of Object.entries(updateData.scorers)) {
          await prisma.playerTriangular.updateMany({
            where: { triangularId: id, playerId },
            data: { goals: scorerData.goals, team: scorerData.team },
          });
        }
      }
    }
    // Recalcular estadísticas de jugadores
    await triangularService.recalculateAllPlayerStats();
    // Devolver el triangular actualizado
    return await triangularService.getTriangularById(id);
  },

  async deleteTriangular(id: string) {
    await prisma.$transaction(async (tx) => {
      await tx.playerTriangular.deleteMany({
        where: { triangularId: id },
      });
      await tx.teamResult.deleteMany({
        where: { triangularId: id },
      });
      await tx.triangular.delete({
        where: { id },
      });
    });
    // Recalcular estadísticas de todos los jugadores fuera de la transacción
    await triangularService.recalculateAllPlayerStats();
  },
};
