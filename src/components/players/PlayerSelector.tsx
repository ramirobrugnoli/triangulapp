"use client";

import { Player } from "@/types";
import { useEffect, useState, useCallback } from "react";
import { playerService } from "@/lib/api";
import { useGameStore } from "@/store/gameStore";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";

export function PlayerSelector() {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { updateAvailablePlayers } = useGameStore();
  const router = useRouter();

  const MAX_PLAYERS = 15;



  // Efecto para marcar el componente como montado
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return; // No ejecutar en el servidor
    
    const fetchPlayers = async () => {
      try {
        const players = await playerService.getSimplePlayers();
        setAllPlayers(players); // Ya vienen ordenados por nombre desde el endpoint
      } catch (error) {
        console.error("Error:", error);
        // Usar toast directamente para evitar problemas de render
        setTimeout(() => {
          toast.error("Error al cargar los jugadores", {
            toastId: "load-players-error",
            autoClose: 3000,
          });
        }, 0);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [isMounted]);

  const handlePlayerToggle = useCallback((player: Player) => {
    setSelectedPlayers(prev => {
      if (prev.some((p) => p.id === player.id)) {
        // Si ya está seleccionado, lo quitamos
        return prev.filter((p) => p.id !== player.id);
      } else {
        // Si no está seleccionado y no hemos llegado al máximo, lo agregamos
        if (prev.length < MAX_PLAYERS) {
          return [...prev, player];
        } else {
          // Mostrar toast de límite alcanzado
          setTimeout(() => {
            const message = `Solo puedes seleccionar ${MAX_PLAYERS} jugadores`;
            if (toast.isActive("max-players-warning")) {
              toast.update("max-players-warning", {
                render: message,
                type: "warning",
                autoClose: 3000,
              });
            } else {
              toast.warning(message, {
                toastId: "max-players-warning",
                autoClose: 3000,
              });
            }
          }, 0);
          return prev;
        }
      }
    });
  }, [MAX_PLAYERS]);

  const handleConfirm = useCallback(() => {
    if (selectedPlayers.length < 6) {
      setTimeout(() => {
        toast.error("Debes seleccionar al menos 6 jugadores", {
          toastId: "min-players-error",
          autoClose: 3000,
        });
      }, 0);
      return;
    }

    setSubmitting(true);
    try {
      // Guardamos los jugadores seleccionados en el store
      updateAvailablePlayers(selectedPlayers);
      setTimeout(() => {
        toast.success("Jugadores seleccionados correctamente", {
          toastId: "players-selected-success",
          autoClose: 3000,
        });
      }, 0);

      // Redirigimos a la pantalla de armado de equipos
      setTimeout(() => {
        router.push("/armador");
      }, 1000);
    } catch (error) {
      console.error("Error:", error);
      setTimeout(() => {
        toast.error("Error al guardar los jugadores seleccionados", {
          toastId: "save-players-error",
          autoClose: 3000,
        });
      }, 0);
    } finally {
      setSubmitting(false);
    }
  }, [selectedPlayers, updateAvailablePlayers, router]);

  // Mostrar loading mientras no esté montado o esté cargando
  if (!isMounted || loading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <>
      {isMounted && (
        <ToastContainer
          autoClose={3000}
          position="top-right"
          theme="dark"
          closeOnClick={true}
        />
      )}

      <div className="space-y-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              Seleccionar Jugadores ({selectedPlayers.length}/{MAX_PLAYERS})
            </h2>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {allPlayers.map((player) => {
              const isSelected = selectedPlayers.some((p) => p.id === player.id);
              return (
                <button
                  key={player.id}
                  onClick={() => handlePlayerToggle(player)}
                  className={`
                    w-full p-2 rounded-lg text-sm transition-colors h-12
                    ${
                      isSelected
                        ? "bg-green-600 hover:bg-green-600"
                        : "bg-gray-700 hover:bg-gray-600"
                    }
                  `}
                >
                  {player.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-4">
            Jugadores Seleccionados ({selectedPlayers.length})
          </h3>
          {selectedPlayers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedPlayers.map((player) => (
                <span
                  key={player.id}
                  className="inline-flex items-center bg-green-600 px-3 py-1 rounded-full text-sm"
                >
                  {player.name}
                  <button
                    className="ml-2 text-white hover:text-red-300"
                    onClick={() => handlePlayerToggle(player)}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">Ningún jugador seleccionado</p>
          )}
        </div>

        <button
          onClick={handleConfirm}
          disabled={submitting || selectedPlayers.length < 6}
          className={`
            w-full py-3 rounded-lg font-bold
            ${
              submitting || selectedPlayers.length < 6
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }
          `}
        >
          {submitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Guardando...
            </div>
          ) : (
            "Confirmar Jugadores"
          )}
        </button>
      </div>
    </>
  );
}
