"use client";

import { useState, useEffect } from "react";
import { Player } from "@/types";
import CreatePlayer from "@/components/players/CreatePlayer";

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/players");

      if (!response.ok) {
        throw new Error("Error al obtener jugadores");
      }

      const data = await response.json();
      setPlayers(data);
    } catch (err) {
      console.error("Error:", err);
      setError("Error al cargar los jugadores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Gestión de Jugadores</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold mb-4">Jugadores</h2>

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-900 text-red-200 rounded-lg">
              {error}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-700">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Nombre
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-700">
                  {players.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-4 text-center text-gray-400"
                      >
                        No hay jugadores registrados
                      </td>
                    </tr>
                  ) : (
                    players.map((player) => (
                      <tr key={player.id} className="hover:bg-gray-800">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-100">
                          {player.name}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <CreatePlayer onPlayerAdded={fetchPlayers} />
        </div>
      </div>
    </div>
  );
}
