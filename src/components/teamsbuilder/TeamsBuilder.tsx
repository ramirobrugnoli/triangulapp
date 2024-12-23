"use client";

import { DragEndEvent, DragOverEvent, Player } from "@/types";
import { useEffect, useState } from "react";
import { playerService } from "@/lib/api";
import { useGameStore } from "@/store/gameStore";
import {
  DndContext,
  closestCorners,
  DragOverlay,
  useSensors,
  useSensor,
  PointerSensor,
  TouchSensor,
} from "@dnd-kit/core";
import { DroppableContainer } from "./DroppableContainer";
import { arrayMove } from "@dnd-kit/sortable";

interface TeamBuilderState {
  available: Player[];
  team1: Player[];
  team2: Player[];
  team3: Player[];
}

export function TeamsBuilder() {
  const [teams, setTeams] = useState<TeamBuilderState>({
    available: [],
    team1: [],
    team2: [],
    team3: [],
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { setTeams: setGlobalTeams } = useGameStore();

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

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

  const handleDragOver = ({ over, active }: DragOverEvent) => {
    const overId = over?.id;
    if (!overId) return;

    const activeContainer = active.data.current.sortable.containerId;
    const overContainer = over?.data?.current?.sortable?.containerId || over.id;

    if (activeContainer !== overContainer) {
      setTeams((prev: TeamBuilderState) => {
        const activeItems = prev[activeContainer as keyof TeamBuilderState];
        const overItems = prev[overContainer as keyof TeamBuilderState] || [];
        const activeIndex = activeItems.findIndex(
          (item) => item.id === active.id
        );
        const activeItem = activeItems[activeIndex];

        return {
          ...prev,
          [activeContainer]: activeItems.filter(
            (item) => item.id !== active.id
          ),
          [overContainer]: [...overItems, activeItem],
        };
      });
    }
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;

    const activeContainer = active.data.current.sortable.containerId;
    const overContainer = over?.data?.current?.sortable?.containerId || over.id;

    if (activeContainer === overContainer) {
      const items = teams[activeContainer as keyof TeamBuilderState];
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setTeams((prev: TeamBuilderState) => ({
          ...prev,
          [activeContainer]: arrayMove(items, oldIndex, newIndex),
        }));
      }
    }
  };

  if (loading) {
    return (
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragStart={({ active }) => setActiveId(active.id)}
    >
      <div className="space-y-6">
        <DroppableContainer
          id="available"
          items={teams.available}
          title="Jugadores Disponibles"
          className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto"
          itemClassName="w-full px-3 py-2 text-center" // Nuevo prop para estilo de items
        />

        <div className="grid grid-cols-3 gap-4">
          <DroppableContainer
            id="team1"
            items={teams.team1}
            title="Equipo 1"
            className="min-h-[150px]"
            itemClassName="w-full px-3 py-2 text-center" // Nuevo prop para estilo de items
          />
          <DroppableContainer
            id="team2"
            items={teams.team2}
            title="Equipo 2"
            className="min-h-[150px]"
            itemClassName="w-full px-3 py-2 text-center" // Nuevo prop para estilo de items
          />
          <DroppableContainer
            id="team3"
            items={teams.team3}
            title="Equipo 3"
            className="min-h-[150px]"
            itemClassName="w-full px-3 py-2 text-center" // Nuevo prop para estilo de items
          />
        </div>

        <button
          onClick={() =>
            setGlobalTeams({
              teamA: teams.team1[0]?.name || "Equipo 1",
              teamB: teams.team2[0]?.name || "Equipo 2",
              waiting: teams.team3[0]?.name || "Equipo 3",
            })
          }
          className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg"
        >
          Confirmar Equipos
        </button>
      </div>

      <DragOverlay>
        {activeId && (
          <div className="p-2 bg-gray-700 rounded border-2 border-green-500 text-center min-w-[100px]">
            {teams.available.find((p) => p.id === activeId)?.name}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
