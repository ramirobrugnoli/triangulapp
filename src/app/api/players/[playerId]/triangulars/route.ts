import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;

    // Obtener parámetros de URL para season filtering
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId');
    const allSeasons = searchParams.get('allSeasons') === 'true';

    // Construir el filtro de triangulares basado en temporada
    const triangularWhere = allSeasons 
      ? {} 
      : seasonId 
        ? { seasonId } 
        : { season: { finishSeasonDate: null } };

    // Obtener todos los triangulares donde participó el jugador filtrados por temporada
    const playerTriangulars = await prisma.playerTriangular.findMany({
      where: {
        playerId: playerId,
        triangular: triangularWhere
      },
      include: {
        triangular: {
          include: {
            season: {
              select: {
                id: true,
                name: true
              }
            },
            teams: {
              orderBy: {
                position: "asc",
              },
            },
            players: {
              include: {
                player: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        triangular: {
          date: "desc",
        },
      },
    });

    // Transformar los datos para incluir la posición del jugador
    const triangularsWithPosition = playerTriangulars.map((participation) => {
      const triangular = participation.triangular;
      
      // Encontrar la posición del equipo del jugador
      const playerTeam = triangular.teams.find(
        (team) => team.teamName === participation.team
      );
      
      // Agrupar jugadores por equipo
      const teamPlayers: Record<string, { id: string; name: string }[]> = {};
      triangular.players.forEach((playerParticipation) => {
        const teamName = playerParticipation.team;
        if (!teamPlayers[teamName]) {
          teamPlayers[teamName] = [];
        }
        teamPlayers[teamName].push({
          id: playerParticipation.player.id,
          name: playerParticipation.player.name,
        });
      });
      
      // Obtener el equipo real del jugador en este triangular (de la tabla playerTriangular)
      const realTeam = participation.team;
      return {
        id: triangular.id,
        date: triangular.date,
        champion: triangular.champion,
        playerTeam: participation.team,
        realTeam: realTeam,
        position: playerTeam?.position || 0,
        points: participation.points,
        wins: participation.wins,
        draws: participation.draws,
        goals: participation.goals,
        teams: triangular.teams,
        teamPlayers: teamPlayers,
      };
    });

    return NextResponse.json(triangularsWithPosition);
  } catch (error) {
    console.error("Error obteniendo triangulares del jugador:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 