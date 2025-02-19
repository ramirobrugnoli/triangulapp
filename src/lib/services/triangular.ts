// lib/services/triangular.ts
import { prisma } from "../prisma";
import type { TriangularResult, TriangularHistory } from "@/types";
import type { PrismaTriangularWithRelations } from "@/types/prisma";
import { mapTriangularToHistory } from "@/types/prisma";
import type { PrismaClient } from "@prisma/client";

export const triangularService = {
  async saveTriangular(result: TriangularResult) {
    return prisma.$transaction(
      async (
        tx: Omit<
          PrismaClient,
          | "$connect"
          | "$disconnect"
          | "$on"
          | "$transaction"
          | "$use"
          | "$extends"
        >
      ) => {
        // Crear el triangular
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

        // Registrar participación y goles de jugadores
        const allPlayers = [
          ...result.teams.first.players.map((id) => ({
            id,
            team: result.teams.first.name,
            teamResult: result.teams.first,
          })),
          ...result.teams.second.players.map((id) => ({
            id,
            team: result.teams.second.name,
            teamResult: result.teams.second,
          })),
          ...result.teams.third.players.map((id) => ({
            id,
            team: result.teams.third.name,
            teamResult: result.teams.third,
          })),
        ];

        for (const { id: playerId, team, teamResult } of allPlayers) {
          // Registrar participación en el triangular
          await tx.playerTriangular.create({
            data: {
              playerId,
              triangularId: triangular.id,
              team,
              goals: result.scorers[playerId] || 0,
              wins: teamResult.wins,
              normalWins: teamResult.normalWins,
              draws: teamResult.draws,
              points: teamResult.points,
            },
          });

          // Actualizar estadísticas globales del jugador
          await tx.player.update({
            where: { id: playerId },
            data: {
              matches: { increment: 1 },
              wins: { increment: teamResult.wins },
              draws: { increment: teamResult.draws },
              goals: { increment: result.scorers[playerId] || 0 },
            },
          });
        }

        return triangular;
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
