"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlayerTriangularHistory as PlayerTriangularHistoryType } from "@/types";
import { api } from "@/lib/api";

interface PlayerTriangularHistoryProps {
  playerId: string;
  playerName: string;
}

export function PlayerTriangularHistory({ playerId, playerName }: PlayerTriangularHistoryProps) {
  const router = useRouter();
  const [triangulars, setTriangulars] = useState<PlayerTriangularHistoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTeams, setShowTeams] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchPlayerTriangulars = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.players.getPlayerTriangulars(playerId);
        setTriangulars(data);
      } catch (err) {
        setError("Error al cargar los triangulares del jugador");
        console.error("Error fetching player triangulars:", err);
      } finally {
        setLoading(false);
      }
    };

    if (playerId) {
      fetchPlayerTriangulars();
    }
  }, [playerId]);

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return "text-yellow-400"; // Oro
      case 2: return "text-gray-300";   // Plata
      case 3: return "text-yellow-600"; // Bronce
      default: return "text-gray-400";
    }
  };

  const getPositionText = (position: number) => {
    switch (position) {
      case 1: return "1er Lugar";
      case 2: return "2do Lugar";
      case 3: return "3er Lugar";
      default: return "N/A";
    }
  };

  const handleTriangularClick = (triangularId: string) => {
    // Navegar al historial con el ID del triangular específico
    router.push(`/historial?triangularId=${triangularId}`);
  };

  const toggleShowTeams = (triangularId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Evitar que se active el click del triangular
    setShowTeams(prev => ({
      ...prev,
      [triangularId]: !prev[triangularId]
    }));
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Triangulares Jugados</h3>
        <div className="flex justify-center items-center h-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Triangulares Jugados</h3>
        <div className="text-red-400 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">
        Triangulares Jugados por {playerName}
      </h3>
      
      {triangulars.length === 0 ? (
        <div className="text-gray-400 text-center py-8">
          Este jugador no ha participado en ningún triangular aún.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-gray-400 mb-4">
            Total: {triangulars.length} triangulares
          </div>
          
          <div className="space-y-2">
            {triangulars.map((triangular) => (
              <div
                key={triangular.id}
                onClick={() => handleTriangularClick(triangular.id)}
                className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors border-l-4 border-l-gray-600 hover:border-l-green-500"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`font-bold text-lg ${getPositionColor(triangular.position)}`}>
                      {getPositionText(triangular.position)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(triangular.date).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="text-sm text-gray-300">
                    {triangular.playerTeam}
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-purple-400 font-semibold">{triangular.points}</div>
                    <div className="text-gray-500">Puntos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-semibold">{triangular.wins}</div>
                    <div className="text-gray-500">Victorias</div>
                  </div>
                  <div className="text-center">
                    <div className="text-yellow-400 font-semibold">{triangular.draws}</div>
                    <div className="text-gray-500">Empates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-400 font-semibold">{triangular.goals}</div>
                    <div className="text-gray-500">Goles</div>
                  </div>
                </div>
                
                <div className="mt-3 pt-2 border-t border-gray-600">
                  <div className="flex justify-between items-center text-xs text-gray-400 mb-3">
                    <div>
                      Campeón: <span className="text-yellow-400">{triangular.champion}</span>
                    </div>
                    <span 
                      onClick={(e) => toggleShowTeams(triangular.id, e)}
                      className="text-green-400 hover:text-green-300 cursor-pointer select-none"
                    >
                      {showTeams[triangular.id] ? 'Ocultar Equipos' : 'Mostrar Equipos'}
                    </span>
                  </div>
                  
                  {/* Equipos y jugadores - Solo mostrar si showTeams[triangular.id] es true */}
                  {showTeams[triangular.id] && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {triangular.teams.map((team) => (
                        <div key={team.teamName} className="bg-gray-800 rounded p-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-semibold ${
                              team.teamName === triangular.playerTeam ? 'text-green-400' : 'text-gray-300'
                            }`}>
                              {team.teamName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {team.position}° - {team.points} pts
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-gray-400 mb-1">
                              V: {team.wins} | E: {team.draws} | N: {team.normalWins}
                            </div>
                            <div className="space-y-1">
                              {triangular.teamPlayers && triangular.teamPlayers[team.teamName]?.map((player) => (
                                <div key={player.id} className={`text-xs ${
                                  player.id === playerId ? 'text-yellow-300 font-semibold' : 'text-gray-400'
                                }`}>
                                  {player.name}
                                </div>
                              )) || (
                                <div className="text-xs text-gray-500">Sin jugadores</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 