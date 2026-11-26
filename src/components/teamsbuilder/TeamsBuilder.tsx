"use client";

import { Player } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { useSeasonStore } from "@/store/seasonStore";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import { api } from "@/lib/api";
import { PlayerStatsService } from "@/lib/services/playerStats";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getColorByTeam, normalizeText as normalize } from "@/lib/helpers/helpers";

const TEAM_SIZE = 5;
const TEAM_IDS = ["team1", "team2", "team3"] as const;
type TeamId = (typeof TEAM_IDS)[number];

const TEAM_NAMES: Record<TeamId, "Equipo 1" | "Equipo 2" | "Equipo 3"> = {
  team1: "Equipo 1",
  team2: "Equipo 2",
  team3: "Equipo 3",
};

// Color de cada equipo: Amarillo, Rosa y Negro
const TEAM_ACCENTS: Record<TeamId, { bar: string; dot: string }> = {
  team1: { bar: "bg-yellow-400", dot: "bg-yellow-400" },
  team2: { bar: "bg-pink-400", dot: "bg-pink-400" },
  team3: { bar: "bg-gray-950 border-t border-gray-500", dot: "bg-gray-950 ring-1 ring-gray-400" },
};

interface TeamBuilderState {
  available: Player[];
  team1: Player[];
  team2: Player[];
  team3: Player[];
  [key: string]: Player[];
}

const formatRating = (rating: number | undefined) =>
  rating === undefined ? null : (Math.round(rating * 10) / 10).toString();

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="w-4 h-4 shrink-0">
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// Jugador como chip tocable (disponibles y equipos usan el mismo componente)
function PlayerChip({
  player,
  rating,
  isSelected,
  onToggle,
}: {
  player: Player;
  rating: string | null;
  isSelected: boolean;
  onToggle: (player: Player) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onToggle(player)}
      className={`
        w-full h-11 px-3 rounded-lg text-sm font-medium flex items-center justify-between gap-2
        transition-colors select-none border
        ${
          isSelected
            ? "bg-green-600 border-green-400 text-white"
            : "bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-700 hover:border-gray-500"
        }
      `}
    >
      <span className="truncate">{player.name}</span>
      {isSelected ? (
        <CheckIcon />
      ) : (
        rating !== null && <span className="text-xs tabular-nums text-gray-400">{rating}</span>
      )}
    </button>
  );
}

function TeamCard({
  teamId,
  players,
  rating,
  canReceive,
  onMoveHere,
  children,
}: {
  teamId: TeamId;
  players: Player[];
  rating: number;
  canReceive: boolean;
  onMoveHere: () => void;
  children: React.ReactNode;
}) {
  const accent = TEAM_ACCENTS[teamId];
  const isFull = players.length >= TEAM_SIZE;
  const emptySlots = Math.max(TEAM_SIZE - players.length, 0);

  return (
    <section
      aria-label={getColorByTeam(TEAM_NAMES[teamId])}
      className="bg-gray-900 rounded-lg overflow-hidden flex flex-col"
    >
      <div className={`h-1.5 ${accent.bar}`} />
      <div className="p-3 flex flex-col gap-3 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold flex items-center gap-2 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${accent.dot}`} />
            <span className="truncate">{getColorByTeam(TEAM_NAMES[teamId])}</span>
          </h3>
          <span
            className={`text-xs tabular-nums px-2 py-0.5 rounded-full ${
              isFull ? "bg-green-900 text-green-300" : "bg-gray-800 text-gray-400"
            }`}
          >
            ({players.length}/{TEAM_SIZE})
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {children}
          {Array.from({ length: emptySlots }).map((_, i) =>
            canReceive ? (
              <button
                key={`empty-${i}`}
                type="button"
                onClick={onMoveHere}
                aria-label="Agregar aquí"
                className="h-11 rounded-lg border border-dashed border-blue-500 text-xs text-blue-300 hover:bg-blue-950"
              >
                {i === 0 ? "+ Agregar aquí" : ""}
              </button>
            ) : (
              <div
                key={`empty-${i}`}
                aria-hidden="true"
                className="h-11 rounded-lg border border-dashed border-gray-700"
              />
            )
          )}
        </div>

        <div className="mt-auto pt-2 border-t border-gray-800 flex items-center justify-between text-xs">
          <span className="text-gray-400">Rating</span>
          <span className="font-bold tabular-nums text-blue-400">{rating}</span>
        </div>
      </div>
    </section>
  );
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playerRatings, setPlayerRatings] = useState<{ [playerId: string]: number }>({});
  const [mounted, setMounted] = useState(false);
  const { setTeams: setGlobalTeams, selectedPlayers } = useGameStore();
  const { getSelectedSeasonId, isAllSeasonsMode } = useSeasonStore();
  const router = useRouter();
  const notify = (message: string) => toast(message);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlayers, router]);

  const loadPlayerRatings = async () => {
    try {
      const playerIds = selectedPlayers.map(player => player.id);
      const seasonId = getSelectedSeasonId();
      const allSeasons = isAllSeasonsMode();
      const playerStats = await api.players.getPlayerStatsByIds(playerIds, seasonId, allSeasons);

      // Usar el servicio centralizado para calcular ratings V2
      const ratingsV2 = PlayerStatsService.calculatePlayersRatingsV2(playerStats);
      setPlayerRatings(ratingsV2);
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

  const togglePlayerSelection = (player: Player) => {
    setSelectedIds((prev) =>
      prev.includes(player.id)
        ? prev.filter((id) => id !== player.id)
        : [...prev, player.id]
    );
  };

  const clearSelection = () => setSelectedIds([]);

  // Mueve todos los jugadores seleccionados al destino, en el orden en que se tocaron.
  // En los equipos solo entran hasta completar el cupo; el resto queda seleccionado.
  const moveSelectedTo = (target: string) => {
    if (selectedIds.length === 0) return;

    const playersById = new Map(
      Object.values(teams).flat().map((player) => [player.id, player])
    );
    const toMove = selectedIds
      .filter((id) => findPlayerTeam(id) !== target)
      .map((id) => playersById.get(id))
      .filter((player): player is Player => Boolean(player));

    const freeSlots =
      target === "available" ? toMove.length : Math.max(TEAM_SIZE - teams[target].length, 0);
    const moving = toMove.slice(0, freeSlots);

    // Todos los seleccionados ya están ahí: no se mueve nada y la selección queda
    if (toMove.length === 0) return;

    if (moving.length === 0) {
      toast.warning(`El equipo ya tiene ${TEAM_SIZE} jugadores`);
      return;
    }

    const movingIds = new Set(moving.map((player) => player.id));
    setTeams((prev) => {
      const next: TeamBuilderState = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = next[key].filter((player) => !movingIds.has(player.id));
      }
      next[target] = [...next[target], ...moving];
      return next;
    });

    const leftOut = toMove.length - moving.length;
    if (leftOut > 0) {
      toast.warning(
        `Equipo completo: ${leftOut} jugador${leftOut === 1 ? "" : "es"} quedó sin mover`
      );
      setSelectedIds(toMove.slice(freeSlots).map((player) => player.id));
    } else {
      clearSelection();
    }
    setSearch("");
  };

  // Un destino sirve si hay cupo y al menos un seleccionado no está ya ahí
  const canMoveTo = (target: TeamId) =>
    teams[target].length < TEAM_SIZE &&
    selectedIds.some((id) => findPlayerTeam(id) !== target);

  const filteredAvailable = useMemo(() => {
    const query = normalize(search);
    if (!query) return teams.available;
    return teams.available.filter((player) => normalize(player.name).includes(query));
  }, [teams.available, search]);

  const selectVisible = () => {
    setSelectedIds((prev) => {
      const ids = new Set(prev);
      filteredAvailable.forEach((player) => ids.add(player.id));
      return Array.from(ids);
    });
  };

  // Intercambia dos jugadores seleccionados que están en lugares distintos
  // (dos equipos, o un equipo y disponibles), manteniendo sus posiciones.
  const swapTeams =
    selectedIds.length === 2 ? selectedIds.map((id) => findPlayerTeam(id)) : [];
  const canSwap = swapTeams.length === 2 && swapTeams[0] !== swapTeams[1] && !swapTeams.includes("");

  const swapSelected = () => {
    if (!canSwap) return;
    const [idA, idB] = selectedIds;
    const [teamA, teamB] = swapTeams;
    setTeams((prev) => {
      const next: TeamBuilderState = { ...prev, [teamA]: [...prev[teamA]], [teamB]: [...prev[teamB]] };
      const indexA = next[teamA].findIndex((p) => p.id === idA);
      const indexB = next[teamB].findIndex((p) => p.id === idB);
      if (indexA === -1 || indexB === -1) return prev;
      const playerA = next[teamA][indexA];
      next[teamA][indexA] = next[teamB][indexB];
      next[teamB][indexB] = playerA;
      return next;
    });
    clearSelection();
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
      toast.info("Analizando estadísticas y formando equipos balanceados...", {
        autoClose: 1000,
      });
      
      // Obtener estadísticas de todos los jugadores
      const playerIds = allPlayers.map(player => player.id);
      const seasonId = getSelectedSeasonId();
      const allSeasons = isAllSeasonsMode();
      const playerStats = await api.players.getPlayerStatsByIds(playerIds, seasonId, allSeasons);

      // Calcular rating V2 para cada jugador usando el servicio centralizado
      const playersWithRating: (Player & { rating: number })[] = playerStats.map(player => ({
        ...player,
        rating: PlayerStatsService.calculatePlayerRatingV2(player.stats)
      }));

      // Ordenar jugadores por rating (de mayor a menor)
      const sortedPlayers = playersWithRating.sort((a, b) => b.rating - a.rating);

      console.log("Jugadores ordenados por rating:", sortedPlayers.map(p => ({
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

      sortedPlayers.forEach((player) => {
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
        const playerWithRating = sortedPlayers.find(p => p.id === player.id);
        return sum + (playerWithRating?.rating || 0);
      }, 0);

      const team2Rating = team2.reduce((sum, player) => {
        const playerWithRating = sortedPlayers.find(p => p.id === player.id);
        return sum + (playerWithRating?.rating || 0);
      }, 0);

      const team3Rating = team3.reduce((sum, player) => {
        const playerWithRating = sortedPlayers.find(p => p.id === player.id);
        return sum + (playerWithRating?.rating || 0);
      }, 0);

      console.log("Rating de equipos:", {
        team1: Math.round(team1Rating * 100) / 100,
        team2: Math.round(team2Rating * 100) / 100,
        team3: Math.round(team3Rating * 100) / 100
      });

      // Aplicar los equipos sugeridos
      clearSelection();
      setTeams({
        available: [],
        team1,
        team2,
        team3
      });

      // Cerrar el toast de análisis y mostrar el resultado
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

    clearSelection();
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

  if (!mounted || loading) {
    return (
      <>
        <ToastContainer
          autoClose={3000}
          position="top-right"
          theme="dark"
          closeOnClick={true}
        />
        <div className="flex justify-center h-full">
        <LoadingSpinner />
        </div>
      </>
    );
  }

  return (
    <>
      <ToastContainer
        autoClose={3000}
        position="top-right"
        theme="dark"
        closeOnClick={true}
      />

      <div className="space-y-6">
        {teams.available.length > 0 && (
          <section className="bg-gray-900 rounded-lg p-4 space-y-3">
            <h3 className="text-lg font-bold">
              Jugadores Disponibles{" "}
              <span className="text-sm font-normal text-gray-400">({teams.available.length})</span>
            </h3>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar jugador..."
                  aria-label="Buscar jugador"
                  className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 pr-8 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Limpiar búsqueda"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
              {search && filteredAvailable.length > 0 && (
                <button
                  type="button"
                  onClick={selectVisible}
                  className="text-xs px-3 rounded-lg bg-gray-700 hover:bg-gray-600 whitespace-nowrap"
                >
                  Seleccionar visibles
                </button>
              )}
            </div>

            <p className="text-xs text-gray-400">
              Tocá jugadores para seleccionarlos y después elegí el equipo.
            </p>

            {filteredAvailable.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-4">
                Ningún jugador coincide con &quot;{search}&quot;
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {filteredAvailable.map((player) => (
                  <PlayerChip
                    key={player.id}
                    player={player}
                    rating={formatRating(playerRatings[player.id])}
                    isSelected={selectedIds.includes(player.id)}
                    onToggle={togglePlayerSelection}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TEAM_IDS.map((teamId) => (
            <TeamCard
              key={teamId}
              teamId={teamId}
              players={teams[teamId]}
              rating={calculateTeamRating(teams[teamId])}
              canReceive={canMoveTo(teamId)}
              onMoveHere={() => moveSelectedTo(teamId)}
            >
              {teams[teamId].map((player) => (
                <PlayerChip
                  key={player.id}
                  player={player}
                  rating={formatRating(playerRatings[player.id])}
                  isSelected={selectedIds.includes(player.id)}
                  onToggle={togglePlayerSelection}
                />
              ))}
            </TeamCard>
          ))}
        </div>

        {selectedIds.length > 0 && (
          <div
            role="toolbar"
            aria-label="Mover jugadores seleccionados"
            className="sticky bottom-24 z-30 rounded-lg bg-gray-900/95 backdrop-blur border border-blue-500 p-3 shadow-lg shadow-black/40"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold">
                {selectedIds.length} seleccionado{selectedIds.length === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={clearSelection}
                className="text-xs text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {TEAM_IDS.map((teamId) => {
                const enabled = canMoveTo(teamId);
                return (
                  <button
                    key={teamId}
                    type="button"
                    onClick={() => moveSelectedTo(teamId)}
                    disabled={!enabled}
                    className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${
                      enabled
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-800 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${TEAM_ACCENTS[teamId].dot}`} />→{" "}
                    {getColorByTeam(TEAM_NAMES[teamId])} ({teams[teamId].length}/{TEAM_SIZE})
                  </button>
                );
              })}
            </div>
            {(canSwap || selectedIds.some((id) => findPlayerTeam(id) !== "available")) && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {canSwap && (
                  <button
                    type="button"
                    onClick={swapSelected}
                    className="py-2 rounded-lg text-xs font-bold bg-yellow-600 hover:bg-yellow-700"
                  >
                    ⇄ Intercambiar
                  </button>
                )}
                {selectedIds.some((id) => findPlayerTeam(id) !== "available") && (
                  <button
                    type="button"
                    onClick={() => moveSelectedTo("available")}
                    className={`py-2 rounded-lg text-xs bg-gray-700 hover:bg-gray-600 ${
                      canSwap ? "" : "col-span-2"
                    }`}
                  >
                    Devolver a disponibles
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Fuera de "disponibles" para poder volver a sortear con todos asignados */}
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <button
            onClick={handleRandomTeams}
            className="px-4 py-3 rounded-lg font-bold bg-gray-700 hover:bg-gray-600"
            title="Armar equipos aleatorios"
          >
            🎲 Random
          </button>
          <button
            onClick={handleSuggestTeamsByStats}
            className="w-full py-3 rounded-lg font-bold bg-blue-600 hover:bg-blue-700"
          >
            🎯 Balancear con IA
          </button>
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
