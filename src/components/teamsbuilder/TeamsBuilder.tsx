"use client";

import { Player } from "@/types";
import { useEffect, useState } from "react";
import { playerService } from "@/lib/api";
import { useGameStore } from "@/store/gameStore";
import { useRouter } from "next/navigation";

interface TeamBuilderState {
  available: Player[];
  team1: Player[];
  team2: Player[];
  team3: Player[];
  [key: string]: Player[];
}

const shuffleArray = (array: Player[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export function TeamsBuilder() {
  const [teams, setTeams] = useState<TeamBuilderState>({
    available: [],
    team1: [],
    team2: [],
    team3: [],
  });
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setTeams: setGlobalTeams } = useGameStore();
  const router = useRouter();

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const data = await playerService.getAllPlayers();
        setTeams((prev) => ({ ...prev, available: data }));
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  // Función para manejar la selección de jugador
  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
  };

  // Función para asignar jugador a un equipo
  const handleTeamAssign = (teamId: "team1" | "team2" | "team3") => {
    if (!selectedPlayer) return;

    setTeams((prev) => {
      // Remover jugador de su contenedor actual
      const newTeams = { ...prev };
      Object.keys(newTeams).forEach((key) => {
        newTeams[key] = newTeams[key].filter((p) => p.id !== selectedPlayer.id);
      });

      // Agregar jugador al nuevo equipo
      newTeams[teamId] = [...newTeams[teamId], selectedPlayer];

      return newTeams;
    });

    setSelectedPlayer(null);
  };

  const handleConfirmTeams = async () => {
    if (
      teams.team1.length === 0 ||
      teams.team2.length === 0 ||
      teams.team3.length === 0
    ) {
      alert("Todos los equipos deben tener al menos un jugador");
      return;
    }

    setIsSubmitting(true);
    try {
      setGlobalTeams({
        teamA: {
          name: "Equipo 1",
          members: teams.team1.map((player) => ({
            id: player.id,
            name: player.name,
          })),
        },
        teamB: {
          name: "Equipo 2",
          members: teams.team2.map((player) => ({
            id: player.id,
            name: player.name,
          })),
        },
        waiting: {
          name: "Equipo 3",
          members: teams.team3.map((player) => ({
            id: player.id,
            name: player.name,
          })),
        },
      });

      alert("Equipos guardados correctamente");
      setTimeout(() => {
        router.push("/anotador");
      }, 1000);
    } catch (error) {
      alert("Error al guardar los equipos");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRandomTeams = () => {
    const allPlayers = [
      ...teams.available,
      ...teams.team1,
      ...teams.team2,
      ...teams.team3,
    ];

    const shuffledPlayers = shuffleArray(allPlayers);

    setTeams({
      team1: shuffledPlayers.slice(0, 5),
      team2: shuffledPlayers.slice(5, 10),
      team3: shuffledPlayers.slice(10, 15),
      available: shuffledPlayers.slice(15),
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  const renderPlayerList = (items: Player[], title: string) => (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">{title}</h3>
        <button
          onClick={handleRandomTeams}
          className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg"
          title="Armar equipos aleatorios"
        >
          🎲 Random
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map((player) => (
          <button
            key={player.id}
            onClick={() => handlePlayerSelect(player)}
            className={`
             w-full p-2 rounded-lg text-sm
             ${
               selectedPlayer?.id === player.id
                 ? "bg-green-600"
                 : "bg-gray-700 hover:bg-gray-600"
             }
           `}
          >
            {player.name}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {renderPlayerList(teams.available, "Jugadores Disponibles")}

      <div className="grid grid-cols-3 gap-4">
        {["team1", "team2", "team3"].map((teamId, index) => (
          <div key={teamId} className="flex flex-col">
            <div
              onClick={
                selectedPlayer
                  ? () =>
                      handleTeamAssign(teamId as "team1" | "team2" | "team3")
                  : undefined
              }
              className={`
        bg-gray-900 rounded-lg p-4
        ${
          selectedPlayer
            ? "cursor-pointer border-2 border-blue-500 hover:border-blue-400"
            : "border-2 border-transparent"
        }
        transition-all duration-200
      `}
            >
              <h3 className="text-lg font-bold mb-4">Equipo {index + 1}</h3>
              <div className="space-y-2">
                {teams[teamId].map((player) => (
                  <button
                    key={player.id}
                    onClick={(e) => {
                      e.stopPropagation(); // Evita que el click llegue al contenedor padre
                      handlePlayerSelect(player);
                    }}
                    className={`
              w-full p-2 rounded-lg text-sm
              ${
                selectedPlayer?.id === player.id
                  ? "bg-green-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }
            `}
                  >
                    {player.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleConfirmTeams}
        disabled={isSubmitting}
        className={`
         w-full py-3 rounded-lg
         ${isSubmitting ? "bg-gray-600" : "bg-green-600 hover:bg-green-700"}
       `}
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
            Guardando...
          </div>
        ) : (
          "Confirmar Equipos"
        )}
      </button>
    </div>
  );
}
