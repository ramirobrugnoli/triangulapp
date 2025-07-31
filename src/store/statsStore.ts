import { create } from "zustand";
import { Player, TriangularHistory } from "@/types";
import { api } from "@/lib/api";
// import { mockPlayers, mockTriangularStats } from "@/store/mocks/stats";
import { StatMetric } from "@/types/stats";

export interface PlayerTriangularPoints {
  id: string;
  name: string;
  triangularWins: number;    // primer lugar (5 pts)
  triangularSeconds: number; // segundo lugar (2 pts)
  triangularThirds: number;  // tercer lugar (1 pt)
  totalPoints: number;       // total calculado
  triangularsPlayed: number; // total de triangulares jugados
}

interface StatsState {
  // Data
  players: Player[];
  triangularHistory: TriangularHistory[];
  
  // Season filtering
  currentSeasonId: string | null;
  allSeasons: boolean;
  
  // UI state for charts
  highlightedPlayers: {
    goals: string | null;
    wins: string | null;
    normalWins: string | null;
    triangularPoints: string | null;
  };
  playersToShow: {
    goals: number;
    wins: number;
    normalWins: number;
    triangularPoints: number;
  };
  
  // Loading and error states
  loading: boolean;
  error: string | null;
  
  // Actions    
  fetchStats: (seasonId?: string, allSeasons?: boolean) => Promise<void>;
  setSeasonFilter: (seasonId: string | null, allSeasons: boolean) => void;
  handlePlayerHighlight: (metric: StatMetric, playerName: string) => void;
  handlePlayersToShowChange: (metric: StatMetric, value: number) => void;
  
  // Cached triangular points data
  triangularPointsTable: PlayerTriangularPoints[];
  calculateTriangularPointsTable: () => void;
}

export const useStatsStore = create<StatsState>((set, get) => ({
  // Initial state
  players: [],
  triangularHistory: [],
  currentSeasonId: null,
  allSeasons: false,
  loading: false,
  error: null,
  highlightedPlayers: {
    goals: null,
    wins: null,
    normalWins: null,
    triangularPoints: null,
  },
  playersToShow: {
    goals: 15,
    wins: 15,
    normalWins: 15,
    triangularPoints: 15,
  },
  triangularPointsTable: [],
  
  // Actions
  fetchStats: async (seasonId?: string, allSeasons = false) => {
    const currentState = get();
    
    // Determine if we need to refetch based on season filter changes
    const seasonChanged = currentState.currentSeasonId !== (seasonId || null) || 
                         currentState.allSeasons !== allSeasons;
    
    // Don't fetch if we already have data and season hasn't changed
    if (currentState.players.length > 0 && !currentState.loading && !seasonChanged) {
      return;
    }
    
    try {
      set({ 
        loading: true, 
        error: null,
        currentSeasonId: seasonId || null,
        allSeasons
      });
      
      // Fetch real data with season filtering
      const [playersData, historyData] = await Promise.all([
        api.players.getAllPlayers(seasonId, allSeasons),
        api.triangular.getTriangularHistory(seasonId, allSeasons),
      ]);
      
      set({ 
        players: playersData,
        triangularHistory: historyData,
        loading: false 
      });
      
      // Calculate triangular points after data is loaded
      get().calculateTriangularPointsTable();
    } catch (error) {
      console.error("Error loading stats data:", error);
      set({ 
        error: "Error al cargar los datos. Por favor, intenta nuevamente.",
        loading: false 
      });
    }
  },

  setSeasonFilter: (seasonId: string | null, allSeasons: boolean) => {
    const currentState = get();
    
    // Only update if the filter actually changed
    if (currentState.currentSeasonId !== seasonId || currentState.allSeasons !== allSeasons) {
      set({
        currentSeasonId: seasonId,
        allSeasons,
        // Clear existing data to force refetch
        players: [],
        triangularHistory: [],
        triangularPointsTable: []
      });
      
      // Fetch new data with the updated filters
      get().fetchStats(seasonId || undefined, allSeasons);
    }
  },
  
  handlePlayerHighlight: (metric, playerName) => {
    set(state => ({
      highlightedPlayers: {
        ...state.highlightedPlayers,
        [metric]: state.highlightedPlayers[metric as keyof typeof state.highlightedPlayers] === playerName ? null : playerName,
      }
    }));
  },
  
  handlePlayersToShowChange: (metric, value) => {
    set(state => ({
      playersToShow: {
        ...state.playersToShow,
        [metric]: value
      }
    }));
  },
  
  // Calculate and cache triangular points table
  calculateTriangularPointsTable: () => {
    const { players, triangularHistory } = get();
    
    // Inicializamos el mapa de puntos por jugador
    const playerPointsMap: Record<string, PlayerTriangularPoints> = {};
    
    // Inicializamos todos los jugadores con valores en cero
    players.forEach((player) => {
      playerPointsMap[player.id] = {
        id: player.id,
        name: player.name,
        triangularWins: 0,
        triangularSeconds: 0,
        triangularThirds: 0,
        totalPoints: 0,
        triangularsPlayed: 0,
      };
    });
    
    // Procesamos cada triangular para calcular los puntos
    triangularHistory.forEach((triangular) => {
      // Identificamos los equipos por posición
      const firstTeam = triangular.teams.find((team) => team.position === 1);
      const secondTeam = triangular.teams.find((team) => team.position === 2);
      const thirdTeam = triangular.teams.find((team) => team.position === 3);
      
      // Para cada jugador, verificamos su participación en este triangular
      players.forEach((player) => {
        const playerPointsEntry = playerPointsMap[player.id];
        
        // Buscamos en qué equipo jugó el jugador
        const scorerEntry = triangular.scorers.find(
          (scorer) => scorer.name === player.name
        );
        
        // Si no encontramos al jugador entre los goleadores, no podemos determinar su participación
        if (!scorerEntry) return;
        
        const playerTeam = scorerEntry.team;
        
        // Asignamos puntos según la posición del equipo
        if (playerTeam === firstTeam?.name) {
          playerPointsEntry.triangularWins += 1;
          playerPointsEntry.totalPoints += 5;
          playerPointsEntry.triangularsPlayed += 1;
        } else if (playerTeam === secondTeam?.name) {
          playerPointsEntry.triangularSeconds += 1;
          playerPointsEntry.totalPoints += 2;
          playerPointsEntry.triangularsPlayed += 1;
        } else if (playerTeam === thirdTeam?.name) {
          playerPointsEntry.triangularThirds += 1;
          playerPointsEntry.totalPoints += 1;
          playerPointsEntry.triangularsPlayed += 1;
        }
      });
    });
    
    // Convertimos el mapa a un arreglo, ordenamos por puntos y filtramos jugadores sin participación
    const triangularPointsTable = Object.values(playerPointsMap)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .filter((player) => player.triangularsPlayed > 0);
    
    set({ triangularPointsTable });
  }
})); 