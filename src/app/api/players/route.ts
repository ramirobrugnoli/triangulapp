import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

interface Player {
  id: string;
  name: string;
  matches: number;
  goals: number;
  wins: number;
  draws: number;
  losses: number;
}

/* interface RequestBody {
  name: string;
} */

export async function GET(): Promise<Player[] | NextResponse> {
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

export async function POST(request: Request) {
  try {
    // En Next.js App Router necesitamos usar request.json() para obtener el body
    const { name } = await request.json();

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

    return NextResponse.json(player);
  } catch (error) {
    console.error("Error creating player:", error);
    return NextResponse.json(
      { error: "Error creating player" },
      { status: 500 }
    );
  }
}
