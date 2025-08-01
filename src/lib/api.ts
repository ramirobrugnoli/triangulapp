// lib/api.ts
import { Player, TriangularHistory, Team, TriangularResult, PlayerTriangularHistory } from "@/types";

export interface Season {
  id: string;
  name: string;
  initSeasonDate: string;
  finishSeasonDate: string | null;
  createdAt: string;
  triangularCount?: number;
}

// En desarrollo, Next.js maneja automáticamente las rutas relativas
const API_BASE = "/api";

export const playerService = {
  async getAllPlayers(seasonId?: string, allSeasons = false): Promise<Player[]> {
    try {
      const params = new URLSearchParams();
      if (seasonId) params.append('seasonId', seasonId);
      if (allSeasons) params.append('allSeasons', 'true');
      
      const url = `${API_BASE}/players${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    } catch (error) {
      console.error("Error fetching players:", error);
      throw error;
    }
  },

  async getSimplePlayers(): Promise<Player[]> {
    try {
      const response = await fetch(`${API_BASE}/players/simple`);
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    } catch (error) {
      console.error("Error fetching simple players:", error);
      throw error;
    }
  },
  
  async getPlayerStatsByIds(playerIds: string[], seasonId?: string, allSeasons = false): Promise<Player[]> {
    try {
      const params = new URLSearchParams();
      if (seasonId) params.append('seasonId', seasonId);
      if (allSeasons) params.append('allSeasons', 'true');
      
      const url = `${API_BASE}/players/stats${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(url, {
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

  async getPlayerTriangulars(playerId: string, seasonId?: string, allSeasons = false): Promise<PlayerTriangularHistory[]> {
    try {
      const params = new URLSearchParams();
      if (seasonId) params.append('seasonId', seasonId);
      if (allSeasons) params.append('allSeasons', 'true');
      
      const url = `${API_BASE}/players/${playerId}/triangulars${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
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

  async getTriangularHistory(seasonId?: string, allSeasons = false): Promise<TriangularHistory[]> {
    try {
      const params = new URLSearchParams();
      if (seasonId) params.append('seasonId', seasonId);
      if (allSeasons) params.append('allSeasons', 'true');
      
      const url = `${API_BASE}/triangular/history${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    } catch (error) {
      console.error("Error fetching triangular history:", error);
      throw error;
    }
  },

  async getAllTriangulars(seasonId?: string, allSeasons = false): Promise<TriangularHistory[]> {
    try {
      const params = new URLSearchParams();
      if (seasonId) params.append('seasonId', seasonId);
      if (allSeasons) params.append('allSeasons', 'true');
      
      const url = `${API_BASE}/triangular${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    } catch (error) {
      console.error("Error fetching all triangulars:", error);
      throw error;
    }
  },

  async getTriangularById(id: string): Promise<TriangularHistory> {
    try {
      const response = await fetch(`${API_BASE}/triangular/${id}`);
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    } catch (error) {
      console.error("Error fetching triangular:", error);
      throw error;
    }
  },

  async updateTriangular(id: string, updateData: { champion?: string; date?: string }): Promise<TriangularHistory> {
    try {
      const response = await fetch(`${API_BASE}/triangular/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Error desconocido" }));
        throw new Error(errorData.message || "Error al actualizar el triangular");
      }

      return response.json();
    } catch (error) {
      console.error("Error updating triangular:", error);
      throw error;
    }
  },

  async deleteTriangular(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/triangular/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Error desconocido" }));
        throw new Error(errorData.message || "Error al eliminar el triangular");
      }
    } catch (error) {
      console.error("Error deleting triangular:", error);
      throw error;
    }
  },

  async updateTriangularTeamsAndScorers(id: string, teams: { [team in Team]: { id: string; name: string }[] }, scorers: { [playerId: string]: { goals: number; team: Team } }): Promise<TriangularHistory> {
    try {
      const response = await fetch(`${API_BASE}/triangular/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teams, scorers }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Error desconocido" }));
        throw new Error(errorData.message || "Error al actualizar equipos y scorers");
      }
      return response.json();
    } catch (error) {
      console.error("Error updating teams and scorers:", error);
      throw error;
    }
  },
};

export const seasonService = {
  async getAllSeasons(): Promise<Season[]> {
    try {
      const response = await fetch(`${API_BASE}/seasons`);
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    } catch (error) {
      console.error("Error fetching seasons:", error);
      throw error;
    }
  },

  async getActiveSeason(): Promise<Season | null> {
    try {
      const response = await fetch(`${API_BASE}/seasons/active`);
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    } catch (error) {
      console.error("Error fetching active season:", error);
      throw error;
    }
  },

  async createSeason(data: { name: string; initSeasonDate?: string }): Promise<Season> {
    try {
      const response = await fetch(`${API_BASE}/seasons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Error desconocido" }));
        throw new Error(errorData.message || "Error al crear temporada");
      }

      return response.json();
    } catch (error) {
      console.error("Error creating season:", error);
      throw error;
    }
  },

  async moveTriangularToSeason(triangularId: string, seasonId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/triangular/${triangularId}/season`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ seasonId }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Error desconocido" }));
        throw new Error(errorData.message || "Error al mover triangular");
      }
    } catch (error) {
      console.error("Error moving triangular to season:", error);
      throw error;
    }
  },

  async updateSeasonName(seasonId: string, name: string): Promise<Season> {
    try {
      const response = await fetch(`${API_BASE}/seasons/${seasonId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Error desconocido" }));
        throw new Error(errorData.message || "Error al actualizar nombre de temporada");
      }

      return response.json();
    } catch (error) {
      console.error("Error updating season name:", error);
      throw error;
    }
  },
};

// Exportamos un objeto que agrupa todos los servicios
export const api = {
  players: playerService,
  triangular: triangularService,
  seasons: seasonService,
};
