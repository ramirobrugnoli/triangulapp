"use client";

import { Player } from "@/types";
import { useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import { api } from "@/lib/api";

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
  const [playerRatings, setPlayerRatings] = useState<{ [playerId: string]: number }>({});
  const { setTeams: setGlobalTeams, selectedPlayers } = useGameStore();
  const router = useRouter();
  const notify = (message: string) => toast(message);

  useEffect(() => {
    // Usando los jugadores seleccionados previamente en lugar de cargarlos del servicio
    if (selectedPlayers.length === 0) {
      // Si no hay jugadores seleccionados, redirigir a la pantalla de selección
      notify("Debes seleccionar jugadores primero");
      setTimeout(() => {
        router.push("/jugadores");
      }, 1500);
      return;
    }

    setTeams((prev) => ({ ...prev, available: selectedPlayers }));
    setLoading(false);
    
    // Cargar ratings de jugadores al inicializar
    loadPlayerRatings();
  }, [selectedPlayers, router]);

  const loadPlayerRatings = async () => {
    try {
      const playerIds = selectedPlayers.map(player => player.id);
      const playerStats = await api.players.getPlayerStatsByIds(playerIds);
      
      const ratings: { [playerId: string]: number } = {};
      playerStats.forEach(player => {
        const stats = player.stats;
        const goalsPerMatch = stats.matches > 0 ? stats.goals / stats.matches : 0;
        const winPercentage = stats.winPercentage || 0;
        const rating = (stats.points * 0.4) + (winPercentage * 0.35) + (goalsPerMatch * 25);
        ratings[player.id] = Math.round(rating * 100) / 100;
      });
      
      setPlayerRatings(ratings);
    } catch (error) {
      console.error("Error al cargar ratings:", error);
    }
  };

  const calculateTeamRating = (teamPlayers: Player[]): number => {
    if (teamPlayers.length === 0) return 0;
    
    const totalRating = teamPlayers.reduce((sum, player) => {
      return sum + (playerRatings[player.id] || 0);
    }, 0);
    
    return Math.round(totalRating * 100) / 100;
  };

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

  const handleFetchPlayerStats = async () => {
    const allPlayers = [
      ...teams.available,
      ...teams.team1,
      ...teams.team2,
      ...teams.team3,
    ];

    if (allPlayers.length === 0) {
      toast.warning("No hay jugadores para mostrar estadísticas");
      return;
    }

    try {
      const playerIds = allPlayers.map(player => player.id);
      const stats = await api.players.getPlayerStatsByIds(playerIds);
      console.log("Estadísticas de jugadores:", stats);
      toast.success(`Estadísticas de ${stats.length} jugadores obtenidas correctamente`);
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      toast.error("Error al obtener estadísticas de jugadores");
    }
  };

  const handleSuggestTeamsByStats = async () => {
    const allPlayers = [
      ...teams.available,
      ...teams.team1,
      ...teams.team2,
      ...teams.team3,
    ];

    if (allPlayers.length === 0) {
      toast.warning("No hay jugadores para formar equipos");
      return;
    }

    try {
      toast.info("Analizando estadísticas y formando equipos balanceados...");
      
      // Obtener estadísticas de todos los jugadores
      const playerIds = allPlayers.map(player => player.id);
      const playerStats = await api.players.getPlayerStatsByIds(playerIds);

      // Calcular rating para cada jugador basado en sus estadísticas
      const playersWithRating = playerStats.map(player => {
        const stats = player.stats;
        // Rating basado en: puntos (peso 40%), % victorias (peso 35%), goles por partido (peso 25%)
        const goalsPerMatch = stats.matches > 0 ? stats.goals / stats.matches : 0;
        const winPercentage = stats.winPercentage || 0;
        const rating = (stats.points * 0.4) + (winPercentage * 0.35) + (goalsPerMatch * 25);
        
        return {
          ...player,
          rating: Math.round(rating * 100) / 100
        };
      });

      // Ordenar jugadores por rating (de mayor a menor)
      playersWithRating.sort((a, b) => b.rating - a.rating);

      console.log("Jugadores ordenados por rating:", playersWithRating.map(p => ({
        name: p.name,
        rating: p.rating,
        stats: p.stats
      })));

      // Distribuir jugadores en equipos de manera balanceada
      const team1: Player[] = [];
      const team2: Player[] = [];
      const team3: Player[] = [];
      const teams_array = [team1, team2, team3];

      // Algoritmo de distribución balanceada: serpentín
      let teamIndex = 0;
      let direction = 1;

      playersWithRating.forEach((player, index) => {
        // Encontrar el jugador original sin el rating
        const originalPlayer = allPlayers.find(p => p.id === player.id);
        if (originalPlayer) {
          teams_array[teamIndex].push(originalPlayer);
        }

        // Cambiar al siguiente equipo
        teamIndex += direction;
        
        // Si llegamos al final o al principio, cambiar dirección
        if (teamIndex >= teams_array.length) {
          teamIndex = teams_array.length - 1;
          direction = -1;
        } else if (teamIndex < 0) {
          teamIndex = 0;
          direction = 1;
        }
      });

      // Calcular ratings totales de cada equipo para mostrar el balance
      const team1Rating = team1.reduce((sum, player) => {
        const playerWithRating = playersWithRating.find(p => p.id === player.id);
        return sum + (playerWithRating?.rating || 0);
      }, 0);

      const team2Rating = team2.reduce((sum, player) => {
        const playerWithRating = playersWithRating.find(p => p.id === player.id);
        return sum + (playerWithRating?.rating || 0);
      }, 0);

      const team3Rating = team3.reduce((sum, player) => {
        const playerWithRating = playersWithRating.find(p => p.id === player.id);
        return sum + (playerWithRating?.rating || 0);
      }, 0);

      console.log("Rating de equipos:", {
        team1: Math.round(team1Rating * 100) / 100,
        team2: Math.round(team2Rating * 100) / 100,
        team3: Math.round(team3Rating * 100) / 100
      });

      // Aplicar los equipos sugeridos
      setTeams({
        available: [],
        team1,
        team2,
        team3
      });

      toast.success(`Equipos balanceados creados. Ratings: T1(${Math.round(team1Rating)}), T2(${Math.round(team2Rating)}), T3(${Math.round(team3Rating)})`);
      
    } catch (error) {
      console.error("Error al sugerir equipos:", error);
      toast.error("Error al formar equipos basados en estadísticas");
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
      <>
        <ToastContainer
          autoClose={3000}
          position="top-right"
          theme="dark"
          closeOnClick={true}
        />
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
        </div>
      </>
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
                <div className="flex flex-col justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Equipo {index + 1}</h3>
                  <div className="text-sm text-gray-400">
                    ({teams[teamId].length}/5)
                  </div>
                </div>
                <div className="space-y-2 mb-3">
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
                <div className="border-t border-gray-700 pt-2">
                  <div className="text-center">
                    <span className="text-xs text-gray-400">Rating: </span>
                    <span className="text-sm font-bold text-blue-400">
                      {calculateTeamRating(teams[teamId])}
                    </span>
                  </div>
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

        <button
          onClick={handleFetchPlayerStats}
          className="w-full py-3 rounded-lg font-bold bg-blue-600 hover:bg-blue-700"
        >
          Ver estadísticas de jugadores
        </button>
        <button
          onClick={handleSuggestTeamsByStats}
          className="w-full py-3 rounded-lg font-bold bg-blue-600 hover:bg-blue-700"
        >
          Sugerir equipos en base a estadísticas
        </button>
      </div>
    </>
  );
}
