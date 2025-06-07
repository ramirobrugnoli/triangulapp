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

    // Obtener jugadores con estadísticas de triangulares
    const players = await prisma.player.findMany({
      where: {
        id: {
          in: playerIds
        }
      },
      include: {
        triangulars: {
          include: {
            triangular: {
              include: {
                teams: true
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