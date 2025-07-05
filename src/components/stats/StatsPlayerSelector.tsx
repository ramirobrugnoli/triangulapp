"use client";

import { Player } from "@/types";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface StatsPlayerSelectorProps {
  players: Player[];
  selectedPlayer: Player | null;
  onPlayerSelect: (player: Player) => void;
  loading?: boolean;
}

export function PlayerSelector({ players, selectedPlayer, onPlayerSelect, loading }: StatsPlayerSelectorProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ordenar jugadores alfabéticamente
  const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));

  const handlePlayerSelect = (player: Player) => {
    onPlayerSelect(player);
    setIsDrawerOpen(false);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (players.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-4">
        <p className="text-gray-400">No hay jugadores disponibles</p>
      </div>
    );
  }

  const drawerContent = (
    <>
      {/* Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={`
        fixed top-0 right-0 h-full w-80 bg-gray-900 shadow-lg transform transition-transform duration-300 ease-in-out z-50
        ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Seleccionar Jugador</h3>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto h-full pb-20">
          <div className="p-4 space-y-2">
            {sortedPlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => handlePlayerSelect(player)}
                className={`
                  w-full p-3 rounded-lg text-left transition-all
                  ${selectedPlayer?.id === player.id 
                    ? "bg-green-600 text-white" 
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }
                `}
              >
                <div className="font-medium">{player.name}</div>
                <div className="text-sm opacity-75 mt-1">
                  <div className="flex flex-wrap gap-2">
                    <span>{player.stats.matches} partidos</span>
                    <span>•</span>
                    <span>{player.stats.goals} goles</span>
                    <span>•</span>
                    <span className="text-green-400">{player.stats.wins}V</span>
                    <span className="text-gray-400">{player.stats.draws}E</span>
                    <span className="text-red-400">{player.stats.losses}D</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-purple-400">{player.stats.points} pts</span>
                    {player.stats.winPercentage !== undefined && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400">{player.stats.winPercentage.toFixed(1)}%</span>
                      </>
                    )}
                    {player.stats.triangularsPlayed !== undefined && player.stats.triangularsPlayed > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-indigo-400">{player.stats.triangularsPlayed}T</span>
                        {player.stats.triangularPoints !== undefined && (
                          <span className="text-yellow-400">({player.stats.triangularPoints}pts)</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold">Jugador Seleccionado</h2>
            {selectedPlayer && (
              <p className="text-gray-400 mt-1">{selectedPlayer.name}</p>
            )}
          </div>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Seleccionar Jugador
          </button>
        </div>
        
        {selectedPlayer && (
          <div className="mt-4 p-3 bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-green-400">{selectedPlayer.name}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3 text-sm">
              {/* 1. Triangulares */}
              {selectedPlayer.stats.triangularsPlayed !== undefined && (
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs">Triangulares</span>
                  <span className="font-bold text-indigo-400">{selectedPlayer.stats.triangularsPlayed}</span>
                </div>
              )}
              
              {/* 2. T. Ganados */}
              {selectedPlayer.stats.triangularWins !== undefined && (
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs">T. Ganados</span>
                  <span className="font-bold text-green-500">{selectedPlayer.stats.triangularWins}</span>
                </div>
              )}
              
              {/* 3. Puntos */}
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs">Puntos</span>
                <span className="font-bold text-purple-400">{selectedPlayer.stats.points}</span>
              </div>
              
              {/* 5. Partidos */}
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs">Partidos</span>
                <span className="font-bold text-blue-400">{selectedPlayer.stats.matches}</span>
              </div>
              
              {/* 6. Victorias */}
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs">Victorias</span>
                <span className="font-bold text-green-400">{selectedPlayer.stats.wins}</span>
              </div>
              
              {/* 7. Empates */}
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs">Empates</span>
                <span className="font-bold text-gray-400">{selectedPlayer.stats.draws}</span>
              </div>
              
              {/* 8. Derrotas */}
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs">Derrotas</span>
                <span className="font-bold text-red-400">{selectedPlayer.stats.losses}</span>
              </div>
              
              {/* 9. Goles */}
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs">Goles</span>
                <span className="font-bold text-yellow-400">{selectedPlayer.stats.goals}</span>
              </div>
              
              {/* El resto de estadísticas */}
              {selectedPlayer.stats.normalWins !== undefined && (
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs">V. Normales</span>
                  <span className="font-bold text-teal-400">{selectedPlayer.stats.normalWins}</span>
                </div>
              )}
              
              {selectedPlayer.stats.triangularSeconds !== undefined && (
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs">T. Segundos</span>
                  <span className="font-bold text-blue-400">{selectedPlayer.stats.triangularSeconds}</span>
                </div>
              )}
              
              {selectedPlayer.stats.triangularThirds !== undefined && (
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs">T. Terceros</span>
                  <span className="font-bold text-orange-400">{selectedPlayer.stats.triangularThirds}</span>
                </div>
              )}
              
              {selectedPlayer.stats.triangularPoints !== undefined && (
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs">Pts Triangular</span>
                  <span className="font-bold text-yellow-400">{selectedPlayer.stats.triangularPoints}</span>
                </div>
              )}
              
              {selectedPlayer.stats.triangularWinPercentage !== undefined && (
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs">% T. Ganados</span>
                  <span className="font-bold text-emerald-500">{selectedPlayer.stats.triangularWinPercentage.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {mounted && createPortal(drawerContent, document.querySelector('main') || document.body)}
    </>
  );
} 