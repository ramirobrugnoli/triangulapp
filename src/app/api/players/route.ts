// app/api/players/route.ts
import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

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

    // Si llegamos aquí, la conexión está bien
    const players = await prisma.player.findMany();
    console.log(`Encontrados ${players.length} jugadores`);

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
