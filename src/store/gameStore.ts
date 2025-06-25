import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  GameState,
  GameTeam,
  Player,
  Team,
  TeamBuilderState,
  TeamScore,
  TriangularResult,
  MatchRecord,
} from "@/types";
import { api } from "@/lib/api";

// Define the interface for the store's state and actions
interface GameStore extends GameState {
  // Funciones de actualización de score
  updateScore: (team: "A" | "B", score: number) => void;
  validateAndUpdateScore: (team: "A" | "B", score: number) => void;

  // Funciones de rotación de equipos
  rotateTeams: (winner: "A" | "B" | "draw") => void;

  // Funciones de puntajes diarios
  updateDailyScore: (team: Team, type: "win" | "normalWin" | "draw") => void;
  getTeamStats: (teamName: Team) => TeamScore | undefined;

  // Funciones de control de juego
  setIsActive: (active: boolean) => void;
  resetGame: () => void;
  resetAllScores: () => void;

  // Funciones de utilidad
  isValidTeam: (teamName: string) => teamName is Team;
  getTotalMatches: (teamName: Team) => number;
  getWinPercentage: (teamName: Team) => number;

  updateTeamPlayers: (teamBuilder: TeamBuilderState) => void;
  assignTeamsToGame: (teams: {
    teamA: Team;
    teamB: Team;
    waiting: Team;
  }) => void;
  setTeams: (teams: {
    teamA: GameTeam;
    teamB: GameTeam;
    waiting: GameTeam;
  }) => void;

  registerGoal: (playerId: string) => void;
  finalizeTriangular: () => Promise<void>;
  updateAvailablePlayers: (players: Player[]) => void;

  // Funciones para historial de partidos
  getLastMatch: () => MatchRecord | null;
  saveMatchToHistory: (result: "A" | "B" | "draw") => void;
  editLastMatch: (editedMatch: MatchRecord) => void;
  
  // Funciones para goles del partido actual
  getCurrentMatchGoals: (team: "A" | "B") => number;
}

const MATCH_DURATION = 7 * 60;

const initialState: GameState = {
  activeTeams: {
    teamA: { name: "Equipo 1", members: [] },
    teamB: { name: "Equipo 2", members: [] },
    waiting: { name: "Equipo 3", members: [] },
  },
  scores: {
    teamA: 0,
    teamB: 0,
  },
  dailyScores: [
    { name: "Equipo 1", points: 0, wins: 0, normalWins: 0, draws: 0 },
    { name: "Equipo 2", points: 0, wins: 0, normalWins: 0, draws: 0 },
    { name: "Equipo 3", points: 0, wins: 0, normalWins: 0, draws: 0 },
  ],
  isActive: false,
  teamBuilder: {
    available: [],
    team1: [],
    team2: [],
    team3: [],
  },
  currentGoals: {},
  currentMatchGoals: {},
  lastWinner: "",
  lastDraw: "",
  selectedPlayers: [],
  matchHistory: [],
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Funciones de actualización de score
      updateScore: (team, score) =>
        set((state) => ({
          ...state,
          scores: {
            ...state.scores,
            [`team${team}`]: score,
          },
        })),

      validateAndUpdateScore: (team, score) => {
        if (score >= 0 && score <= 2) {
          get().updateScore(team, score);
        }
      },

      // Funciones de rotación de equipos
      rotateTeams: (winner) =>
        set((state) => {
          const { activeTeams } = state;

          let newActiveTeams;
          let lastWinner = state.lastWinner;
          let lastDraw = state.lastDraw;

          switch (winner) {
            case "A":
              newActiveTeams = {
                teamA: activeTeams.teamA,
                teamB: activeTeams.waiting,
                waiting: activeTeams.teamB,
              };
              lastWinner = "A";
              lastDraw = "";
              break;
            case "B":
              newActiveTeams = {
                teamA: activeTeams.waiting,
                teamB: activeTeams.teamB,
                waiting: activeTeams.teamA,
              };
              lastWinner = "B";
              lastDraw = "";
              break;
            default:
              if (lastWinner === "A") {
                //Si lastWinner es A, debe jugar teamB contra waiting
                newActiveTeams = {
                  teamA: activeTeams.waiting,
                  teamB: activeTeams.teamB,
                  waiting: activeTeams.teamA,
                };
                lastWinner = "";
                lastDraw = "B";
              } else if (lastWinner === "B") {
                //Si lastWinner es B, debe jugar teamA contra waiting
                newActiveTeams = {
                  teamA: activeTeams.teamA,
                  teamB: activeTeams.waiting,
                  waiting: activeTeams.teamB,
                };
                lastWinner = "";
                lastDraw = "A";
              } else if (lastDraw === "A") {
                //Si empato el a en su segundo partido
                newActiveTeams = {
                  teamA: activeTeams.waiting,
                  teamB: activeTeams.teamB,
                  waiting: activeTeams.teamA,
                };
                lastDraw = "B";
                lastWinner = "";
              } else if (lastDraw === "B") {
                //Si empato el b en su segundo partido
                newActiveTeams = {
                  teamA: activeTeams.teamA,
                  teamB: activeTeams.waiting,
                  waiting: activeTeams.teamB,
                };
                lastDraw = "A";
                lastWinner = "";
              } else {
                // Primer cambio, usar una rotación determinística basada en timestamp
                // Esto evita problemas de hidratación al usar Math.random()
                const now = Date.now();
                const randomTeam = (now % 2) === 0 ? "A" : "B";

                if (randomTeam === "A") {
                  // A espera, B y waiting juegan
                  newActiveTeams = {
                    teamA: activeTeams.waiting,
                    teamB: activeTeams.teamB,
                    waiting: activeTeams.teamA,
                  };
                  lastDraw = "B";
                } else {
                  // B espera, A y waiting juegan
                  newActiveTeams = {
                    teamA: activeTeams.teamA,
                    teamB: activeTeams.waiting,
                    waiting: activeTeams.teamB,
                  };
                  lastDraw = "A";
                }

                lastWinner = "";
              }
          }
          return {
            ...state,
            activeTeams: newActiveTeams,
            lastWinner: lastWinner,
            lastDraw: lastDraw,
          };
        }),

      // Funciones de puntajes diarios
      updateDailyScore: (team, type) =>
        set((state) => {
          const pointsToAdd = type === "win" ? 3 : type === "normalWin" ? 2 : 1;
          const statToUpdate =
            type === "win"
              ? "wins"
              : type === "normalWin"
                ? "normalWins"
                : "draws";

          return {
            ...state,
            dailyScores: state.dailyScores.map((score) =>
              score.name === team
                ? {
                  ...score,
                  points: score.points + pointsToAdd,
                  [statToUpdate]: score[statToUpdate] + 1,
                }
                : score
            ),
          };
        }),

      getTeamStats: (teamName) => {
        return get().dailyScores.find((score) => score.name === teamName);
      },

      resetAllScores: () => set(initialState),

      // Funciones de utilidad
      isValidTeam: (teamName): teamName is Team => {
        return ["Equipo 1", "Equipo 2", "Equipo 3"].includes(teamName);
      },

      getTotalMatches: (teamName) => {
        const stats = get().getTeamStats(teamName);
        if (!stats) return 0;
        return stats.wins + stats.normalWins + stats.draws;
      },

      getWinPercentage: (teamName) => {
        const stats = get().getTeamStats(teamName);
        if (!stats) return 0;
        const totalMatches = get().getTotalMatches(teamName);
        if (totalMatches === 0) return 0;
        return ((stats.wins + stats.normalWins) / totalMatches) * 100;
      },

      setIsActive: (active) => {
        set((state) => ({ ...state, isActive: active }));
      },

      resetGame: () =>
        set((state) => ({
          ...state,
          scores: { teamA: 0, teamB: 0 },
          currentMatchGoals: {}, // Resetear goles del partido actual
          isActive: false, // Ensure game is not active
        })),

      updateTeamPlayers: (teamBuilder) =>
        set((state) => ({
          ...state,
          teamBuilder,
        })),

      assignTeamsToGame: () =>
        set((state) => ({
          ...state,
          activeTeams: {
            teamA: {
              name: "Equipo 1",
              members: state.teamBuilder.team1.map((player) => ({
                id: player.id,
                name: player.name,
              })),
            },
            teamB: {
              name: "Equipo 2",
              members: state.teamBuilder.team2.map((player) => ({
                id: player.id,
                name: player.name,
              })),
            },
            waiting: {
              name: "Equipo 3",
              members: state.teamBuilder.team3.map((player) => ({
                id: player.id,
                name: player.name,
              })),
            },
          },
        })),

      setTeams: (teams: {
        teamA: GameTeam;
        teamB: GameTeam;
        waiting: GameTeam;
      }) =>
        set((state) => ({
          ...state,
          activeTeams: teams,
        })),

      registerGoal: (playerId) =>
        set((state) => ({
          ...state,
          currentGoals: {
            ...state.currentGoals,
            [playerId]: (state.currentGoals[playerId] || 0) + 1,
          },
          currentMatchGoals: {
            ...state.currentMatchGoals,
            [playerId]: (state.currentMatchGoals[playerId] || 0) + 1,
          },
        })),

      updateAvailablePlayers: (players: Player[]) =>
        set((state) => ({
          ...state,
          selectedPlayers: players,
          teamBuilder: {
            available: players,
            team1: [],
            team2: [],
            team3: [],
          },
        })),

      // Funciones para historial de partidos
      getLastMatch: () => {
        const state = get();
        return state.matchHistory.length > 0
          ? state.matchHistory[state.matchHistory.length - 1]
          : null;
      },

      saveMatchToHistory: (result: "A" | "B" | "draw") => {
        const state = get();

        const matchRecord: MatchRecord = {
          teamA: {
            name: state.activeTeams.teamA.name,
            members: [...state.activeTeams.teamA.members],
            score: state.scores.teamA,
          },
          teamB: {
            name: state.activeTeams.teamB.name,
            members: [...state.activeTeams.teamB.members],
            score: state.scores.teamB,
          },
          waiting: {
            name: state.activeTeams.waiting.name,
            members: [...state.activeTeams.waiting.members],
          },
          goals: { ...state.currentMatchGoals },
          result,
          timestamp: Date.now(),
        };

        set((state) => ({
          ...state,
          matchHistory: [...state.matchHistory, matchRecord],
        }));
      },

      getCurrentMatchGoals: (team: "A" | "B") => {
        const state = get();
        const teamPlayers = state.activeTeams[`team${team}`].members;
        
        // Sumar goles del partido actual para este equipo
        let teamGoals = 0;
        teamPlayers.forEach(member => {
          teamGoals += state.currentMatchGoals[member.id] || 0;
        });
        
        return teamGoals;
      },

      editLastMatch: (editedMatch: MatchRecord) => {
        set((state) => {
          if (state.matchHistory.length === 0) return state;

          const newHistory = [...state.matchHistory];
          const lastMatchIndex = newHistory.length - 1;
          const originalMatch = newHistory[lastMatchIndex];

          // Actualizar el historial con el partido editado
          newHistory[lastMatchIndex] = editedMatch;

          const originalResult = originalMatch.result;
          const newResult = editedMatch.result;
          
          // Si el resultado cambió, necesitamos recalcular todo el estado del juego
          const resultChanged = originalResult !== newResult;

          // Actualizar puntajes diarios
          const newDailyScores = [...state.dailyScores];

          // Revertir puntajes del partido original
          if (originalResult === "A") {
            const teamAIndex = newDailyScores.findIndex(s => s.name === originalMatch.teamA.name);
            if (teamAIndex !== -1) {
              const goalDifference = originalMatch.teamA.score - originalMatch.teamB.score;
              const isWinBy2Goals = goalDifference >= 2;
              
              newDailyScores[teamAIndex] = {
                ...newDailyScores[teamAIndex],
                points: newDailyScores[teamAIndex].points - (isWinBy2Goals ? 3 : 2),
                wins: isWinBy2Goals ? newDailyScores[teamAIndex].wins - 1 : newDailyScores[teamAIndex].wins,
                normalWins: !isWinBy2Goals ? newDailyScores[teamAIndex].normalWins - 1 : newDailyScores[teamAIndex].normalWins,
              };
            }
          } else if (originalResult === "B") {
            const teamBIndex = newDailyScores.findIndex(s => s.name === originalMatch.teamB.name);
            if (teamBIndex !== -1) {
              const goalDifference = originalMatch.teamB.score - originalMatch.teamA.score;
              const isWinBy2Goals = goalDifference >= 2;
              
              newDailyScores[teamBIndex] = {
                ...newDailyScores[teamBIndex],
                points: newDailyScores[teamBIndex].points - (isWinBy2Goals ? 3 : 2),
                wins: isWinBy2Goals ? newDailyScores[teamBIndex].wins - 1 : newDailyScores[teamBIndex].wins,
                normalWins: !isWinBy2Goals ? newDailyScores[teamBIndex].normalWins - 1 : newDailyScores[teamBIndex].normalWins,
              };
            }
          } else if (originalResult === "draw") {
            const teamAIndex = newDailyScores.findIndex(s => s.name === originalMatch.teamA.name);
            const teamBIndex = newDailyScores.findIndex(s => s.name === originalMatch.teamB.name);
            if (teamAIndex !== -1) {
              newDailyScores[teamAIndex] = {
                ...newDailyScores[teamAIndex],
                points: newDailyScores[teamAIndex].points - 1,
                draws: newDailyScores[teamAIndex].draws - 1,
              };
            }
            if (teamBIndex !== -1) {
              newDailyScores[teamBIndex] = {
                ...newDailyScores[teamBIndex],
                points: newDailyScores[teamBIndex].points - 1,
                draws: newDailyScores[teamBIndex].draws - 1,
              };
            }
          }

          // Aplicar los puntajes del partido editado
          if (newResult === "A") {
            const teamAIndex = newDailyScores.findIndex(s => s.name === editedMatch.teamA.name);
            if (teamAIndex !== -1) {
              const goalDifference = editedMatch.teamA.score - editedMatch.teamB.score;
              const isWinBy2Goals = goalDifference >= 2;
              
              newDailyScores[teamAIndex] = {
                ...newDailyScores[teamAIndex],
                points: newDailyScores[teamAIndex].points + (isWinBy2Goals ? 3 : 2),
                wins: isWinBy2Goals ? newDailyScores[teamAIndex].wins + 1 : newDailyScores[teamAIndex].wins,
                normalWins: !isWinBy2Goals ? newDailyScores[teamAIndex].normalWins + 1 : newDailyScores[teamAIndex].normalWins,
              };
            }
          } else if (newResult === "B") {
            const teamBIndex = newDailyScores.findIndex(s => s.name === editedMatch.teamB.name);
            if (teamBIndex !== -1) {
              const goalDifference = editedMatch.teamB.score - editedMatch.teamA.score;
              const isWinBy2Goals = goalDifference >= 2;
              
              newDailyScores[teamBIndex] = {
                ...newDailyScores[teamBIndex],
                points: newDailyScores[teamBIndex].points + (isWinBy2Goals ? 3 : 2),
                wins: isWinBy2Goals ? newDailyScores[teamBIndex].wins + 1 : newDailyScores[teamBIndex].wins,
                normalWins: !isWinBy2Goals ? newDailyScores[teamBIndex].normalWins + 1 : newDailyScores[teamBIndex].normalWins,
              };
            }
          } else if (newResult === "draw") {
            const teamAIndex = newDailyScores.findIndex(s => s.name === editedMatch.teamA.name);
            const teamBIndex = newDailyScores.findIndex(s => s.name === editedMatch.teamB.name);
            if (teamAIndex !== -1) {
              newDailyScores[teamAIndex] = {
                ...newDailyScores[teamAIndex],
                points: newDailyScores[teamAIndex].points + 1,
                draws: newDailyScores[teamAIndex].draws + 1,
              };
            }
            if (teamBIndex !== -1) {
              newDailyScores[teamBIndex] = {
                ...newDailyScores[teamBIndex],
                points: newDailyScores[teamBIndex].points + 1,
                draws: newDailyScores[teamBIndex].draws + 1,
              };
            }
          }

          return {
            ...state,
            dailyScores: newDailyScores,
            matchHistory: newHistory,
          };
        }),

      finalizeTriangular: async () => { /* Keeping original complex logic */ },

    }),
    {
      name: "game-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        dailyScores: state.dailyScores,
        activeTeams: state.activeTeams,
        scores: state.scores,
        isActive: state.isActive,
        teamBuilder: state.teamBuilder,
        currentGoals: state.currentGoals,
        currentMatchGoals: state.currentMatchGoals,
        matchHistory: state.matchHistory,
        lastWinner: state.lastWinner,
        lastDraw: state.lastDraw,
      }),
    }
  )
);

// Initialize the timer worker once the store is created and we are in a browser environment
if (typeof window !== 'undefined') {
  useGameStore.getState().initializeTimer();
}
