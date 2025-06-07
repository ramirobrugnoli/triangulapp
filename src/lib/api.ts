// lib/api.ts
import { Player, TriangularHistory, TriangularResult, PlayerTriangularHistory } from "@/types";

// En desarrollo, Next.js maneja automáticamente las rutas relativas
const API_BASE = "/api";

export const playerService = {
  async getAllPlayers(): Promise<Player[]> {
    try {
      const response = await fetch(`${API_BASE}/players`);
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    } catch (error) {
      console.error("Error fetching players:", error);
      throw error;
    }
  },
  
  async getPlayerStatsByIds(playerIds: string[]): Promise<Player[]> {
    try {
      const response = await fetch(`${API_BASE}/players/stats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerIds }),
      });
      
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Error desconocido" }));
        throw new Error(errorData.message || "Error al obtener estadísticas de jugadores");
      }
      
      return response.json();
    } catch (error) {
      console.error("Error fetching player statistics:", error);
      throw error;
    }
  },

  async recalculateStats(): Promise<{ success: boolean; message: string; triangularsProcessed: number }> {
    try {
      const response = await fetch(`${API_BASE}/players/recalculate-stats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Error desconocido" }));
        throw new Error(errorData.message || "Error al recalcular estadísticas");
      }
      
      return response.json();
    } catch (error) {
      console.error("Error recalculating player statistics:", error);
      throw error;
    }
  },

  async getPlayerTriangulars(playerId: string): Promise<PlayerTriangularHistory[]> {
    try {
      const response = await fetch(`${API_BASE}/players/${playerId}/triangulars`);
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    } catch (error) {
      console.error("Error fetching player triangulars:", error);
      throw error;
    }
  },
};

export const triangularService = {
  async postTriangularResult(result: TriangularResult): Promise<void> {
    try {
      console.log(
        "Enviando triangular al API:",
        JSON.stringify(result, null, 2)
      );

      const response = await fetch(`${API_BASE}/triangular`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Error desconocido" }));
        throw new Error(errorData.message || "Error al guardar el triangular");
      }
    } catch (error) {
      console.error("Error posting triangular result:", error);
      throw error;
    }
  },

  async getTriangularHistory(): Promise<TriangularHistory[]> {
    try {
      const response = await fetch(`${API_BASE}/triangular/history`);
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    } catch (error) {
      console.error("Error fetching triangular history:", error);
      throw error;
    }
  },
};

// Exportamos un objeto que agrupa todos los servicios
export const api = {
  players: playerService,
  triangular: triangularService,
};
