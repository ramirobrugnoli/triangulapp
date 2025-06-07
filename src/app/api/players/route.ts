// app/api/players/route.ts
import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";
import { PlayerStatsService } from "@/lib/services/playerStats";

export async function GET(): Promise<Response> {
  try {
    console.log("GET /api/players - Iniciando...");

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
          stack: dbError instanceof Error ? dbError.stack : undefined,
        },
        { status: 500 }
      );
    }

    // Obtener jugadores con sus triangulares y estadísticas de equipos
    const players = await prisma.player.findMany({
      include: {
        triangulars: {
          include: {
            triangular: {
              include: {
                teams: true,
              },
            },
          },
        },
      },
    });
    
    console.log(`Encontrados ${players.length} jugadores`);

    // Usar el servicio centralizado para procesar las estadísticas
    const formattedPlayers = PlayerStatsService.processMultiplePlayers(players);

    return NextResponse.json(formattedPlayers);
  } catch (error) {
    console.error("Error completo en GET /api/players:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: "Error fetching players",
        message: errorMessage,
        stack: errorStack,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    console.log("POST /api/players - Iniciando...");

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
          stack: dbError instanceof Error ? dbError.stack : undefined,
        },
        { status: 500 }
      );
    }

    // En Next.js App Router necesitamos usar request.json() para obtener el body
    const body = await request.json();
    console.log("Body recibido:", body);

    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const player = await prisma.player.create({
      data: {
        name,
        matches: 0,
        goals: 0,
        wins: 0,
        draws: 0,
        losses: 0,
      },
    });

    console.log("Jugador creado:", player);

    return NextResponse.json(player);
  } catch (error) {
    console.error("Error completo en POST /api/players:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: "Error creating player",
        message: errorMessage,
        stack: errorStack,
      },
      { status: 500 }
    );
  }
}
