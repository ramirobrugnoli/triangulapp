// Guarda este archivo como: components/PlayerSelector.tsx
"use client";

import { Player } from "@/types";
import { useEffect, useState } from "react";
import { playerService } from "@/lib/api";
import { useGameStore } from "@/store/gameStore";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";

export function PlayerSelector() {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { updateAvailablePlayers } = useGameStore();
  const router = useRouter();

  const MAX_PLAYERS = 15;

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const data = await playerService.getAllPlayers();
        setAllPlayers(data);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error al cargar los jugadores");
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const handlePlayerToggle = (player: Player) => {
    if (selectedPlayers.some((p) => p.id === player.id)) {
      // Si ya está seleccionado, lo quitamos
      setSelectedPlayers(selectedPlayers.filter((p) => p.id !== player.id));
    } else {
      // Si no está seleccionado y no hemos llegado al máximo, lo agregamos
      if (selectedPlayers.length < MAX_PLAYERS) {
        setSelectedPlayers([...selectedPlayers, player]);
      } else {
        toast.warning(`Solo puedes seleccionar ${MAX_PLAYERS} jugadores`);
      }
    }
  };

  const handleConfirm = () => {
    if (selectedPlayers.length < 6) {
      toast.error("Debes seleccionar al menos 6 jugadores");
      return;
    }

    setSubmitting(true);
    try {
      // Guardamos los jugadores seleccionados en el store
      updateAvailablePlayers(selectedPlayers);
      toast.success("Jugadores seleccionados correctamente");

      // Redirigimos a la pantalla de armado de equipos
      setTimeout(() => {
        router.push("/armador");
      }, 1000);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al guardar los jugadores seleccionados");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
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
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              Seleccionar Jugadores ({selectedPlayers.length}/{MAX_PLAYERS})
            </h2>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {allPlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => handlePlayerToggle(player)}
                className={`
                  w-full p-2 rounded-lg text-sm transition-colors
                  ${
                    selectedPlayers.some((p) => p.id === player.id)
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-700 hover:bg-gray-600"
                  }
                `}
              >
                {player.name}
              </button>
            ))}
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
