import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const players = await prisma.player.findMany();

    // Transformar la respuesta para que coincida con la estructura esperada
    const formattedPlayers = players.map((player) => ({
      id: player.id,
      name: player.name,
      stats: {
        matches: player.matches,
        goals: player.goals,
        wins: player.wins,
        draws: player.draws,
        losses: player.losses,
        points: player.wins * 3 + player.draws, // Calculamos los puntos
      },
    }));

    return NextResponse.json(formattedPlayers);
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json(
      { error: "Error fetching players" },
      { status: 500 }
    );
  }
}
