import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET(): Promise<Response> {
  try {
    console.log("GET /api/players/simple - Iniciando...");

    // Obtener solo los datos básicos de los jugadores
    const players = await prisma.player.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    console.log(`Encontrados ${players.length} jugadores (simple)`);

    // Devolver jugadores con estructura simple pero compatible con el tipo Player
    const formattedPlayers = players.map(player => ({
      id: player.id,
      name: player.name,
      stats: {
        matches: 0,
        goals: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
      }
    }));

    return NextResponse.json(formattedPlayers);
  } catch (error) {
    console.error("Error completo en GET /api/players/simple:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        error: "Error fetching players",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
} 