"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";

export default function AdminPage() {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    triangularsProcessed: number;
  } | null>(null);

  const handleRecalculateStats = async () => {
    if (isRecalculating) return;

    const confirmed = window.confirm(
      "¿Estás seguro de que quieres recalcular todas las estadísticas de jugadores? Esta acción reseteará todas las estadísticas y las recalculará basándose en los triangulares existentes."
    );

    if (!confirmed) return;

    setIsRecalculating(true);
    setLastResult(null);

    try {
      toast.info("Recalculando estadísticas...", { autoClose: false });
      const result = await api.players.recalculateStats();
      
      setLastResult(result);
      toast.dismiss();
      toast.success(result.message);
    } catch (error) {
      toast.dismiss();
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      toast.error(`Error al recalcular estadísticas: ${errorMessage}`);
      console.error("Error recalculando estadísticas:", error);
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-gray-900 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Panel de Administración</h1>
        
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-white mb-4">Recálculo de Estadísticas</h2>
            <p className="text-gray-300 mb-4">
              Esta función recalculará todas las estadísticas de jugadores basándose en los triangulares existentes.
              Esto incluye partidos jugados, victorias, empates, derrotas y goles.
            </p>
            <p className="text-yellow-400 mb-4">
              ⚠️ Esta acción reseteará todas las estadísticas actuales y las recalculará desde cero.
            </p>
            
            <button
              onClick={handleRecalculateStats}
              disabled={isRecalculating}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isRecalculating
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isRecalculating ? "Recalculando..." : "Recalcular Estadísticas"}
            </button>
            
            {lastResult && (
              <div className={`mt-4 p-3 rounded-lg ${
                lastResult.success 
                  ? "bg-green-900 text-green-300 border border-green-700" 
                  : "bg-red-900 text-red-300 border border-red-700"
              }`}>
                <p className="font-medium">
                  {lastResult.success ? "✅ Éxito" : "❌ Error"}
                </p>
                <p>{lastResult.message}</p>
                {lastResult.success && (
                  <p className="text-sm mt-1">
                    Triangulares procesados: {lastResult.triangularsProcessed}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-white mb-4">Información del Sistema</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Cálculo de Partidos:</p>
                <p className="text-white">2 partidos por jugador por triangular</p>
              </div>
              <div>
                <p className="text-gray-400">Fórmula de Derrotas:</p>
                <p className="text-white">Partidos - Victorias - Empates</p>
              </div>
              <div>
                <p className="text-gray-400">Estructura de Triangular:</p>
                <p className="text-white">3 equipos, cada uno juega contra los otros 2</p>
              </div>
              <div>
                <p className="text-gray-400">Actualización:</p>
                <p className="text-white">Todos los jugadores participantes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 