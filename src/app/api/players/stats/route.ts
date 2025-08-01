import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import { PlayerStatsService } from "@/lib/services/playerStats";

export async function POST(request: Request): Promise<Response> {
  try {
    console.log("POST /api/players/stats - Iniciando...");

    // Prueba la conexión antes de intentar consultar
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log("Conexión a la base de datos exitosa");
    } catch (dbError) {
      console.error("Error de conexión a la base de datos:", dbError);
      return NextResponse.json(
        {
          error: "Error de conexión a la base de datos",
          details: dbError instanceof Error ? dbError.message : String(dbError),
        },
        { status: 500 }
      );
    }

    // Obtener parámetros de URL para season filtering
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId');
    const allSeasons = searchParams.get('allSeasons') === 'true';

    // Obtener los IDs de jugadores del body
    const body = await request.json();
    console.log("Body recibido:", body);

    const { playerIds } = body;

    if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
      return NextResponse.json(
        { error: "Se requiere un array de IDs de jugadores" },
        { status: 400 }
      );
    }

    // Construir el filtro de triangulares basado en temporada
    const triangularWhere = allSeasons 
      ? {} 
      : seasonId 
        ? { seasonId } 
        : { season: { finishSeasonDate: null } };

    // Obtener jugadores con estadísticas de triangulares filtradas por temporada
    const players = await prisma.player.findMany({
      where: {
        id: {
          in: playerIds
        }
      },
      include: {
        triangulars: {
          where: {
            triangular: triangularWhere
          },
          select: {
            team: true,
            goals: true,
            wins: true,
            normalWins: true, // Mantener para datos históricos
            draws: true,
            points: true,
            triangular: {
              include: {
                teams: true,
                season: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log(`Encontrados ${players.length} jugadores`);

    // Usar el servicio centralizado para procesar las estadísticas
    const playerStats = PlayerStatsService.processMultiplePlayers(players);
    
    console.log(playerStats[0]);

    return NextResponse.json(playerStats);
  } catch (error) {
    console.error("Error completo en POST /api/players/stats:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        error: "Error obteniendo estadísticas de jugadores",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
} 