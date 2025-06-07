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

  setTimeLeft: (time: number) => void;
  resetTimer: () => void;
  decrementTimer: () => void;

  startTimer: () => void;
  stopTimer: () => void;
  getTimeLeft: () => number;
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
  timer: {
    timeLeft: MATCH_DURATION,
    MATCH_DURATION,
    isRunning: false,
  },
  isActive: false,
  teamBuilder: {
    available: [],
    team1: [],
    team2: [],
    team3: [],
  },
  currentGoals: {},
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
          
          // Primero guardar el partido en el historial
          get().saveMatchToHistory(winner);
          
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

      setTimeLeft: (time) =>
        set((state) => ({
          ...state,
          timer: {
            ...state.timer,
            timeLeft: time,
          },
        })),

      resetTimer: () =>
        set((state) => ({
          ...state,
          timer: {
            ...state.timer,
            timeLeft: state.timer.MATCH_DURATION,
            isRunning: false,
          },
        })),

      decrementTimer: () =>
        set((state) => {
          const newTimeLeft = Math.max(0, state.timer.timeLeft - 1);
          return {
            ...state,
            timer: {
              ...state.timer,
              timeLeft: newTimeLeft,
            },
          };
        }),

      startTimer: () =>
        set((state) => ({
          ...state,
          timer: {
            ...state.timer,
            isRunning: true,
          },
        })),

      stopTimer: () =>
        set((state) => ({
          ...state,
          timer: {
            ...state.timer,
            isRunning: false,
          },
        })),

      getTimeLeft: () => {
        const state = get();
        return state.timer.timeLeft;
      },

      setIsActive: (active) => {
        if (active) {
          get().startTimer();
        } else {
          get().stopTimer();
        }
        set((state) => ({ ...state, isActive: active }));
      },

      resetGame: () =>
        set((state) => ({
          ...state,
          scores: { teamA: 0, teamB: 0 },
          isActive: false,
          timer: {
            ...state.timer,
            timeLeft: state.timer.MATCH_DURATION,
            isRunning: false,
          },
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
          goals: { ...state.currentGoals },
          result,
          timestamp: Date.now(),
        };

        set((state) => ({
          ...state,
          matchHistory: [...state.matchHistory, matchRecord],
        }));
      },

      editLastMatch: (editedMatch: MatchRecord) => {
        set((state) => {
          if (state.matchHistory.length === 0) return state;

          const newHistory = [...state.matchHistory];
          const lastMatchIndex = newHistory.length - 1;
          const originalMatch = newHistory[lastMatchIndex];
          
          // Actualizar el historial con el partido editado
          newHistory[lastMatchIndex] = editedMatch;

          // Ahora necesitamos recalcular el estado actual basado en los cambios
          // Primero, revertir los efectos del partido original
          const newDailyScores = [...state.dailyScores];
          const originalResult = originalMatch.result;
          
          // Revertir puntajes del partido original
          if (originalResult === "A") {
            // El equipo A había ganado con 2 goles
            const teamAIndex = newDailyScores.findIndex(s => s.name === originalMatch.teamA.name);
            if (teamAIndex !== -1) {
              newDailyScores[teamAIndex] = {
                ...newDailyScores[teamAIndex],
                points: newDailyScores[teamAIndex].points - 3,
                wins: newDailyScores[teamAIndex].wins - 1,
              };
            }
          } else if (originalResult === "B") {
            // El equipo B había ganado con 2 goles
            const teamBIndex = newDailyScores.findIndex(s => s.name === originalMatch.teamB.name);
            if (teamBIndex !== -1) {
              newDailyScores[teamBIndex] = {
                ...newDailyScores[teamBIndex],
                points: newDailyScores[teamBIndex].points - 3,
                wins: newDailyScores[teamBIndex].wins - 1,
              };
            }
          } else if (originalResult === "draw") {
            // Había sido empate
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
          const newResult = editedMatch.result;
          if (newResult === "A") {
            // El equipo A gana con 2 goles
            const teamAIndex = newDailyScores.findIndex(s => s.name === editedMatch.teamA.name);
            if (teamAIndex !== -1) {
              newDailyScores[teamAIndex] = {
                ...newDailyScores[teamAIndex],
                points: newDailyScores[teamAIndex].points + 3,
                wins: newDailyScores[teamAIndex].wins + 1,
              };
            }
          } else if (newResult === "B") {
            // El equipo B gana con 2 goles
            const teamBIndex = newDailyScores.findIndex(s => s.name === editedMatch.teamB.name);
            if (teamBIndex !== -1) {
              newDailyScores[teamBIndex] = {
                ...newDailyScores[teamBIndex],
                points: newDailyScores[teamBIndex].points + 3,
                wins: newDailyScores[teamBIndex].wins + 1,
              };
            }
          } else if (newResult === "draw") {
            // Empate
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

          // Actualizar los goles actuales con los del partido editado
          const newCurrentGoals = { ...state.currentGoals };
          
          // Restar goles del partido original
          Object.keys(originalMatch.goals).forEach(playerId => {
            if (newCurrentGoals[playerId]) {
              newCurrentGoals[playerId] = Math.max(0, newCurrentGoals[playerId] - originalMatch.goals[playerId]);
              if (newCurrentGoals[playerId] === 0) {
                delete newCurrentGoals[playerId];
              }
            }
          });
          
          // Sumar goles del partido editado
          Object.keys(editedMatch.goals).forEach(playerId => {
            newCurrentGoals[playerId] = (newCurrentGoals[playerId] || 0) + editedMatch.goals[playerId];
          });

          // Recalcular la rotación de equipos basada en el nuevo resultado
          let newActiveTeams = { ...state.activeTeams };
          let newLastWinner = state.lastWinner;
          let newLastDraw = state.lastDraw;

          // Si el resultado cambió, necesitamos recalcular quién debería estar jugando
          if (originalResult !== newResult) {
            // Revertir a los equipos del partido editado
            newActiveTeams = {
              teamA: {
                name: editedMatch.teamA.name as Team,
                members: editedMatch.teamA.members,
              },
              teamB: {
                name: editedMatch.teamB.name as Team,
                members: editedMatch.teamB.members,
              },
              waiting: {
                name: editedMatch.waiting.name as Team,
                members: editedMatch.waiting.members,
              },
            };

            // Aplicar la rotación basada en el nuevo resultado
            if (newResult === "A") {
              newActiveTeams = {
                teamA: newActiveTeams.teamA,
                teamB: newActiveTeams.waiting,
                waiting: newActiveTeams.teamB,
              };
              newLastWinner = "A";
              newLastDraw = "";
            } else if (newResult === "B") {
              newActiveTeams = {
                teamA: newActiveTeams.waiting,
                teamB: newActiveTeams.teamB,
                waiting: newActiveTeams.teamA,
              };
              newLastWinner = "B";
              newLastDraw = "";
            } else {
              // Empate - aplicar lógica de empate
              if (newLastWinner === "A") {
                newActiveTeams = {
                  teamA: newActiveTeams.waiting,
                  teamB: newActiveTeams.teamB,
                  waiting: newActiveTeams.teamA,
                };
                newLastWinner = "";
                newLastDraw = "B";
              } else if (newLastWinner === "B") {
                newActiveTeams = {
                  teamA: newActiveTeams.teamA,
                  teamB: newActiveTeams.waiting,
                  waiting: newActiveTeams.teamB,
                };
                newLastWinner = "";
                newLastDraw = "A";
                             } else {
                 // Rotación determinística para primer empate (evita problemas de hidratación)
                 const now = Date.now();
                 const randomTeam = (now % 2) === 0 ? "A" : "B";
                 if (randomTeam === "A") {
                   newActiveTeams = {
                     teamA: newActiveTeams.waiting,
                     teamB: newActiveTeams.teamB,
                     waiting: newActiveTeams.teamA,
                   };
                   newLastDraw = "B";
                 } else {
                   newActiveTeams = {
                     teamA: newActiveTeams.teamA,
                     teamB: newActiveTeams.waiting,
                     waiting: newActiveTeams.teamB,
                   };
                   newLastDraw = "A";
                 }
                 newLastWinner = "";
               }
            }
          }

          return {
            ...state,
            matchHistory: newHistory,
            dailyScores: newDailyScores,
            currentGoals: newCurrentGoals,
            activeTeams: newActiveTeams,
            lastWinner: newLastWinner,
            lastDraw: newLastDraw,
          };
        });
      },

      finalizeTriangular: async () => {
        const state = get();

        // Obtener los datos de los equipos
        const teamsData = [
          {
            index: 0,
            name: "Equipo 1",
            score: state.dailyScores[0].points,
            members: state.activeTeams.teamA.members,
            stats: state.dailyScores[0],
          },
          {
            index: 1,
            name: "Equipo 2",
            score: state.dailyScores[1].points,
            members: state.activeTeams.teamB.members,
            stats: state.dailyScores[1],
          },
          {
            index: 2,
            name: "Equipo 3",
            score: state.dailyScores[2].points,
            members: state.activeTeams.waiting.members,
            stats: state.dailyScores[2],
          },
        ].sort((a, b) => b.score - a.score);

        // Crear el resultado del triangular
        const result: TriangularResult = {
          date: new Date().toISOString(),
          teams: {
            first: {
              name: teamsData[0].name as Team,
              players: teamsData[0].members.map((m) => m.id),
              points: teamsData[0].score,
              wins: teamsData[0].stats.wins,
              normalWins: teamsData[0].stats.normalWins,
              draws: teamsData[0].stats.draws,
            },
            second: {
              name: teamsData[1].name as Team,
              players: teamsData[1].members.map((m) => m.id),
              points: teamsData[1].score,
              wins: teamsData[1].stats.wins,
              normalWins: teamsData[1].stats.normalWins,
              draws: teamsData[1].stats.draws,
            },
            third: {
              name: teamsData[2].name as Team,
              players: teamsData[2].members.map((m) => m.id),
              points: teamsData[2].score,
              wins: teamsData[2].stats.wins,
              normalWins: teamsData[2].stats.normalWins,
              draws: teamsData[2].stats.draws,
            },
          },
          // Mantener los IDs como strings, sin convertir a Number
          scorers: state.currentGoals,
        };

        console.log("Enviando resultado del triangular:", result);

        // Enviar el resultado al servidor
        await api.triangular.postTriangularResult(result);

        // Resetear el estado
        set((state) => ({
          ...state,
          currentGoals: {},
          matchHistory: [], // Limpiar historial al finalizar triangular
          dailyScores: [
            { name: "Equipo 1", points: 0, wins: 0, normalWins: 0, draws: 0 },
            { name: "Equipo 2", points: 0, wins: 0, normalWins: 0, draws: 0 },
            { name: "Equipo 3", points: 0, wins: 0, normalWins: 0, draws: 0 },
          ],
          scores: {
            teamA: 0,
            teamB: 0,
          },
          isActive: false,
          timer: {
            ...state.timer,
            timeLeft: state.timer.MATCH_DURATION,
            isRunning: false,
          },
        }));
      },
    }),

    {
      name: "game-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        dailyScores: state.dailyScores,
        activeTeams: state.activeTeams,
        scores: state.scores,
        isActive: state.isActive,
        timer: state.timer,
        teamBuilder: state.teamBuilder,
        currentGoals: state.currentGoals,
        matchHistory: state.matchHistory,
        lastWinner: state.lastWinner,
        lastDraw: state.lastDraw,
      }),
    }
  )
);
