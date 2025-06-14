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
          currentMatchGoals: {}, // Resetear goles del partido actual
          isActive: false, // Ensure game is not active
          timer: {
            ...state.timer,
            timeLeft: state.timer.MATCH_DURATION,
            isRunning: false, // Ensure timer is not running
          },
          // NO resetear currentGoals aquí porque necesitamos mantener
          // los goles acumulados del día para las estadísticas
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

          // Si el resultado cambió, recalcular el estado del juego desde el estado antes del último partido
          let newActiveTeams = state.activeTeams;
          let newLastWinner = state.lastWinner;
          let newLastDraw = state.lastDraw;

          if (resultChanged) {
            // Necesitamos recalcular las rotaciones basadas en el historial completo
            // Para simplificar, aplicamos la rotación con el nuevo resultado
            
            // Identificar qué equipos jugaron en el último partido
            const teamAName = originalMatch.teamA.name;
            const teamBName = originalMatch.teamB.name;
            const waitingTeamName = originalMatch.waiting.name;

            // Recrear el estado de equipos con los nombres originales del partido
            const teamsFromMatch = {
              teamA: { name: teamAName as Team, members: originalMatch.teamA.members },
              teamB: { name: teamBName as Team, members: originalMatch.teamB.members },
              waiting: { name: waitingTeamName as Team, members: originalMatch.waiting.members }
            };

            // Aplicar la rotación basada en el nuevo resultado
            switch (newResult) {
              case "A":
                newActiveTeams = {
                  teamA: teamsFromMatch.teamA,
                  teamB: teamsFromMatch.waiting,
                  waiting: teamsFromMatch.teamB,
                };
                newLastWinner = "A";
                newLastDraw = "";
                break;
              case "B":
                newActiveTeams = {
                  teamA: teamsFromMatch.waiting,
                  teamB: teamsFromMatch.teamB,
                  waiting: teamsFromMatch.teamA,
                };
                newLastWinner = "B";
                newLastDraw = "";
                break;
              case "draw":
                // Para empates, usar la misma lógica que rotateTeams
                if (state.lastWinner === "A") {
                  newActiveTeams = {
                    teamA: teamsFromMatch.waiting,
                    teamB: teamsFromMatch.teamB,
                    waiting: teamsFromMatch.teamA,
                  };
                  newLastWinner = "";
                  newLastDraw = "B";
                } else if (state.lastWinner === "B") {
                  newActiveTeams = {
                    teamA: teamsFromMatch.teamA,
                    teamB: teamsFromMatch.waiting,
                    waiting: teamsFromMatch.teamB,
                  };
                  newLastWinner = "";
                  newLastDraw = "A";
                } else {
                  // Usar rotación determinística para evitar problemas de hidratación
                  const now = Date.now();
                  const randomTeam = (now % 2) === 0 ? "A" : "B";

                  if (randomTeam === "A") {
                    newActiveTeams = {
                      teamA: teamsFromMatch.waiting,
                      teamB: teamsFromMatch.teamB,
                      waiting: teamsFromMatch.teamA,
                    };
                    newLastDraw = "B";
                  } else {
                    newActiveTeams = {
                      teamA: teamsFromMatch.teamA,
                      teamB: teamsFromMatch.waiting,
                      waiting: teamsFromMatch.teamB,
                    };
                    newLastDraw = "A";
                  }
                  newLastWinner = "";
                }
                break;
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
        currentMatchGoals: state.currentMatchGoals,
        matchHistory: state.matchHistory,
        lastWinner: state.lastWinner,
        lastDraw: state.lastDraw,
      }),
    }
  )
);
