import { prisma } from "../prisma";
import { PlayerStatsService } from "./playerStats";

export class PlayersService {
  static async getAllPlayers(seasonId?: string, allSeasons = false) {
    // Prueba la conexión antes de intentar consultar
    await prisma.$queryRaw`SELECT 1`;

    // Construir el filtro de triangulares basado en temporada
    const triangularWhere = allSeasons 
      ? {} 
      : seasonId 
        ? { seasonId } 
        : { season: { finishSeasonDate: null } };

    // Obtener jugadores con sus triangulares y estadísticas de equipos filtradas por temporada
    const players = await prisma.player.findMany({
      include: {
        triangulars: {
          where: {
            triangular: triangularWhere
          },
          include: {
            triangular: {
              include: {
                teams: true,
                season: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              },
            },
          },
        },
      },
    });

    // Usar el servicio centralizado para procesar las estadísticas
    const formattedPlayers = PlayerStatsService.processMultiplePlayers(players);

    return formattedPlayers;
  }

  static async createPlayer(data: { name: string }) {
    // Validar que el nombre existe
    if (!data.name) {
      throw new Error("Name is required");
    }

    // Prueba la conexión antes de intentar crear
    await prisma.$queryRaw`SELECT 1`;

    const player = await prisma.player.create({
      data: {
        name: data.name,
        matches: 0,
        goals: 0,
        wins: 0,
        draws: 0,
        losses: 0,
      },
    });

    return player;
  }
} 