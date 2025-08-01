// app/api/players/route.ts
import { NextResponse } from "next/server";
import { PlayersService } from "@/lib/services/playersService";

export async function GET(request: Request): Promise<Response> {
  try {
    console.log("GET /api/players - Iniciando...");

    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId');
    const allSeasons = searchParams.get('allSeasons') === 'true';

    const formattedPlayers = await PlayersService.getAllPlayers(seasonId || undefined, allSeasons);
    
    console.log(`Encontrados ${formattedPlayers.length} jugadores`);

    return NextResponse.json(formattedPlayers);
  } catch (error) {
    console.error("Error completo en GET /api/players:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Handle specific database connection errors
    if (errorMessage.includes('Connection failed') || errorMessage.includes('database connection')) {
      return NextResponse.json(
        {
          error: "Error de conexión a la base de datos",
          details: errorMessage,
          stack: errorStack,
        },
        { status: 500 }
      );
    }

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

    // En Next.js App Router necesitamos usar request.json() para obtener el body
    const body = await request.json();
    console.log("Body recibido:", body);

    const { name } = body;

    const player = await PlayersService.createPlayer({ name });

    console.log("Jugador creado:", player);

    return NextResponse.json(player);
  } catch (error) {
    console.error("Error completo en POST /api/players:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Handle validation errors
    if (errorMessage.includes('Name is required')) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Handle specific database connection errors
    if (errorMessage.includes('Connection failed') || errorMessage.includes('database connection')) {
      return NextResponse.json(
        {
          error: "Error de conexión a la base de datos",
          details: errorMessage,
          stack: errorStack,
        },
        { status: 500 }
      );
    }

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
