// lib/api.ts
import { Player, TriangularResult } from "@/types";

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

  async getTriangularHistory() {
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
