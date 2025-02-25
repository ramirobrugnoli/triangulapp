"use client";

import { Player } from "@/types";
import { useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";

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
  const { setTeams: setGlobalTeams, selectedPlayers } = useGameStore();
  const router = useRouter();
  const notify = (message: string) => toast(message);

  useEffect(() => {
    // Usando los jugadores seleccionados previamente en lugar de cargarlos del servicio
    if (selectedPlayers.length === 0) {
      // Si no hay jugadores seleccionados, redirigir a la pantalla de selección
      notify("Debes seleccionar jugadores primero");
      setTimeout(() => {
        router.push("/armador");
      }, 1500);
      return;
    }

    setTeams((prev) => ({ ...prev, available: selectedPlayers }));
    setLoading(false);
  }, [selectedPlayers, router]);

  // Función para encontrar el equipo del jugador seleccionado
  const findPlayerTeam = (playerId: string): string => {
    for (const teamKey of Object.keys(teams)) {
      if (teams[teamKey].some((player) => player.id === playerId)) {
        return teamKey;
      }
    }
    return "";
  };

  // Función para manejar la selección de jugador
  const handlePlayerSelect = (player: Player) => {
    if (selectedPlayer) {
      if (player.id === selectedPlayer.id) {
        setSelectedPlayer(null);
        return;
      }

      const firstPlayerTeam = findPlayerTeam(selectedPlayer.id);
      const secondPlayerTeam = findPlayerTeam(player.id);

      if (firstPlayerTeam === secondPlayerTeam) {
        setSelectedPlayer(null);
        return;
      }

      setTeams((prev) => {
        const newTeams = { ...prev };

        // Eliminar jugador del equipo actual
        newTeams[firstPlayerTeam] = newTeams[firstPlayerTeam].filter(
          (p) => p.id !== selectedPlayer.id
        );
        newTeams[secondPlayerTeam] = newTeams[secondPlayerTeam].filter(
          (p) => p.id !== player.id
        );

        // Intercambiar equipos de jugadores
        newTeams[secondPlayerTeam].push({ ...selectedPlayer });
        newTeams[firstPlayerTeam].push({ ...player });

        return newTeams;
      });
      setSelectedPlayer(null);
    } else {
      setSelectedPlayer(player);
    }
  };

  // Función para asignar jugador a un equipo
  const handleTeamAssign = (teamId: "team1" | "team2" | "team3") => {
    if (!selectedPlayer) return;

    setTeams((prev) => {
      if (prev[teamId].length === 5) {
        return prev; // Retornar los equipos sin cambios
      }

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
      teams.team1.length !== 5 ||
      teams.team2.length !== 5 ||
      teams.team3.length !== 5
    ) {
      notify("Todos los equipos deben tener 5 jugadores");
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

      notify("Equipos guardados correctamente");
      setTimeout(() => {
        router.push("/anotador");
      }, 1000);
    } catch (error) {
      notify("Error al guardar los equipos");
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

    // Distribuir equitativamente los jugadores
    const shuffledPlayers = shuffleArray(allPlayers);
    const playersPerTeam = Math.floor(shuffledPlayers.length / 3);
    const remainder = shuffledPlayers.length % 3;

    // Calcular cuántos jugadores va a tener cada equipo
    let team1Count = playersPerTeam;
    let team2Count = playersPerTeam;
    const team3Count = playersPerTeam;

    // Distribuir los jugadores extra (si hay)
    if (remainder === 1) {
      team1Count += 1;
    } else if (remainder === 2) {
      team1Count += 1;
      team2Count += 1;
    }

    setTeams({
      team1: shuffledPlayers.slice(0, team1Count),
      team2: shuffledPlayers.slice(team1Count, team1Count + team2Count),
      team3: shuffledPlayers.slice(
        team1Count + team2Count,
        team1Count + team2Count + team3Count
      ),
      available: [], // Todos los jugadores están asignados
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
    <>
      <ToastContainer
        autoClose={3000}
        position="top-right"
        theme="dark"
        closeOnClick={true}
      />
      <div className="space-y-6">
        {teams.available &&
          renderPlayerList(teams.available, "Jugadores Disponibles")}

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
                        e.stopPropagation();
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
    </>
  );
}
