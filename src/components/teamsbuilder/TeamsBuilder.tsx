"use client";

import { Player } from "@/types";
import { useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import { api } from "@/lib/api";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { PlayerStatsService } from "@/lib/services/playerStats";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getColorByTeam } from "@/lib/helpers/helpers";

interface TeamBuilderState {
  available: Player[];
  team1: Player[];
  team2: Player[];
  team3: Player[];
  [key: string]: Player[];
}

// Componente para área de drop de jugadores disponibles
function AvailablePlayersDropZone({ children }: { children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: "available",
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        rounded-lg p-4 transition-all duration-200
        ${isOver ? "bg-gray-800 ring-2 ring-blue-500" : "bg-transparent"}
      `}
    >
      {children}
    </div>
  );
}

// Componente para jugador arrastrable en círculo (para jugadores disponibles)
function DraggablePlayerCircle({
  player,
  isSelected,
}: {
  player: Player;
  isSelected: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: player.id,
  });

  const style = {
    ...(transform ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : {}),
    touchAction: "none" as const,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        w-20 h-20 rounded-full text-xs font-bold transition-all flex items-center justify-center px-2
        ${isDragging ? "opacity-50 z-50" : ""}
        ${isSelected ? "bg-green-600" : "bg-gray-700 hover:bg-gray-600"}
        cursor-grab active:cursor-grabbing
        touch-none select-none
        border-2 border-gray-500
      `}
    >
      <span className="text-center leading-tight text-white break-words max-w-full">
        {player.name}
      </span>
    </button>
  );
}

// Componente para jugador arrastrable
function DraggablePlayer({
  player,
  isSelected,
  draggedPlayer,
  findPlayerTeam
}: {
  player: Player;
  isSelected: boolean;
  draggedPlayer: Player | null;
  findPlayerTeam: (playerId: string) => string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: player.id,
  });

  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: `player-${player.id}`, // Prefijo para distinguir de equipos
  });

  const style = {
    ...(transform ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : {}),
    touchAction: "none" as const, // Previene scroll en móviles
  };

  // Combinar refs de drag y drop
  const combinedRef = (element: HTMLElement | null) => {
    setNodeRef(element);
    setDropRef(element);
  };

  // Verificar si el jugador actualmente arrastrado viene de "available"
  const isDraggedFromAvailable = draggedPlayer && findPlayerTeam(draggedPlayer.id) === "available";
  
  // Solo mostrar indicador de intercambio si el jugador arrastrado NO viene de "available"
  const showSwapIndicator = isOver && !isDragging && !isDraggedFromAvailable;

  return (
    <button
      ref={combinedRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        w-full p-3 rounded-lg text-sm transition-all h-[45px] flex items-center justify-center
        ${isDragging ? "opacity-50 z-50" : ""}
        ${isSelected ? "bg-green-600" : "bg-gray-700 hover:bg-gray-600"}
        ${showSwapIndicator ? "ring-2 ring-yellow-400 bg-yellow-600" : ""}
        ${isOver && !isDragging && isDraggedFromAvailable ? "ring-2 ring-blue-400 bg-blue-600" : ""}
        cursor-grab active:cursor-grabbing
        touch-none select-none
      `}
    >
      {player.name}
    </button>
  );
}

// Componente para área de drop
function DroppableTeam({
  id,
  children,
  title,
  playerCount,
  rating,
  isOverflow
}: {
  id: string;
  children: React.ReactNode;
  title: string;
  playerCount: number;
  rating: number;
  isOverflow: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        bg-gray-900 rounded-lg p-4 min-h-[300px] transition-all duration-200
        ${isOver ? "ring-2 ring-blue-500 bg-gray-800" : ""}
        ${isOverflow ? "ring-2 ring-red-500" : "border-2 border-transparent"}
      `}
    >
      <div className="flex flex-col justify-between items-center mb-4">
        <h3 className="text-lg font-bold">{title}</h3>
        <div className={`text-sm ${isOverflow ? "text-red-400" : "text-gray-400"}`}>
          ({playerCount}/5)
        </div>
      </div>
      <div className="space-y-2 mb-3">
        {children}
      </div>
      <div className="border-t border-gray-700 pt-2">
        <div className="text-center flex-col flex">
          <span className="text-xs text-gray-400">Rating: </span>
          <span className="text-sm font-bold text-blue-400">
            {rating}
          </span>
        </div>
      </div>
    </div>
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
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playerRatings, setPlayerRatings] = useState<{ [playerId: string]: number }>({});
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
  const [mounted, setMounted] = useState(false);
  const { setTeams: setGlobalTeams, selectedPlayers } = useGameStore();
  const router = useRouter();
  const notify = (message: string) => toast(message);

  // Sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Mínimo 8px de movimiento antes de iniciar drag
      },
    }),
    useSensor(KeyboardSensor)
  );

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
      const playerStats = await api.players.getPlayerStatsByIds(playerIds);

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

  // Manejar inicio de drag
  const handleDragStart = (event: DragStartEvent) => {
    const playerId = event.active.id as string;
    const player = Object.values(teams).flat().find(p => p.id === playerId);
    setDraggedPlayer(player || null);
  };

  // Manejar fin de drag
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedPlayer(null);

    if (!over) return;

    const draggedPlayerId = active.id as string;
    const overId = over.id as string;
    const sourceTeam = findPlayerTeam(draggedPlayerId);

    // Verificar si se está soltando sobre otro jugador (intercambio)
    if (overId.startsWith('player-')) {
      const targetPlayerId = overId.replace('player-', '');
      const targetTeam = findPlayerTeam(targetPlayerId);

      if (draggedPlayerId === targetPlayerId || sourceTeam === "" || targetTeam === "") return;

      // Si el jugador viene de "available", no permitir intercambio
      // En su lugar, agregarlo al equipo del jugador objetivo
      if (sourceTeam === "available") {
        // Verificar límite de jugadores en el equipo objetivo (máximo 5)
        if (targetTeam !== "available" && teams[targetTeam].length >= 5) {
          toast.warning("El equipo ya tiene 5 jugadores");
          return;
        }

        // Mover jugador al equipo (no intercambio)
        setTeams((prev) => {
          const newTeams = { ...prev };

          // Encontrar jugador de disponibles
          const draggedPlayer = newTeams[sourceTeam].find(p => p.id === draggedPlayerId);
          if (!draggedPlayer) return prev;

          // Remover de disponibles y agregar al equipo objetivo
          newTeams[sourceTeam] = newTeams[sourceTeam].filter(p => p.id !== draggedPlayerId);
          newTeams[targetTeam] = [...newTeams[targetTeam], draggedPlayer];

          return newTeams;
        });

        setSelectedPlayer(null);
        return;
      }

      // Intercambiar jugadores (solo si ambos están en equipos)
      setTeams((prev) => {
        const newTeams = { ...prev };
        
        // Encontrar ambos jugadores y sus índices
        const draggedPlayerIndex = newTeams[sourceTeam].findIndex(p => p.id === draggedPlayerId);
        const targetPlayerIndex = newTeams[targetTeam].findIndex(p => p.id === targetPlayerId);
        const draggedPlayer = newTeams[sourceTeam][draggedPlayerIndex];
        const targetPlayer = newTeams[targetTeam][targetPlayerIndex];
        
        if (!draggedPlayer || !targetPlayer || draggedPlayerIndex === -1 || targetPlayerIndex === -1) return prev;

        // Si son del mismo equipo, intercambiar posiciones dentro del mismo equipo
        if (sourceTeam === targetTeam) {
          // Intercambio dentro del mismo equipo
          newTeams[sourceTeam][draggedPlayerIndex] = targetPlayer;
          newTeams[sourceTeam][targetPlayerIndex] = draggedPlayer;
        } else {
          // Intercambio entre equipos diferentes - mantener posiciones exactas
          newTeams[sourceTeam][draggedPlayerIndex] = targetPlayer;
          newTeams[targetTeam][targetPlayerIndex] = draggedPlayer;
        }

        return newTeams;
      });

      setSelectedPlayer(null);
      return;
    }

    // Lógica original para mover a equipos
    const targetTeam = overId;

    if (sourceTeam === targetTeam) return;

    // Verificar límite de jugadores en equipos (máximo 5)
    if (targetTeam !== "available" && teams[targetTeam].length >= 5) {
      toast.warning("El equipo ya tiene 5 jugadores");
      return;
    }

    // Mover jugador
    setTeams((prev) => {
      const newTeams = { ...prev };

      // Encontrar y remover jugador del equipo actual
      const player = newTeams[sourceTeam].find(p => p.id === draggedPlayerId);
      if (!player) return prev;

      newTeams[sourceTeam] = newTeams[sourceTeam].filter(p => p.id !== draggedPlayerId);

      // Agregar jugador al nuevo equipo
      newTeams[targetTeam] = [...newTeams[targetTeam], player];

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
      const playerStats = await api.players.getPlayerStatsByIds(playerIds);

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

  // No renderizar drag and drop hasta que esté mounted
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
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6">
          {teams.available.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Jugadores Disponibles</h3>
                <button
                  onClick={handleRandomTeams}
                  className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg"
                  title="Armar equipos aleatorios"
                >
                  🎲 Random
                </button>
              </div>
              <AvailablePlayersDropZone>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 justify-items-center">
                  {teams.available.map((player) => (
                    <DraggablePlayerCircle
                      key={player.id}
                      player={player}
                      isSelected={selectedPlayer?.id === player.id}
                    />
                  ))}
                </div>
              </AvailablePlayersDropZone>
            </div>
          )}

        <div className="grid grid-cols-3 gap-4">
          {["team1", "team2", "team3"].map((teamId, index) => (
            <div key={teamId} className="flex flex-col">
              <DroppableTeam
                id={teamId}
                title={getColorByTeam(`Equipo ${index + 1}` as "Equipo 1" | "Equipo 2" | "Equipo 3")}
                playerCount={teams[teamId].length}
                rating={calculateTeamRating(teams[teamId])}
                isOverflow={teams[teamId].length > 5}
              >
                {teams[teamId].map((player) => (
                  <DraggablePlayer
                    key={player.id}
                    player={player}
                    isSelected={selectedPlayer?.id === player.id}
                    draggedPlayer={draggedPlayer}
                    findPlayerTeam={findPlayerTeam}
                  />
                ))}
              </DroppableTeam>
            </div>
          ))}
        </div>

          <button
            onClick={handleSuggestTeamsByStats}
            className="w-full py-3 rounded-lg font-bold bg-blue-600 hover:bg-blue-700"
          >
            🎯 Balancear con IA
          </button>
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

        <DragOverlay
          dropAnimation={{
            duration: 250,
            easing: 'ease',
          }}
        >
          {draggedPlayer ? (
            <div
              className="bg-green-600 rounded-full w-24 h-24 flex items-center justify-center text-xs font-bold opacity-90 shadow-lg border-2 border-white px-2"
              style={{
                transform: 'translate(-50%, -50%)', // Centra el círculo en el punto de drag
              }}
            >
              <span className="text-center leading-tight text-white break-words max-w-full">
                {draggedPlayer.name}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
